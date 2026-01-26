import React, { useMemo, useState } from "react";
import { PageHeader, Toolbar } from "../../app/components/PageHeader";
import { Button } from "../../app/components/Button";
import { Table } from "../../app/components/Table";
import { Badge } from "../../app/components/Badge";
import { Select, TextArea } from "../../app/components/form/Field";
import { ErrorBanner } from "../../app/components/States";
import { useResults } from "../../hooks/useResults";
import { useTestRuns } from "../../hooks/useTestRuns";

function resultTone(status) {
  if (status === "Passed") return "success";
  if (status === "Failed") return "error";
  if (status === "Blocked") return "warning";
  return "neutral";
}

function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      role="presentation"
      style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.35)", zIndex: 55 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(520px, 100%)",
          background: "white",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </div>
        <div style={{ padding: 14, overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function ResultsPage() {
  /** Results listing with filters and details drawer. */
  const { data: results, isLoading, error, refetch } = useResults();
  const { data: runs } = useTestRuns();

  const [runId, setRunId] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const items = results || [];
    return items.filter((r) => {
      const matchRun = runId === "All" ? true : r.runId === runId;
      const matchStatus = status === "All" ? true : r.status === status;
      return matchRun && matchStatus;
    });
  }, [results, runId, status]);

  const columns = useMemo(
    () => [
      { key: "id", header: "Result ID", accessor: (r) => r.id, sortable: true, width: 140 },
      { key: "runId", header: "Run ID", accessor: (r) => r.runId, sortable: true, width: 140 },
      { key: "testCaseTitle", header: "Test Case", accessor: (r) => r.testCaseTitle, sortable: true },
      {
        key: "status",
        header: "Status",
        accessor: (r) => r.status,
        sortable: true,
        width: 140,
        cell: (r) => <Badge tone={resultTone(r.status)}>{r.status}</Badge>
      },
      { key: "durationSec", header: "Duration", accessor: (r) => r.durationSec, sortable: true, width: 120, cell: (r) => `${r.durationSec}s` },
      {
        key: "actions",
        header: "Actions",
        accessor: () => "",
        sortable: false,
        width: 140,
        cell: (r) => (
          <Button variant="secondary" onClick={() => setSelected(r)}>
            Details
          </Button>
        )
      }
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Results"
        description="Review per-test-case outcomes from each test run."
        breadcrumbs={["WiFi Test Management", "Results"]}
        right={
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />

      <Toolbar>
        <div style={{ width: 240 }}>
          <Select label="Run" value={runId} onChange={(e) => setRunId(e.target.value)}>
            <option value="All">All</option>
            {(runs || []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.projectName}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ width: 220 }}>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Blocked">Blocked</option>
          </Select>
        </div>
      </Toolbar>

      {error ? <ErrorBanner title="Failed to load results" message={error.message} onRetry={() => refetch()} /> : null}

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={error}
        emptyTitle="No results found"
        emptyMessage="Start a run to generate results or change filters."
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Result Details — ${selected.id}` : "Result Details"}
      >
        {selected ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>
                    Run
                  </div>
                  <div style={{ fontWeight: 900 }}>{selected.runId}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>
                    Status
                  </div>
                  <Badge tone={resultTone(selected.status)}>{selected.status}</Badge>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 900 }}>
                    Duration
                  </div>
                  <div style={{ fontWeight: 900 }}>{selected.durationSec}s</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Logs (placeholder)</div>
              <TextArea value={"[placeholder] Test execution logs will appear here once backend integration is available."} readOnly />
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Metrics (placeholder)</div>
              <div className="muted" style={{ fontSize: 13 }}>
                RSSI, throughput, latency, roaming events, and retry counters will be shown here.
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
