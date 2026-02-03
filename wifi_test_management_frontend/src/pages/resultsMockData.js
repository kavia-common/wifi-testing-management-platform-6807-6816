import { getMockExecutionsSeed, formatDateTime } from "./executionsMockData";
import { getMockProjectsSeed } from "./projectsMockData";

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// PUBLIC_INTERFACE
export function normalizeResultStatus(status) {
  /** Ensures result status is one of supported set. */
  const s = String(status || "").trim().toLowerCase();
  if (s === "pass" || s === "passed") return "Pass";
  if (s === "fail" || s === "failed") return "Fail";
  if (s === "error") return "Error";
  if (s === "skipped") return "Skipped";
  return "Pass";
}

// PUBLIC_INTERFACE
export function badgeVariantForResultStatus(status) {
  /** Maps result status to shared <Badge /> variants. */
  const s = String(status || "").trim().toLowerCase();
  if (s === "pass" || s === "passed") return "success";
  if (s === "fail" || s === "failed") return "error";
  if (s === "error") return "error";
  if (s === "skipped") return "secondary";
  return "neutral";
}

// PUBLIC_INTERFACE
export function makeResultId() {
  /** Stable enough for mock UI; replace with backend IDs later. */
  return `res-${Math.floor(10000 + Math.random() * 90000)}`;
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

function toIso(ms) {
  return new Date(ms).toISOString();
}

function startOfDayMs(dateIsoOrLocal) {
  if (!dateIsoOrLocal) return null;
  const d = new Date(dateIsoOrLocal);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDayMs(dateIsoOrLocal) {
  if (!dateIsoOrLocal) return null;
  const d = new Date(dateIsoOrLocal);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function inRange(iso, fromIso, toIsoValue) {
  if (!fromIso && !toIsoValue) return true;
  const ms = iso ? new Date(iso).getTime() : null;
  if (!ms || Number.isNaN(ms)) return false;

  const fromMs = fromIso ? startOfDayMs(fromIso) : null;
  const toMs = toIsoValue ? endOfDayMs(toIsoValue) : null;

  if (fromMs != null && ms < fromMs) return false;
  if (toMs != null && ms > toMs) return false;
  return true;
}

function rssiQuality(rssi) {
  // Very rough WiFi quality mapping.
  const n = Number(rssi);
  if (Number.isNaN(n)) return "Unknown";
  if (n >= -55) return "Excellent";
  if (n >= -67) return "Good";
  if (n >= -75) return "Fair";
  return "Poor";
}

function makeArtifactsForStatus(status, baseTs) {
  const s = normalizeResultStatus(status);
  const common = [
    {
      id: "art-metrics",
      name: "metrics.json",
      type: "json",
      sizeBytes: 2480,
      createdAt: toIso(baseTs + 2 * MIN_MS),
      kind: "artifact",
      hint: "Key performance counters for the test run.",
    },
    {
      id: "art-logs",
      name: "runner.log",
      type: "log",
      sizeBytes: 19480,
      createdAt: toIso(baseTs + 1 * MIN_MS),
      kind: "artifact",
      hint: "Runner logs (mock).",
    },
    {
      id: "art-pcap",
      name: "capture.pcap",
      type: "pcap",
      sizeBytes: 2_480_000,
      createdAt: toIso(baseTs + 3 * MIN_MS),
      kind: "artifact",
      hint: "Packet capture (mock).",
    },
  ];

  if (s === "Pass") {
    return [
      ...common,
      {
        id: "att-report",
        name: "result-summary.pdf",
        type: "pdf",
        sizeBytes: 82_000,
        createdAt: toIso(baseTs + 4 * MIN_MS),
        kind: "attachment",
        hint: "Shareable summary report.",
      },
    ];
  }

  if (s === "Fail" || s === "Error") {
    return [
      ...common,
      {
        id: "att-screenshot",
        name: "failure-screenshot.png",
        type: "png",
        sizeBytes: 158_000,
        createdAt: toIso(baseTs + 4 * MIN_MS),
        kind: "attachment",
        hint: "Captured at failure time (mock).",
      },
      {
        id: "att-diagnostics",
        name: "diagnostics.zip",
        type: "zip",
        sizeBytes: 1_380_000,
        createdAt: toIso(baseTs + 5 * MIN_MS),
        kind: "attachment",
        hint: "Diagnostics bundle for triage (mock).",
      },
    ];
  }

  // Skipped
  return [
    {
      id: "art-skip",
      name: "skip-reason.txt",
      type: "text",
      sizeBytes: 180,
      createdAt: toIso(baseTs + 30 * 1000),
      kind: "artifact",
      hint: "Reason the test did not run.",
    },
  ];
}

function makeMetrics(status, seed) {
  const s = normalizeResultStatus(status);
  // Make deterministic-ish numbers from seed so rows look stable.
  const base = (Number(seed) || 0) % 1000;
  const jitter = (n, spread) => n + ((base % spread) - Math.floor(spread / 2));

  const metrics = {
    throughputMbps: clamp(jitter(620, 80), 40, 980),
    latencyMsP50: clamp(jitter(18, 10), 3, 90),
    roamTimeMsP95: clamp(jitter(92, 80), 15, 450),
    packetLossPct: clamp(jitter(1.2, 6) / 10, 0, 5),
    rssiDbm: clamp(jitter(-62, 18), -88, -42),
  };

  // If fail/error, worsen a key metric.
  if (s === "Fail") {
    metrics.roamTimeMsP95 = clamp(metrics.roamTimeMsP95 + 140, 15, 600);
    metrics.packetLossPct = clamp(metrics.packetLossPct + 1.6, 0, 10);
  }
  if (s === "Error") {
    metrics.throughputMbps = clamp(metrics.throughputMbps - 420, 0, 980);
    metrics.latencyMsP50 = clamp(metrics.latencyMsP50 + 60, 3, 250);
  }

  return {
    ...metrics,
    rssiQuality: rssiQuality(metrics.rssiDbm),
  };
}

// PUBLIC_INTERFACE
export function getMockResultsSeed() {
  /**
   * Returns a stable-ish mock dataset for Results screens.
   *
   * Shape:
   *  - id: string
   *  - executionId: string
   *  - projectId: string
   *  - status: "Pass" | "Fail" | "Error" | "Skipped"
   *  - createdAt: ISO string
   *  - durationSec: number
   *  - device: string
   *  - testCaseName: string (display)
   *  - summary: string
   *  - metrics: object
   *  - artifacts: Array<{ id, name, type, sizeBytes, createdAt, kind, hint }>
   */
  const now = Date.now();
  const projects = getMockProjectsSeed();
  const executions = getMockExecutionsSeed();

  // Reuse existing execution IDs so pages can link.
  // (Results page doesn't need an execution details link yet, but the details page shows related info.)
  const execById = Object.fromEntries(executions.map((e) => [e.id, e]));

  const base = [
    {
      id: "res-90001",
      executionId: "exec-1002",
      projectId: execById["exec-1002"]?.projectId || projects[1]?.id || "proj-2",
      status: "Pass",
      createdAt: toIso(now - 2 * DAY_MS + 28 * MIN_MS),
      durationSec: 356,
      device: "Pixel 7",
      testCaseName: "5GHz Throughput (iperf3)",
      summary: "Throughput within expected range; no significant packet loss observed.",
    },
    {
      id: "res-90002",
      executionId: "exec-1003",
      projectId: execById["exec-1003"]?.projectId || projects[3]?.id || "proj-4",
      status: "Fail",
      createdAt: toIso(now - 5 * DAY_MS + 41 * MIN_MS),
      durationSec: 244,
      device: "iPhone 14",
      testCaseName: "Roaming (802.11r) Handoff",
      summary: "Roam time exceeded threshold in 3/8 handoffs; sporadic packet loss during transition.",
    },
    {
      id: "res-90003",
      executionId: "exec-1001",
      projectId: execById["exec-1001"]?.projectId || projects[0]?.id || "proj-1",
      status: "Error",
      createdAt: toIso(now - 18 * MIN_MS + 7 * MIN_MS),
      durationSec: 72,
      device: "Galaxy S22",
      testCaseName: "2.4GHz Association (WPA2)",
      summary: "Runner reported an unexpected disconnect while collecting metrics.",
    },
    {
      id: "res-90004",
      executionId: "exec-1004",
      projectId: execById["exec-1004"]?.projectId || projects[2]?.id || "proj-3",
      status: "Skipped",
      createdAt: toIso(now - 4 * HOUR_MS),
      durationSec: 0,
      device: "Pixel 6a",
      testCaseName: "Guest VLAN Isolation",
      summary: "Skipped: scheduled window not reached (mock).",
    },
  ];

  return base.map((r, idx) => {
    const seed = `${r.id}-${idx}`.replace(/\D/g, "");
    const baseTs = new Date(r.createdAt).getTime() || now;
    return {
      ...r,
      metrics: makeMetrics(r.status, seed),
      artifacts: makeArtifactsForStatus(r.status, baseTs),
    };
  });
}

// PUBLIC_INTERFACE
export function matchesResultProject(result, projectFilter) {
  /** Returns true if result matches project filter. */
  if (!projectFilter || projectFilter === "All") return true;
  return String(result.projectId) === String(projectFilter);
}

// PUBLIC_INTERFACE
export function matchesResultStatus(result, statusFilter) {
  /** Returns true if result matches status filter. */
  if (!statusFilter || statusFilter === "All") return true;
  return normalizeResultStatus(result.status) === statusFilter;
}

// PUBLIC_INTERFACE
export function matchesResultTimeRange(result, fromIso, toIsoValue) {
  /** Returns true if result.createdAt is in the provided time range. */
  return inRange(result.createdAt, fromIso, toIsoValue);
}

// PUBLIC_INTERFACE
export function formatBytes(bytes) {
  /** Formats bytes to a human readable string (KB/MB). */
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

// PUBLIC_INTERFACE
export function formatResultDateTime(dateIso) {
  /** Uses the shared formatting helper for consistent dates. */
  return formatDateTime(dateIso);
}
