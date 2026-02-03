import { getMockProjectsSeed } from "./projectsMockData";
import { getMockTestCasesSeed } from "./testCasesMockData";

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

function toIso(date) {
  return new Date(date).toISOString();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// PUBLIC_INTERFACE
export function formatDateTime(dateIso) {
  /** Formats an ISO date to a short date+time string. */
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateIso));
  } catch {
    return String(dateIso);
  }
}

// PUBLIC_INTERFACE
export function parseLocalDateTimeToIso(localDateTimeValue) {
  /**
   * Converts an <input type="datetime-local"> value to ISO string.
   * Returns null if blank/invalid.
   */
  const v = String(localDateTimeValue || "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// PUBLIC_INTERFACE
export function normalizeExecutionStatus(status) {
  /** Ensures status is one of supported set. */
  const s = String(status || "").trim().toLowerCase();
  if (s === "queued") return "Queued";
  if (s === "scheduled") return "Scheduled";
  if (s === "running") return "Running";
  if (s === "completed") return "Completed";
  if (s === "failed") return "Failed";
  if (s === "canceled" || s === "cancelled") return "Canceled";
  return "Queued";
}

// PUBLIC_INTERFACE
export function badgeVariantForExecutionStatus(status) {
  /** Maps execution status to shared <Badge /> variants. */
  const s = String(status || "").trim().toLowerCase();
  if (s === "completed") return "success";
  if (s === "running") return "primary";
  if (s === "queued" || s === "scheduled") return "secondary";
  if (s === "failed") return "error";
  if (s === "canceled" || s === "cancelled") return "neutral";
  return "neutral";
}

// PUBLIC_INTERFACE
export function makeExecutionId() {
  /** Stable enough for mock UI; replace with backend IDs later. */
  return `exec-${Math.floor(1000 + Math.random() * 9000)}`;
}

// PUBLIC_INTERFACE
export function computeExecutionProgressPercent(execution, now = Date.now()) {
  /**
   * Computes a plausible progress for an execution.
   * - Running: interpolates based on startedAt and expectedDurationSec
   * - Completed/Failed/Canceled: 100
   * - Queued/Scheduled: 0
   */
  const status = normalizeExecutionStatus(execution?.status);
  if (status === "Completed" || status === "Failed" || status === "Canceled") return 100;
  if (status === "Queued" || status === "Scheduled") return 0;

  const startedAt = execution?.startedAt ? new Date(execution.startedAt).getTime() : null;
  const expectedSec = Number(execution?.expectedDurationSec ?? 240);

  if (!startedAt || Number.isNaN(startedAt)) return clamp(Math.floor(10 + Math.random() * 20), 0, 99);
  const elapsedSec = (now - startedAt) / 1000;
  const p = (elapsedSec / Math.max(30, expectedSec)) * 100;
  return clamp(Math.floor(p), 1, 99);
}

// PUBLIC_INTERFACE
export function computeDurationMs(execution) {
  /** Computes duration in ms based on startedAt/finishedAt; returns null if not available. */
  const start = execution?.startedAt ? new Date(execution.startedAt).getTime() : null;
  const end = execution?.finishedAt ? new Date(execution.finishedAt).getTime() : null;
  if (!start || !end || Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, end - start);
}

// PUBLIC_INTERFACE
export function formatDuration(ms) {
  /** Formats a duration (ms) to human-readable string like "03m 12s". */
  if (ms == null) return "—";
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  if (mm < 60) return `${pad2(mm)}m ${pad2(ss)}s`;
  const hh = Math.floor(mm / 60);
  const m2 = mm % 60;
  return `${pad2(hh)}h ${pad2(m2)}m`;
}

function getProjectName(projects, projectId) {
  return projects.find((p) => p.id === projectId)?.name || "Unknown project";
}

function getTestCaseName(testCases, testCaseId) {
  return testCases.find((t) => t.id === testCaseId)?.name || "Unknown test case";
}

function makeStepTimeline(status) {
  const s = normalizeExecutionStatus(status);
  // Define fixed steps, then mark states based on current status.
  const steps = [
    { key: "Queued", label: "Queued" },
    { key: "Running", label: "Running" },
    { key: "Completed", label: "Completed" },
  ];

  if (s === "Failed") steps[2] = { key: "Failed", label: "Failed" };
  if (s === "Canceled") steps[2] = { key: "Canceled", label: "Canceled" };

  const activeIndex =
    s === "Queued" || s === "Scheduled"
      ? 0
      : s === "Running"
        ? 1
        : s === "Completed" || s === "Failed" || s === "Canceled"
          ? 2
          : 0;

  return steps.map((step, idx) => {
    const state = idx < activeIndex ? "done" : idx === activeIndex ? "active" : "todo";
    return { ...step, state };
  });
}

function makeLogLines(status, createdAtIso, startedAtIso, finishedAtIso, projectName, testCaseName) {
  const lines = [];
  const createdAt = createdAtIso ? new Date(createdAtIso).getTime() : Date.now();
  const startedAt = startedAtIso ? new Date(startedAtIso).getTime() : null;
  const finishedAt = finishedAtIso ? new Date(finishedAtIso).getTime() : null;

  function push(ts, level, msg) {
    lines.push({ ts: toIso(ts), level, msg });
  }

  push(createdAt, "INFO", `Execution created for project="${projectName}" testCase="${testCaseName}"`);
  push(createdAt + 5 * 1000, "INFO", "Parameters validated");
  push(createdAt + 10 * 1000, "INFO", "Queued for runner allocation");

  const s = normalizeExecutionStatus(status);
  if (s === "Scheduled") {
    push(createdAt + 14 * 1000, "INFO", "Scheduled for later start (awaiting trigger)");
    return lines;
  }

  const startTs = startedAt || createdAt + 30 * 1000;
  push(startTs, "INFO", "Runner acquired: lab-runner-03");
  push(startTs + 4 * 1000, "INFO", "Connecting to DUT over WiFi control channel");
  push(startTs + 10 * 1000, "INFO", "Executing prechecks (RSSI, DHCP, DNS)");
  push(startTs + 16 * 1000, "INFO", "Starting test steps…");

  if (s === "Running") {
    push(startTs + 40 * 1000, "INFO", "Step 2/5: association verified (WPA2/WPA3)");
    push(startTs + 70 * 1000, "INFO", "Step 3/5: throughput sampling");
    push(startTs + 110 * 1000, "INFO", "Step 4/5: roaming events capture");
    push(startTs + 150 * 1000, "INFO", "Waiting for completion…");
    return lines;
  }

  const endTs = finishedAt || startTs + 210 * 1000;

  if (s === "Completed") {
    push(endTs - 30 * 1000, "INFO", "All steps passed");
    push(endTs - 10 * 1000, "INFO", "Uploading artifacts (pcap, metrics.json)");
    push(endTs, "INFO", "Execution completed successfully");
  } else if (s === "Failed") {
    push(endTs - 40 * 1000, "WARN", "Intermittent packet loss detected");
    push(endTs - 20 * 1000, "ERROR", "Test failed: roam time exceeded threshold");
    push(endTs, "ERROR", "Execution failed");
  } else if (s === "Canceled") {
    push(endTs - 20 * 1000, "WARN", "Cancellation requested by user");
    push(endTs, "INFO", "Execution canceled; runner resources released");
  } else {
    push(endTs, "INFO", `Execution ended with status=${s}`);
  }

  return lines;
}

// PUBLIC_INTERFACE
export function getMockExecutionsSeed() {
  /**
   * Returns a stable mock dataset for Executions screens.
   *
   * Shape:
   *  - id: string
   *  - projectId: string
   *  - testCaseId: string
   *  - status: "Scheduled" | "Queued" | "Running" | "Completed" | "Failed" | "Canceled"
   *  - createdAt, scheduledAt?, startedAt?, finishedAt?: ISO string
   *  - expectedDurationSec: number
   *  - parameters: Array<{ key: string, value: string }>
   *  - timeline: Array<{ key, label, state: "done"|"active"|"todo" }>
   *  - logs: Array<{ ts: ISO, level: "INFO"|"WARN"|"ERROR", msg: string }>
   */
  const now = Date.now();
  const projects = getMockProjectsSeed();
  const testCases = getMockTestCasesSeed();

  const byProjectName = Object.fromEntries(projects.map((p) => [p.name, p.id]));
  const byTestCaseName = Object.fromEntries(testCases.map((t) => [t.name, t.id]));

  const base = [
    {
      id: "exec-1001",
      projectId: byProjectName["Office WiFi Regression"] || "proj-1",
      testCaseId: byTestCaseName["2.4GHz Association (WPA2)"] || "tc-1",
      status: "Running",
      createdAt: toIso(now - 3 * HOUR_MS),
      startedAt: toIso(now - 18 * MIN_MS),
      expectedDurationSec: 360,
      parameters: [
        { key: "device", value: "Pixel 7" },
        { key: "ssid", value: "Office-WiFi" },
        { key: "band", value: "2.4GHz" },
        { key: "timeoutSec", value: "30" },
      ],
    },
    {
      id: "exec-1002",
      projectId: byProjectName["Mesh Throughput Suite"] || "proj-2",
      testCaseId: byTestCaseName["5GHz Throughput (iperf3)"] || "tc-2",
      status: "Completed",
      createdAt: toIso(now - 2 * DAY_MS),
      startedAt: toIso(now - 2 * DAY_MS + 20 * MIN_MS),
      finishedAt: toIso(now - 2 * DAY_MS + 26 * MIN_MS),
      expectedDurationSec: 320,
      parameters: [
        { key: "band", value: "5GHz" },
        { key: "durationSec", value: "20" },
        { key: "parallelStreams", value: "4" },
        { key: "server", value: "10.0.0.12" },
      ],
    },
    {
      id: "exec-1003",
      projectId: byProjectName["Roaming Stability"] || "proj-4",
      testCaseId: byTestCaseName["Roaming (802.11r) Handoff"] || "tc-3",
      status: "Failed",
      createdAt: toIso(now - 5 * DAY_MS),
      startedAt: toIso(now - 5 * DAY_MS + 35 * MIN_MS),
      finishedAt: toIso(now - 5 * DAY_MS + 39 * MIN_MS),
      expectedDurationSec: 260,
      parameters: [
        { key: "minRSSI", value: "-68dBm" },
        { key: "handoffCount", value: "8" },
        { key: "maxRoamMs", value: "120" },
      ],
    },
    {
      id: "exec-1004",
      projectId: byProjectName["Guest Network Isolation"] || "proj-3",
      testCaseId: byTestCaseName["Guest VLAN Isolation"] || "tc-4",
      status: "Scheduled",
      createdAt: toIso(now - 6 * HOUR_MS),
      scheduledAt: toIso(now + 2 * HOUR_MS),
      expectedDurationSec: 300,
      parameters: [
        { key: "guestSubnet", value: "192.168.50.0/24" },
        { key: "blockedCIDRs", value: "10.0.0.0/8,172.16.0.0/12" },
        { key: "dnsServer", value: "192.168.50.1" },
      ],
    },
    {
      id: "exec-1005",
      projectId: byProjectName["Mesh Throughput Suite"] || "proj-2",
      testCaseId: byTestCaseName["Latency Under Load"] || "tc-5",
      status: "Queued",
      createdAt: toIso(now - 25 * MIN_MS),
      expectedDurationSec: 240,
      parameters: [
        { key: "pingTarget", value: "1.1.1.1" },
        { key: "pingIntervalMs", value: "200" },
        { key: "loadDurationSec", value: "30" },
      ],
    },
  ];

  return base.map((e) => {
    const projectName = getProjectName(projects, e.projectId);
    const testCaseName = getTestCaseName(testCases, e.testCaseId);
    return {
      ...e,
      timeline: makeStepTimeline(e.status),
      logs: makeLogLines(e.status, e.createdAt, e.startedAt, e.finishedAt, projectName, testCaseName),
    };
  });
}

// PUBLIC_INTERFACE
export function hydrateExecutionDerivedFields(execution, projects, testCases) {
  /**
   * Enriches an execution with display-friendly names and regenerated timeline/logs.
   * Use this after mock updates (start/cancel/rerun/schedule) so UI stays consistent.
   */
  const projectName = getProjectName(projects, execution.projectId);
  const testCaseName = getTestCaseName(testCases, execution.testCaseId);

  return {
    ...execution,
    projectName,
    testCaseName,
    timeline: makeStepTimeline(execution.status),
    logs: makeLogLines(execution.status, execution.createdAt, execution.startedAt, execution.finishedAt, projectName, testCaseName),
  };
}
