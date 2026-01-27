import { err, ok } from "../http/result";

/**
 * Simple in-memory mock adapter.
 * - Mimics the base client's get/post/put/del interface
 * - Provides stable mock data for the UI
 *
 * NOTE: This is intentionally minimal and can be replaced with MSW later.
 */

function nowIso() {
  return new Date().toISOString();
}

function clone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

function parseQuery(urlOrPath) {
  const idx = urlOrPath.indexOf("?");
  if (idx < 0) return {};
  const qs = new URLSearchParams(urlOrPath.slice(idx + 1));
  return Object.fromEntries(qs.entries());
}

function stripQuery(urlOrPath) {
  const idx = urlOrPath.indexOf("?");
  return idx < 0 ? urlOrPath : urlOrPath.slice(0, idx);
}

function idFromPath(path, prefix) {
  const clean = stripQuery(path);
  const parts = clean.split("/").filter(Boolean);
  const i = parts.indexOf(prefix);
  if (i >= 0 && parts[i + 1]) return parts[i + 1];
  // Support /projects/:id style too
  if (parts[0] === prefix && parts[1]) return parts[1];
  return null;
}

function listOr404(store, id) {
  if (!id) return ok(clone(store));
  const found = store.find((x) => x.id === id);
  if (!found) return err({ status: 404, message: "Not found" });
  return ok(clone(found));
}

function createItem(store, body, prefix) {
  const id =
    body?.id ||
    `${prefix}-${Math.random().toString(16).slice(2, 6)}${Date.now()
      .toString(16)
      .slice(-4)}`;

  const item = {
    ...clone(body),
    id,
    createdAt: body?.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
  store.unshift(item);
  return ok(clone(item), { status: 201 });
}

function updateItem(store, id, body) {
  const idx = store.findIndex((x) => x.id === id);
  if (idx < 0) return err({ status: 404, message: "Not found" });
  store[idx] = {
    ...store[idx],
    ...clone(body),
    id,
    updatedAt: nowIso(),
  };
  return ok(clone(store[idx]));
}

function deleteItem(store, id) {
  const idx = store.findIndex((x) => x.id === id);
  if (idx < 0) return err({ status: 404, message: "Not found" });
  store.splice(idx, 1);
  return ok({ id, deleted: true });
}

// PUBLIC_INTERFACE
export function createMockAdapter({ latencyMs = 250 } = {}) {
  /** Creates a mock adapter with get/post/put/del methods returning result objects. */

  const db = {
    projects: [
      {
        id: "p-001",
        name: "Office AP Regression",
        description: "Baseline regression for office AP firmware changes.",
        status: "Active",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: "p-002",
        name: "Mesh Roaming Validation",
        description: "Roaming, handoff, and client stickiness suite.",
        status: "Active",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
    testCases: [
      {
        id: "tc-101",
        name: "Throughput (UDP) - 5GHz",
        projectId: "p-001",
        tags: ["throughput", "udp", "5ghz"],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: "tc-102",
        name: "Roaming - Sticky Client",
        projectId: "p-002",
        tags: ["roaming"],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
    executions: [
      {
        id: "ex-9001",
        projectId: "p-001",
        testCaseId: "tc-101",
        label: "Nightly regression",
        status: "Completed",
        startedAt: nowIso(),
        finishedAt: nowIso(),
      },
      {
        id: "ex-9002",
        projectId: "p-002",
        testCaseId: "tc-102",
        label: "Roaming soak test",
        status: "Running",
        startedAt: nowIso(),
      },
    ],
    results: [
      {
        id: "r-7001",
        executionId: "ex-9001",
        verdict: "PASS",
        label: "Throughput - 5GHz",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: "r-7002",
        executionId: "ex-9001",
        verdict: "FAIL",
        label: "Latency - VoIP profile",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
  };

  function sleep() {
    return new Promise((r) => setTimeout(r, latencyMs));
  }

  async function get(path) {
    await sleep();

    if (path.startsWith("/projects")) {
      const id = idFromPath(path, "projects");
      return listOr404(db.projects, id);
    }

    if (path.startsWith("/test-cases")) {
      const id = idFromPath(path, "test-cases");
      const query = parseQuery(path);

      // minimal filtering support by projectId
      if (!id && query.projectId) {
        return ok(
          clone(db.testCases.filter((t) => t.projectId === query.projectId))
        );
      }

      return listOr404(db.testCases, id);
    }

    if (path.startsWith("/executions")) {
      const id = idFromPath(path, "executions");
      const query = parseQuery(path);

      if (!id && query.projectId) {
        return ok(
          clone(db.executions.filter((e) => e.projectId === query.projectId))
        );
      }

      return listOr404(db.executions, id);
    }

    if (path.startsWith("/results")) {
      const id = idFromPath(path, "results");
      const query = parseQuery(path);

      if (!id && query.executionId) {
        return ok(
          clone(db.results.filter((r) => r.executionId === query.executionId))
        );
      }

      return listOr404(db.results, id);
    }

    return err({ status: 404, message: "Unknown mock route" });
  }

  async function post(path, body) {
    await sleep();

    if (path.startsWith("/projects")) return createItem(db.projects, body, "p");
    if (path.startsWith("/test-cases"))
      return createItem(db.testCases, body, "tc");
    if (path.startsWith("/executions"))
      return createItem(db.executions, body, "ex");
    if (path.startsWith("/results")) return createItem(db.results, body, "r");

    return err({ status: 404, message: "Unknown mock route" });
  }

  async function put(path, body) {
    await sleep();

    if (path.startsWith("/projects")) {
      const id = idFromPath(path, "projects");
      return updateItem(db.projects, id, body);
    }
    if (path.startsWith("/test-cases")) {
      const id = idFromPath(path, "test-cases");
      return updateItem(db.testCases, id, body);
    }
    if (path.startsWith("/executions")) {
      const id = idFromPath(path, "executions");
      return updateItem(db.executions, id, body);
    }
    if (path.startsWith("/results")) {
      const id = idFromPath(path, "results");
      return updateItem(db.results, id, body);
    }

    return err({ status: 404, message: "Unknown mock route" });
  }

  async function del(path) {
    await sleep();

    if (path.startsWith("/projects")) {
      const id = idFromPath(path, "projects");
      return deleteItem(db.projects, id);
    }
    if (path.startsWith("/test-cases")) {
      const id = idFromPath(path, "test-cases");
      return deleteItem(db.testCases, id);
    }
    if (path.startsWith("/executions")) {
      const id = idFromPath(path, "executions");
      return deleteItem(db.executions, id);
    }
    if (path.startsWith("/results")) {
      const id = idFromPath(path, "results");
      return deleteItem(db.results, id);
    }

    return err({ status: 404, message: "Unknown mock route" });
  }

  return { get, post, put, del };
}
