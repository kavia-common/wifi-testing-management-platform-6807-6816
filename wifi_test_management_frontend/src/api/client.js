import { getEnvConfig } from "../app/config/env";

/**
 * This client intentionally avoids inventing backend endpoints.
 * When mockApiEnabled is true, we return in-memory data with latency simulation.
 * When false, we provide stubs that fail with a clear message until a contract exists.
 */

const LATENCY_MS = 450;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

const mockDb = {
  projects: [
    { id: "p1", name: "Campus WiFi Rollout", owner: "A. Chen", status: "Active", updatedAt: nowIso() },
    { id: "p2", name: "IoT Device Certification", owner: "M. Patel", status: "Active", updatedAt: nowIso() },
    { id: "p3", name: "Legacy AP Audit", owner: "S. Nguyen", status: "Archived", updatedAt: nowIso() }
  ],
  testCases: [
    { id: "TC-1001", title: "WPA2 Enterprise Auth", projectId: "p1", projectName: "Campus WiFi Rollout", priority: "High", updatedAt: nowIso() },
    { id: "TC-1002", title: "Roaming Handoff", projectId: "p1", projectName: "Campus WiFi Rollout", priority: "Medium", updatedAt: nowIso() },
    { id: "TC-2001", title: "Throughput Baseline", projectId: "p2", projectName: "IoT Device Certification", priority: "Low", updatedAt: nowIso() }
  ],
  testRuns: [
    { id: "R-31001", projectId: "p1", projectName: "Campus WiFi Rollout", status: "Passed", startedAt: nowIso(), durationSec: 732 },
    { id: "R-31002", projectId: "p2", projectName: "IoT Device Certification", status: "Failed", startedAt: nowIso(), durationSec: 488 },
    { id: "R-31003", projectId: "p1", projectName: "Campus WiFi Rollout", status: "Queued", startedAt: nowIso(), durationSec: 0 }
  ],
  results: [
    { id: "RES-1", runId: "R-31001", testCaseId: "TC-1001", testCaseTitle: "WPA2 Enterprise Auth", status: "Passed", durationSec: 88 },
    { id: "RES-2", runId: "R-31001", testCaseId: "TC-1002", testCaseTitle: "Roaming Handoff", status: "Passed", durationSec: 112 },
    { id: "RES-3", runId: "R-31002", testCaseId: "TC-2001", testCaseTitle: "Throughput Baseline", status: "Failed", durationSec: 95 }
  ]
};

// PUBLIC_INTERFACE
export function getApiClient() {
  /** Returns an API client object that is mockable via REACT_APP_FEATURE_FLAGS including "mockApi". */
  const cfg = getEnvConfig();
  const isMock = cfg.mockApiEnabled;

  const notReady = async () => {
    await sleep(150);
    throw new Error(
      "API client is in real mode but backend contract/endpoints are not configured yet. Enable mock mode via REACT_APP_FEATURE_FLAGS=\"mockApi\"."
    );
  };

  if (!isMock) {
    // Keep signatures stable; swap with real fetch logic once endpoints are defined.
    return {
      apiBase: cfg.apiBase,
      getProjects: notReady,
      createProject: notReady,
      getTestCases: notReady,
      createTestCase: notReady,
      getTestRuns: notReady,
      startTestRun: notReady,
      getResults: notReady
    };
  }

  return {
    apiBase: cfg.apiBase,

    // PUBLIC_INTERFACE
    async getProjects() {
      /** Returns list of projects. */
      await sleep(LATENCY_MS);
      return [...mockDb.projects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },

    // PUBLIC_INTERFACE
    async createProject(input) {
      /** Creates a project (mock). @param {{name:string, owner:string}} input */
      await sleep(LATENCY_MS);
      const created = { id: makeId("p"), name: input.name, owner: input.owner, status: "Active", updatedAt: nowIso() };
      mockDb.projects.unshift(created);
      return created;
    },

    // PUBLIC_INTERFACE
    async getTestCases() {
      /** Returns list of test cases. */
      await sleep(LATENCY_MS);
      return [...mockDb.testCases].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },

    // PUBLIC_INTERFACE
    async createTestCase(input) {
      /** Creates a test case (mock). @param {{title:string, projectId:string, priority:"Low"|"Medium"|"High"}} input */
      await sleep(LATENCY_MS);
      const project = mockDb.projects.find((p) => p.id === input.projectId);
      const created = {
        id: `TC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: input.title,
        projectId: input.projectId,
        projectName: project ? project.name : "Unknown",
        priority: input.priority,
        updatedAt: nowIso()
      };
      mockDb.testCases.unshift(created);
      return created;
    },

    // PUBLIC_INTERFACE
    async getTestRuns() {
      /** Returns list of test runs. */
      await sleep(LATENCY_MS);
      return [...mockDb.testRuns].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    },

    // PUBLIC_INTERFACE
    async startTestRun(input) {
      /**
       * Starts a test run (mock).
       * @param {{projectId:string, testCaseIds:string[]}} input
       */
      await sleep(LATENCY_MS);
      const project = mockDb.projects.find((p) => p.id === input.projectId);
      const created = {
        id: `R-${Math.floor(30000 + Math.random() * 9000)}`,
        projectId: input.projectId,
        projectName: project ? project.name : "Unknown",
        status: "Queued",
        startedAt: nowIso(),
        durationSec: 0
      };
      mockDb.testRuns.unshift(created);

      // Seed placeholder results
      const cases = mockDb.testCases.filter((tc) => input.testCaseIds.includes(tc.id));
      cases.forEach((tc) => {
        mockDb.results.unshift({
          id: makeId("RES"),
          runId: created.id,
          testCaseId: tc.id,
          testCaseTitle: tc.title,
          status: "Blocked",
          durationSec: 0
        });
      });

      return created;
    },

    // PUBLIC_INTERFACE
    async getResults() {
      /** Returns list of results. */
      await sleep(LATENCY_MS);
      return [...mockDb.results];
    }
  };
}
