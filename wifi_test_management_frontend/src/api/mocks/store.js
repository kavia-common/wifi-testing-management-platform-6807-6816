import { getMockProjectsSeed } from "../../pages/projectsMockData";
import {
  deriveUsageForNewTestCase,
  getMockTestCasesSeed,
  makeTestCaseId,
} from "../../pages/testCasesMockData";
import { stableTestCaseKey } from "../../utils/testPlanParser";
import {
  getMockExecutionsSeed,
  hydrateExecutionDerivedFields,
  makeExecutionId,
} from "../../pages/executionsMockData";
import { getMockResultsSeed, makeResultId } from "../../pages/resultsMockData";

const STORAGE_KEY = "wifiTestMgmt.mockStore.v1";

function safeLoad() {
  try {
    const raw = window?.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeSave(state) {
  try {
    window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function nowIso() {
  return new Date().toISOString();
}

function seedState() {
  const projects = getMockProjectsSeed();
  const testCases = getMockTestCasesSeed();
  const executions = getMockExecutionsSeed();
  const results = getMockResultsSeed();

  return {
    projects,
    testCases,
    executions,
    results,
    meta: { seededAt: nowIso() },
  };
}

function normalizeState(state) {
  // Ensure required arrays exist even if older persisted shape.
  return {
    projects: Array.isArray(state?.projects) ? state.projects : [],
    testCases: Array.isArray(state?.testCases) ? state.testCases : [],
    executions: Array.isArray(state?.executions) ? state.executions : [],
    results: Array.isArray(state?.results) ? state.results : [],
    meta: state?.meta || {},
  };
}

const inMemory = {
  state: normalizeState(safeLoad() || seedState()),
};

function persist() {
  safeSave(inMemory.state);
}

// PUBLIC_INTERFACE
export function resetMockStore() {
  /** Resets the mock store back to original seeds. */
  inMemory.state = seedState();
  persist();
  return inMemory.state;
}

// PUBLIC_INTERFACE
export function getMockStoreSnapshot() {
  /** Returns a deep-ish copy snapshot of the current store. */
  return JSON.parse(JSON.stringify(inMemory.state));
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function notFound(entity, id) {
  return {
    type: "mock",
    status: 404,
    message: `${entity} not found: ${id}`,
    details: { entity, id },
  };
}

/* -------------------- Projects -------------------- */

// PUBLIC_INTERFACE
export async function mockListProjects() {
  await delay();
  return getMockStoreSnapshot().projects;
}

// PUBLIC_INTERFACE
export async function mockGetProject(id) {
  await delay();
  const p = inMemory.state.projects.find((x) => String(x.id) === String(id));
  if (!p) throw notFound("project", id);
  return JSON.parse(JSON.stringify(p));
}

// PUBLIC_INTERFACE
export async function mockCreateProject(input) {
  await delay();
  const id = input?.id || `proj-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = nowIso();
  const project = {
    id,
    name: String(input?.name || "New project"),
    owner: String(input?.owner || "Unknown"),
    environment: String(input?.environment || "Unknown"),
    status: String(input?.status || "Active"),
    tags: Array.isArray(input?.tags) ? input.tags : [],
    description: String(input?.description || ""),
    createdAt,
    updatedAt: createdAt,
    counts: input?.counts || { testCases: 0, executions: 0, results: 0 },
  };

  inMemory.state.projects = [project, ...inMemory.state.projects];
  persist();
  return JSON.parse(JSON.stringify(project));
}

// PUBLIC_INTERFACE
export async function mockUpdateProject(id, patch) {
  await delay();
  const idx = inMemory.state.projects.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) throw notFound("project", id);

  const existing = inMemory.state.projects[idx];
  const next = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: nowIso(),
  };

  inMemory.state.projects = inMemory.state.projects.map((p, i) => (i === idx ? next : p));
  persist();
  return JSON.parse(JSON.stringify(next));
}

// PUBLIC_INTERFACE
export async function mockDeleteProject(id) {
  await delay();
  const before = inMemory.state.projects.length;
  inMemory.state.projects = inMemory.state.projects.filter((p) => String(p.id) !== String(id));
  if (inMemory.state.projects.length === before) throw notFound("project", id);

  // Keep other entities as-is for now (no cascade deletes in mock).
  persist();
  return { ok: true };
}

/* -------------------- Test Cases -------------------- */

// PUBLIC_INTERFACE
export async function mockImportTestCases(items) {
  /**
   * Imports and persists a batch of test cases into the mock store.
   * - Merges with existing entries
   * - De-duplicates by stable key (projectId + name)
   * - Never removes existing entries
   *
   * Returns: { added: number, updated: number, skipped: number, total: number }
   */
  await delay();

  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return { added: 0, updated: 0, skipped: 0, total: inMemory.state.testCases.length };
  }

  // Index existing by stable key
  const existingByKey = new Map();
  for (const tc of inMemory.state.testCases) {
    existingByKey.set(stableTestCaseKey(tc), tc);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  const now = nowIso();

  for (const incomingRaw of list) {
    const incoming = incomingRaw && typeof incomingRaw === "object" ? incomingRaw : null;
    if (!incoming) {
      skipped += 1;
      continue;
    }

    const key = stableTestCaseKey(incoming);
    if (!key.includes("::") || key.endsWith("::")) {
      skipped += 1;
      continue;
    }

    const existing = existingByKey.get(key);
    if (existing) {
      // Merge: preserve existing.id, createdAt; update description/tags/params if provided.
      const next = {
        ...existing,
        name: String(incoming.name || existing.name),
        projectId: String(incoming.projectId || existing.projectId),
        description: String(incoming.description ?? existing.description ?? ""),
        tags: Array.isArray(incoming.tags) ? incoming.tags : existing.tags || [],
        parameters: Array.isArray(incoming.parameters) ? incoming.parameters : existing.parameters || [],
        usage: existing.usage || incoming.usage || deriveUsageForNewTestCase(),
        updatedAt: now,
      };

      inMemory.state.testCases = inMemory.state.testCases.map((t) => (t.id === existing.id ? next : t));
      existingByKey.set(key, next);
      updated += 1;
      continue;
    }

    const id = incoming.id || makeTestCaseId();
    const usage = incoming.usage || deriveUsageForNewTestCase();

    const tc = {
      id,
      name: String(incoming.name || "Imported test case"),
      description: String(incoming.description || ""),
      projectId: String(incoming.projectId || ""),
      tags: Array.isArray(incoming.tags) ? incoming.tags : [],
      parameters: Array.isArray(incoming.parameters) ? incoming.parameters : [],
      usage,
      createdAt: incoming.createdAt || now,
      updatedAt: now,
    };

    inMemory.state.testCases = [tc, ...inMemory.state.testCases];
    existingByKey.set(key, tc);
    added += 1;

    // Best-effort update project counts
    inMemory.state.projects = inMemory.state.projects.map((p) => {
      if (String(p.id) !== String(tc.projectId)) return p;
      return {
        ...p,
        updatedAt: now,
        counts: {
          ...(p.counts || {}),
          testCases: (p.counts?.testCases ?? 0) + 1,
        },
      };
    });
  }

  persist();
  return { added, updated, skipped, total: inMemory.state.testCases.length };
}

// PUBLIC_INTERFACE
export async function mockListTestCases() {
  await delay();
  return getMockStoreSnapshot().testCases;
}

// PUBLIC_INTERFACE
export async function mockGetTestCase(id) {
  await delay();
  const tc = inMemory.state.testCases.find((x) => String(x.id) === String(id));
  if (!tc) throw notFound("testCase", id);
  return JSON.parse(JSON.stringify(tc));
}

// PUBLIC_INTERFACE
export async function mockCreateTestCase(input) {
  await delay();
  const now = nowIso();
  const id = input?.id || makeTestCaseId();
  const usage = input?.usage || deriveUsageForNewTestCase();

  const tc = {
    id,
    name: String(input?.name || "New test case"),
    description: String(input?.description || ""),
    projectId: String(input?.projectId || ""),
    tags: Array.isArray(input?.tags) ? input.tags : [],
    parameters: Array.isArray(input?.parameters) ? input.parameters : [],
    usage,
    createdAt: now,
    updatedAt: now,
  };

  inMemory.state.testCases = [tc, ...inMemory.state.testCases];

  // Update project counts (best-effort)
  inMemory.state.projects = inMemory.state.projects.map((p) => {
    if (String(p.id) !== String(tc.projectId)) return p;
    return {
      ...p,
      updatedAt: now,
      counts: {
        ...(p.counts || {}),
        testCases: (p.counts?.testCases ?? 0) + 1,
      },
    };
  });

  persist();
  return JSON.parse(JSON.stringify(tc));
}

// PUBLIC_INTERFACE
export async function mockUpdateTestCase(id, patch) {
  await delay();
  const idx = inMemory.state.testCases.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) throw notFound("testCase", id);

  const existing = inMemory.state.testCases[idx];
  const next = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: nowIso(),
  };

  inMemory.state.testCases = inMemory.state.testCases.map((t, i) => (i === idx ? next : t));
  persist();
  return JSON.parse(JSON.stringify(next));
}

// PUBLIC_INTERFACE
export async function mockDeleteTestCase(id) {
  await delay();
  const before = inMemory.state.testCases.length;
  const deleting = inMemory.state.testCases.find((t) => String(t.id) === String(id)) || null;
  inMemory.state.testCases = inMemory.state.testCases.filter((t) => String(t.id) !== String(id));
  if (inMemory.state.testCases.length === before) throw notFound("testCase", id);

  // Best-effort decrement project counts
  if (deleting) {
    inMemory.state.projects = inMemory.state.projects.map((p) => {
      if (String(p.id) !== String(deleting.projectId)) return p;
      return {
        ...p,
        updatedAt: nowIso(),
        counts: {
          ...(p.counts || {}),
          testCases: Math.max(0, (p.counts?.testCases ?? 0) - 1),
        },
      };
    });
  }

  persist();
  return { ok: true };
}

/* -------------------- Executions -------------------- */

function hydrateExecution(e) {
  // Re-hydrate derived fields based on current projects/testCases.
  return hydrateExecutionDerivedFields(e, inMemory.state.projects, inMemory.state.testCases);
}

// PUBLIC_INTERFACE
export async function mockListExecutions() {
  await delay();
  return getMockStoreSnapshot().executions.map(hydrateExecution);
}

// PUBLIC_INTERFACE
export async function mockGetExecution(id) {
  await delay();
  const e = inMemory.state.executions.find((x) => String(x.id) === String(id));
  if (!e) throw notFound("execution", id);
  return JSON.parse(JSON.stringify(hydrateExecution(e)));
}

// PUBLIC_INTERFACE
export async function mockCreateExecution(input) {
  await delay();
  const now = nowIso();
  const id = input?.id || makeExecutionId();

  const e = hydrateExecution({
    id,
    projectId: String(input?.projectId || ""),
    testCaseId: String(input?.testCaseId || ""),
    status: String(input?.status || "Queued"),
    createdAt: input?.createdAt || now,
    scheduledAt: input?.scheduledAt || null,
    startedAt: input?.startedAt || null,
    finishedAt: input?.finishedAt || null,
    expectedDurationSec: Number(input?.expectedDurationSec ?? 240),
    parameters: Array.isArray(input?.parameters) ? input.parameters : [],
    timeline: input?.timeline, // will be overwritten by hydrate
    logs: input?.logs, // will be overwritten by hydrate
  });

  inMemory.state.executions = [e, ...inMemory.state.executions];

  // Project counts best-effort
  inMemory.state.projects = inMemory.state.projects.map((p) => {
    if (String(p.id) !== String(e.projectId)) return p;
    return {
      ...p,
      updatedAt: now,
      counts: {
        ...(p.counts || {}),
        executions: (p.counts?.executions ?? 0) + 1,
      },
    };
  });

  persist();
  return JSON.parse(JSON.stringify(e));
}

// PUBLIC_INTERFACE
export async function mockUpdateExecution(id, patch) {
  await delay();
  const idx = inMemory.state.executions.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) throw notFound("execution", id);

  const existing = inMemory.state.executions[idx];
  const next = hydrateExecution({
    ...existing,
    ...patch,
    id: existing.id,
  });

  inMemory.state.executions = inMemory.state.executions.map((e, i) => (i === idx ? next : e));
  persist();
  return JSON.parse(JSON.stringify(next));
}

// PUBLIC_INTERFACE
export async function mockDeleteExecution(id) {
  await delay();
  const before = inMemory.state.executions.length;
  inMemory.state.executions = inMemory.state.executions.filter((e) => String(e.id) !== String(id));
  if (inMemory.state.executions.length === before) throw notFound("execution", id);

  persist();
  return { ok: true };
}

/* -------------------- Results -------------------- */

// PUBLIC_INTERFACE
export async function mockListResults() {
  await delay();
  return getMockStoreSnapshot().results;
}

// PUBLIC_INTERFACE
export async function mockGetResult(id) {
  await delay();
  const r = inMemory.state.results.find((x) => String(x.id) === String(id));
  if (!r) throw notFound("result", id);
  return JSON.parse(JSON.stringify(r));
}

// PUBLIC_INTERFACE
export async function mockCreateResult(input) {
  await delay();
  const now = nowIso();
  const id = input?.id || makeResultId();

  const r = {
    id,
    executionId: String(input?.executionId || ""),
    projectId: String(input?.projectId || ""),
    status: String(input?.status || "Pass"),
    createdAt: input?.createdAt || now,
    durationSec: Number(input?.durationSec ?? 0),
    device: String(input?.device || "Unknown"),
    testCaseName: String(input?.testCaseName || ""),
    summary: String(input?.summary || ""),
    metrics: input?.metrics || {},
    artifacts: Array.isArray(input?.artifacts) ? input.artifacts : [],
  };

  inMemory.state.results = [r, ...inMemory.state.results];

  // Project counts best-effort
  inMemory.state.projects = inMemory.state.projects.map((p) => {
    if (String(p.id) !== String(r.projectId)) return p;
    return {
      ...p,
      updatedAt: now,
      counts: {
        ...(p.counts || {}),
        results: (p.counts?.results ?? 0) + 1,
      },
    };
  });

  persist();
  return JSON.parse(JSON.stringify(r));
}

// PUBLIC_INTERFACE
export async function mockUpdateResult(id, patch) {
  await delay();
  const idx = inMemory.state.results.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) throw notFound("result", id);

  const existing = inMemory.state.results[idx];
  const next = {
    ...existing,
    ...patch,
    id: existing.id,
  };

  inMemory.state.results = inMemory.state.results.map((r, i) => (i === idx ? next : r));
  persist();
  return JSON.parse(JSON.stringify(next));
}

// PUBLIC_INTERFACE
export async function mockDeleteResult(id) {
  await delay();
  const before = inMemory.state.results.length;
  inMemory.state.results = inMemory.state.results.filter((r) => String(r.id) !== String(id));
  if (inMemory.state.results.length === before) throw notFound("result", id);

  persist();
  return { ok: true };
}

