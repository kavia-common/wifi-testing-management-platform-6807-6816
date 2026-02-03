import { getMockProjectsSeed } from "./projectsMockData";

const DAY_MS = 24 * 60 * 60 * 1000;

function toIso(date) {
  return new Date(date).toISOString();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// PUBLIC_INTERFACE
export function getMockTestCasesSeed() {
  /**
   * Returns a stable mock dataset for Test Cases screens (local UI only).
   *
   * Shape:
   *  - id: string
   *  - name: string
   *  - description: string
   *  - projectId: string
   *  - tags: string[]
   *  - parameters: Array<{ key: string, value: string }>
   *  - usage: { executions: number, results: number }
   *  - createdAt: ISO string
   *  - updatedAt: ISO string
   */
  const now = Date.now();
  const projects = getMockProjectsSeed();
  const byName = Object.fromEntries(projects.map((p) => [p.name, p.id]));

  return [
    {
      id: "tc-1",
      name: "2.4GHz Association (WPA2)",
      description:
        "Validate client association to 2.4GHz SSID using WPA2-PSK. Ensures DHCP succeeds and basic connectivity is established.",
      projectId: byName["Office WiFi Regression"] || "proj-1",
      tags: ["association", "wpa2", "2.4ghz", "dhcp"],
      parameters: [
        { key: "ssid", value: "Office-WiFi" },
        { key: "band", value: "2.4GHz" },
        { key: "security", value: "WPA2-PSK" },
        { key: "timeoutSec", value: "30" },
      ],
      usage: { executions: 41, results: 980 },
      createdAt: toIso(now - 60 * DAY_MS),
      updatedAt: toIso(now - 3 * DAY_MS),
    },
    {
      id: "tc-2",
      name: "5GHz Throughput (iperf3)",
      description:
        "Run iperf3 downlink/uplink to validate throughput on 5GHz under nominal conditions.",
      projectId: byName["Mesh Throughput Suite"] || "proj-2",
      tags: ["throughput", "iperf3", "5ghz", "performance"],
      parameters: [
        { key: "band", value: "5GHz" },
        { key: "durationSec", value: "20" },
        { key: "parallelStreams", value: "4" },
        { key: "server", value: "10.0.0.12" },
      ],
      usage: { executions: 26, results: 520 },
      createdAt: toIso(now - 45 * DAY_MS),
      updatedAt: toIso(now - 1 * DAY_MS),
    },
    {
      id: "tc-3",
      name: "Roaming (802.11r) Handoff",
      description:
        "Measure roam time distribution and packet loss during 802.11r handoff across multiple APs.",
      projectId: byName["Roaming Stability"] || "proj-4",
      tags: ["roaming", "802.11r", "handoff", "voice"],
      parameters: [
        { key: "minRSSI", value: "-68dBm" },
        { key: "handoffCount", value: "8" },
        { key: "maxRoamMs", value: "120" },
      ],
      usage: { executions: 19, results: 342 },
      createdAt: toIso(now - 30 * DAY_MS),
      updatedAt: toIso(now - 2 * DAY_MS),
    },
    {
      id: "tc-4",
      name: "Guest VLAN Isolation",
      description:
        "Verify guest SSID cannot reach corporate subnets; validate DNS interception and captive portal behavior.",
      projectId: byName["Guest Network Isolation"] || "proj-3",
      tags: ["guest", "vlan", "isolation", "security"],
      parameters: [
        { key: "guestSubnet", value: "192.168.50.0/24" },
        { key: "blockedCIDRs", value: "10.0.0.0/8,172.16.0.0/12" },
        { key: "dnsServer", value: "192.168.50.1" },
      ],
      usage: { executions: 11, results: 190 },
      createdAt: toIso(now - 70 * DAY_MS),
      updatedAt: toIso(now - 12 * DAY_MS),
    },
    {
      id: "tc-5",
      name: "Latency Under Load",
      description:
        "Validate latency while throughput traffic is running (bufferbloat detection).",
      projectId: byName["Mesh Throughput Suite"] || "proj-2",
      tags: ["latency", "load", "performance"],
      parameters: [
        { key: "pingTarget", value: "1.1.1.1" },
        { key: "pingIntervalMs", value: "200" },
        { key: "loadDurationSec", value: "30" },
      ],
      usage: { executions: 9, results: 180 },
      createdAt: toIso(now - 22 * DAY_MS),
      updatedAt: toIso(now - 4 * DAY_MS),
    },
  ];
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
export function normalizeTagsFromString(tagsInput) {
  /**
   * Normalizes comma-separated tags input to an array of unique, trimmed tags.
   */
  const raw = String(tagsInput || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // de-dupe case-insensitively while preserving original casing of first appearance
  const seen = new Set();
  const out = [];
  for (const t of raw) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, 12);
}

// PUBLIC_INTERFACE
export function normalizeParametersList(parameters) {
  /**
   * Normalizes a parameters array into { key, value } pairs; removes blank rows;
   * clamps maximum parameter count for UI safety.
   */
  const list = Array.isArray(parameters) ? parameters : [];
  const normalized = list
    .map((p) => ({
      key: String(p?.key ?? "").trim(),
      value: String(p?.value ?? "").trim(),
    }))
    .filter((p) => p.key || p.value);

  return normalized.slice(0, 24);
}

// PUBLIC_INTERFACE
export function makeTestCaseId() {
  /** Stable enough for mock UI; replace with backend IDs later. */
  return `tc-${Math.floor(1000 + Math.random() * 9000)}`;
}

// PUBLIC_INTERFACE
export function deriveUsageForNewTestCase() {
  /** Produces small, plausible counts for a new test case so details view is not empty. */
  const executions = clamp(Math.floor(Math.random() * 8), 0, 8);
  const results = executions * clamp(Math.floor(10 + Math.random() * 40), 10, 50);
  return { executions, results };
}
