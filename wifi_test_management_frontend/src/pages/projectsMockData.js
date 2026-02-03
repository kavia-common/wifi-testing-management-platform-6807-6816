const DAY_MS = 24 * 60 * 60 * 1000;

function toIso(date) {
  return new Date(date).toISOString();
}

// PUBLIC_INTERFACE
export function getMockProjectsSeed() {
  /**
   * Returns a stable mock dataset for Projects screens.
   * Intended for local UI work only (to be replaced by API calls later).
   *
   * Shape:
   *  - id: string
   *  - name: string
   *  - owner: string
   *  - environment: string
   *  - status: "Active" | "Paused" | "Archived"
   *  - tags: string[]
   *  - description: string
   *  - createdAt: ISO string
   *  - updatedAt: ISO string
   *  - counts: { testCases: number, executions: number, results: number }
   */
  const now = Date.now();

  return [
    {
      id: "proj-1",
      name: "Office WiFi Regression",
      owner: "QA Team",
      environment: "HQ Floor 3 (AP-LAB-03)",
      status: "Active",
      tags: ["regression", "nightly", "office"],
      description:
        "Primary regression suite for office SSIDs, WPA2/WPA3 association, roaming stability, and baseline throughput.",
      createdAt: toIso(now - 42 * DAY_MS),
      updatedAt: toIso(now - 3 * DAY_MS),
      counts: { testCases: 26, executions: 118, results: 2960 },
    },
    {
      id: "proj-2",
      name: "Mesh Throughput Suite",
      owner: "Performance",
      environment: "Warehouse Mesh (3 nodes)",
      status: "Active",
      tags: ["mesh", "throughput", "iperf3"],
      description:
        "Validates mesh backhaul performance, client uplink/downlink throughput, and latency under load across firmware candidates.",
      createdAt: toIso(now - 60 * DAY_MS),
      updatedAt: toIso(now - 1 * DAY_MS),
      counts: { testCases: 18, executions: 64, results: 1440 },
    },
    {
      id: "proj-3",
      name: "Guest Network Isolation",
      owner: "Security",
      environment: "Guest VLAN (Staging)",
      status: "Paused",
      tags: ["guest", "vlan", "isolation"],
      description:
        "Security verification for guest SSID segmentation, captive portal behavior, DNS interception, and isolation from corporate subnets.",
      createdAt: toIso(now - 80 * DAY_MS),
      updatedAt: toIso(now - 12 * DAY_MS),
      counts: { testCases: 12, executions: 21, results: 420 },
    },
    {
      id: "proj-4",
      name: "Roaming Stability",
      owner: "Mobility",
      environment: "Campus Walk (2 buildings)",
      status: "Active",
      tags: ["roaming", "802.11r", "voice"],
      description:
        "Measures roam time distribution, packet loss during handoffs, and stability for VoIP and video streaming across multiple APs.",
      createdAt: toIso(now - 25 * DAY_MS),
      updatedAt: toIso(now - 2 * DAY_MS),
      counts: { testCases: 22, executions: 53, results: 1022 },
    },
    {
      id: "proj-5",
      name: "Legacy Device Compatibility",
      owner: "Interop",
      environment: "Device Lab",
      status: "Archived",
      tags: ["interop", "legacy", "compat"],
      description:
        "Compatibility checks for legacy clients (older chipsets, printers, scanners) across auth types and band steering policies.",
      createdAt: toIso(now - 120 * DAY_MS),
      updatedAt: toIso(now - 40 * DAY_MS),
      counts: { testCases: 14, executions: 9, results: 210 },
    },
  ];
}

// PUBLIC_INTERFACE
export function formatDate(dateIso) {
  /** Formats an ISO date to a short, readable string. */
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(dateIso));
  } catch {
    return String(dateIso);
  }
}

// PUBLIC_INTERFACE
export function normalizeProjectStatus(status) {
  /** Ensures status is one of supported set. */
  const s = String(status || "").trim().toLowerCase();
  if (s === "active") return "Active";
  if (s === "paused") return "Paused";
  if (s === "archived") return "Archived";
  return "Active";
}

// PUBLIC_INTERFACE
export function badgeVariantForProjectStatus(status) {
  /** Maps project status to shared <Badge /> variants. */
  const s = String(status || "").toLowerCase();
  if (s === "active") return "success";
  if (s === "paused") return "secondary";
  if (s === "archived") return "neutral";
  return "primary";
}
