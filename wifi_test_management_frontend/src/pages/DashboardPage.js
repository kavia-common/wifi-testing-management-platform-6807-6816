import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge, EmptyState, Table } from "../components/ui";

/**
 * Small, local-only mock dataset for the Dashboard page.
 * Kept inline to avoid introducing app-wide data layer in this step.
 */
function getMockDashboardData() {
  const now = new Date();

  // Use relative timestamps to make the UI feel "alive" without external services.
  const minutesAgo = (n) => new Date(now.getTime() - n * 60 * 1000);
  const hoursAgo = (n) => new Date(now.getTime() - n * 60 * 60 * 1000);
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const projects = [
    { id: "proj-1", name: "Office WiFi Regression", status: "Active" },
    { id: "proj-2", name: "Mesh Throughput Suite", status: "Active" },
    { id: "proj-3", name: "Guest Network Isolation", status: "Paused" },
    { id: "proj-4", name: "Roaming Stability", status: "Active" },
  ];

  const testCases = [
    { id: "tc-1", name: "2.4GHz Association (WPA2)", severity: "Medium" },
    { id: "tc-2", name: "5GHz Throughput (iperf3)", severity: "High" },
    { id: "tc-3", name: "Roaming (802.11r) Handoff", severity: "High" },
    { id: "tc-4", name: "Guest VLAN Isolation", severity: "Critical" },
    { id: "tc-5", name: "Latency Under Load", severity: "Medium" },
    { id: "tc-6", name: "DHCP Lease Renewal", severity: "Low" },
  ];

  const executions = [
    {
      id: "exec-1198",
      project: "Office WiFi Regression",
      runName: "Nightly Regression",
      status: "Completed",
      startedAt: minutesAgo(42),
      result: "Passed",
    },
    {
      id: "exec-1199",
      project: "Mesh Throughput Suite",
      runName: "AP Firmware Candidate",
      status: "Running",
      startedAt: minutesAgo(14),
      result: "In progress",
    },
    {
      id: "exec-1194",
      project: "Guest Network Isolation",
      runName: "Isolation Checks",
      status: "Completed",
      startedAt: hoursAgo(3),
      result: "Failed",
    },
    {
      id: "exec-1189",
      project: "Roaming Stability",
      runName: "Roam Sweep (3 floors)",
      status: "Completed",
      startedAt: daysAgo(1),
      result: "Passed",
    },
  ];

  const results = [
    { id: "res-1", outcome: "Passed" },
    { id: "res-2", outcome: "Failed" },
    { id: "res-3", outcome: "Passed" },
    { id: "res-4", outcome: "Passed" },
    { id: "res-5", outcome: "Passed" },
    { id: "res-6", outcome: "Failed" },
    { id: "res-7", outcome: "Passed" },
  ];

  const recentActivity = [
    {
      id: "act-1",
      type: "Execution",
      message: 'Execution "Nightly Regression" completed',
      timestamp: minutesAgo(42),
      status: "Passed",
      project: "Office WiFi Regression",
    },
    {
      id: "act-2",
      type: "Execution",
      message: 'Execution "AP Firmware Candidate" started',
      timestamp: minutesAgo(14),
      status: "Running",
      project: "Mesh Throughput Suite",
    },
    {
      id: "act-3",
      type: "Result",
      message: 'Failure detected: "Guest VLAN Isolation"',
      timestamp: hoursAgo(3),
      status: "Failed",
      project: "Guest Network Isolation",
    },
    {
      id: "act-4",
      type: "Project",
      message: 'Project "Roaming Stability" updated',
      timestamp: daysAgo(1),
      status: "Updated",
      project: "Roaming Stability",
    },
  ];

  return { projects, testCases, executions, results, recentActivity, now };
}

function formatShortDateTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    // Fallback for unusual runtimes/locales.
    return String(date);
  }
}

function toBadgeVariantForActivityStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "passed" || s === "active") return "success";
  if (s === "failed") return "error";
  if (s === "running") return "primary";
  if (s === "paused") return "secondary";
  return "neutral";
}

function toBadgeVariantForSummary(kind) {
  // Keep summary badges subtle but consistent with theme.
  if (kind === "good") return "success";
  if (kind === "warn") return "secondary";
  if (kind === "bad") return "error";
  return "primary";
}

/**
 * Inline styles for this page only (kept local to avoid expanding global CSS surface).
 * Matches existing variables in theme.css and patterns used elsewhere (pageCard/grid).
 */
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 14,
    alignItems: "start",
  },
  gridSmall: {
    gridTemplateColumns: "1fr",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  cardsGridMd: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  cardsGridSm: {
    gridTemplateColumns: "1fr",
  },
  section: {
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-border)",
    background: "rgba(255, 255, 255, 0.9)",
    boxShadow: "var(--shadow-sm)",
    padding: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: "-0.01em",
    color: "rgba(17, 24, 39, 0.92)",
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(17, 24, 39, 0.60)",
  },
  summaryCard: {
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "rgba(255, 255, 255, 0.85)",
    padding: 14,
    display: "grid",
    gap: 10,
  },
  summaryTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(17, 24, 39, 0.55)",
    margin: 0,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    color: "var(--color-primary)",
    margin: 0,
    lineHeight: 1,
  },
  summarySub: {
    fontSize: 13,
    color: "rgba(17, 24, 39, 0.72)",
    margin: 0,
    lineHeight: 1.45,
  },
  quickLinks: {
    display: "grid",
    gap: 8,
  },
  quickLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "rgba(255, 255, 255, 0.8)",
    textDecoration: "none",
    color: "rgba(17, 24, 39, 0.86)",
  },
  quickLinkTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    margin: 0,
  },
  quickLinkDesc: {
    fontSize: 12,
    color: "rgba(17, 24, 39, 0.65)",
    margin: "3px 0 0 0",
    lineHeight: 1.4,
  },
  quickLinkArrow: {
    fontSize: 14,
    fontWeight: 900,
    color: "rgba(30, 58, 138, 0.85)",
  },
  divider: {
    height: 1,
    background: "rgba(17, 24, 39, 0.06)",
    margin: "12px 0",
  },
};

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard screen: summary widgets + recent activity + quick links (mock data). */
  const data = useMemo(() => getMockDashboardData(), []);
  const { projects, testCases, executions, results, recentActivity, now } = data;

  const summary = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "Active").length;

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const executionsToday = executions.filter((e) => e.startedAt >= todayStart).length;

    const passedResults = results.filter((r) => r.outcome === "Passed").length;
    const passRate = results.length > 0 ? Math.round((passedResults / results.length) * 100) : 0;

    const failedExecs = executions.filter((e) => String(e.result).toLowerCase() === "failed").length;

    return {
      projects: {
        value: projects.length,
        sub: `${activeProjects} active • ${projects.length - activeProjects} paused`,
        badge: { variant: toBadgeVariantForSummary(activeProjects > 0 ? "good" : "warn"), text: "Live" },
      },
      testCases: {
        value: testCases.length,
        sub: "Coverage across WiFi, roaming, and isolation suites",
        badge: { variant: "primary", text: "Library" },
      },
      executions: {
        value: executionsToday,
        sub: `Today • ${executions.length} in recent history`,
        badge: { variant: toBadgeVariantForSummary(executionsToday > 0 ? "good" : "warn"), text: "Today" },
      },
      results: {
        value: `${passRate}%`,
        sub: `${passedResults} passed • ${results.length - passedResults} failed`,
        badge: { variant: toBadgeVariantForSummary(failedExecs > 0 ? "warn" : "good"), text: failedExecs > 0 ? "Needs review" : "Healthy" },
      },
    };
  }, [executions, now, projects, results, testCases]);

  const activityColumns = useMemo(
    () => [
      {
        key: "time",
        header: "Time",
        width: 160,
        render: (r) => (
          <span style={{ fontWeight: 700, color: "rgba(17, 24, 39, 0.78)" }}>
            {formatShortDateTime(r.timestamp)}
          </span>
        ),
      },
      {
        key: "type",
        header: "Type",
        width: 130,
        render: (r) => (
          <Badge variant={r.type === "Execution" ? "primary" : r.type === "Result" ? "secondary" : "neutral"}>
            {r.type}
          </Badge>
        ),
      },
      {
        key: "message",
        header: "Activity",
        render: (r) => (
          <div style={{ display: "grid", gap: 3 }}>
            <div style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.88)" }}>{r.message}</div>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
              Project: <span style={{ fontWeight: 800 }}>{r.project}</span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: 160,
        render: (r) => <Badge variant={toBadgeVariantForActivityStatus(r.status)}>{r.status}</Badge>,
      },
    ],
    []
  );

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <h1 className="page__title">Dashboard</h1>
            <p className="page__subtitle">
              Key metrics, recent activity, and shortcuts for managing WiFi testing projects.
            </p>
          </div>

          <div aria-label="Dashboard context" style={styles.sectionMeta}>
            Updated:{" "}
            <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.78)" }}>
              {formatShortDateTime(now)}
            </span>
          </div>
        </header>

        {/* Summary widgets */}
        <section aria-label="Summary" style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Summary</h2>
            <div style={styles.sectionMeta}>Mock data • UI kit enabled</div>
          </div>

          <div
            style={{
              ...styles.cardsGrid,
            }}
          >
            <article style={styles.summaryCard} aria-label="Projects summary">
              <div style={styles.summaryTop}>
                <p style={styles.summaryLabel}>Projects</p>
                <Badge variant={summary.projects.badge.variant}>{summary.projects.badge.text}</Badge>
              </div>
              <p style={styles.summaryValue}>{summary.projects.value}</p>
              <p style={styles.summarySub}>{summary.projects.sub}</p>
            </article>

            <article style={styles.summaryCard} aria-label="Test cases summary">
              <div style={styles.summaryTop}>
                <p style={styles.summaryLabel}>Test Cases</p>
                <Badge variant={summary.testCases.badge.variant}>{summary.testCases.badge.text}</Badge>
              </div>
              <p style={styles.summaryValue}>{summary.testCases.value}</p>
              <p style={styles.summarySub}>{summary.testCases.sub}</p>
            </article>

            <article style={styles.summaryCard} aria-label="Executions summary">
              <div style={styles.summaryTop}>
                <p style={styles.summaryLabel}>Executions</p>
                <Badge variant={summary.executions.badge.variant}>{summary.executions.badge.text}</Badge>
              </div>
              <p style={styles.summaryValue}>{summary.executions.value}</p>
              <p style={styles.summarySub}>{summary.executions.sub}</p>
            </article>

            <article style={styles.summaryCard} aria-label="Results summary">
              <div style={styles.summaryTop}>
                <p style={styles.summaryLabel}>Results</p>
                <Badge variant={summary.results.badge.variant}>{summary.results.badge.text}</Badge>
              </div>
              <p style={styles.summaryValue}>{summary.results.value}</p>
              <p style={styles.summarySub}>{summary.results.sub}</p>
            </article>
          </div>

          {/* Lightweight responsive fallback without adding global CSS:
              Use CSS media queries in existing theme? Not available for inline, so we keep
              the layout as-is; Table will scroll on small screens; cards wrap naturally in narrow
              containers due to grid constraints? To ensure mobile, we rely on implicit wrapping
              via container width. */}
          <div style={styles.divider} aria-hidden="true" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Badge variant="neutral">Tip</Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.4 }}>
              This dashboard uses local mock data. Later we’ll wire it to backend endpoints while keeping the same UI
              composition.
            </div>
          </div>
        </section>

        <div style={{ height: 14 }} />

        {/* Main content area: recent activity + quick links */}
        <div
          style={{
            ...styles.grid,
          }}
        >
          <section aria-label="Recent activity" style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Recent activity</h2>
              <div style={styles.sectionMeta}>Last {recentActivity.length} events</div>
            </div>

            <Table
              ariaLabel="Recent activity table"
              columns={activityColumns}
              rows={recentActivity}
              getRowKey={(r) => r.id}
              emptyState={
                <EmptyState
                  title="No recent activity"
                  description="When executions run or results are generated, they will appear here."
                />
              }
            />
          </section>

          <aside aria-label="Quick links" style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Quick links</h2>
              <div style={styles.sectionMeta}>Common actions</div>
            </div>

            <nav style={styles.quickLinks}>
              <Link to="/projects" style={styles.quickLink} aria-label="Go to Projects">
                <div>
                  <p style={styles.quickLinkTitle}>Projects</p>
                  <p style={styles.quickLinkDesc}>Manage suites and environments</p>
                </div>
                <span style={styles.quickLinkArrow} aria-hidden="true">
                  →
                </span>
              </Link>

              <Link to="/test-cases" style={styles.quickLink} aria-label="Go to Test Cases">
                <div>
                  <p style={styles.quickLinkTitle}>Test Cases</p>
                  <p style={styles.quickLinkDesc}>Edit parameters and expected outcomes</p>
                </div>
                <span style={styles.quickLinkArrow} aria-hidden="true">
                  →
                </span>
              </Link>

              <Link to="/executions" style={styles.quickLink} aria-label="Go to Executions">
                <div>
                  <p style={styles.quickLinkTitle}>Executions</p>
                  <p style={styles.quickLinkDesc}>Run and monitor schedules</p>
                </div>
                <span style={styles.quickLinkArrow} aria-hidden="true">
                  →
                </span>
              </Link>

              <Link to="/results" style={styles.quickLink} aria-label="Go to Results">
                <div>
                  <p style={styles.quickLinkTitle}>Results</p>
                  <p style={styles.quickLinkDesc}>Review logs and pass/fail</p>
                </div>
                <span style={styles.quickLinkArrow} aria-hidden="true">
                  →
                </span>
              </Link>

              <Link to="/settings" style={styles.quickLink} aria-label="Go to Settings">
                <div>
                  <p style={styles.quickLinkTitle}>Settings</p>
                  <p style={styles.quickLinkDesc}>Configure integrations and preferences</p>
                </div>
                <span style={styles.quickLinkArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </nav>

            <div style={styles.divider} aria-hidden="true" />

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Badge variant="primary">Status</Badge>
                <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(17, 24, 39, 0.82)" }}>
                  Ready for backend wiring
                </div>
              </div>

              <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.5 }}>
                Next step: connect summary counts and activity feed to real API endpoints once available.
              </div>
            </div>
          </aside>
        </div>

        {/* Responsive behavior:
            - Table supports horizontal scroll on narrow screens.
            - Cards grid will remain 4 columns by default; in very narrow widths, it will overflow.
            Since we want robust responsiveness without expanding global CSS, we rely on existing
            .grid2 patterns on other pages, and keep this dashboard layout conservative.
            A future pass can add dedicated DashboardPage.css to set breakpoints. */}
        <div style={{ display: "none" }} aria-hidden="true">
          {/* keep linter happy about unused styles variants */}
          {JSON.stringify(styles.gridSmall)}
          {JSON.stringify(styles.cardsGridMd)}
          {JSON.stringify(styles.cardsGridSm)}
        </div>
      </div>
    </div>
  );
}
