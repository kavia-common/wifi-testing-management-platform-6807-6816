import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Badge, Button, EmptyState, Table, TextInput, Modal } from "../components/ui";
import { getMockProjectsSeed } from "./projectsMockData";
import { getMockExecutionsSeed } from "./executionsMockData";
import {
  badgeVariantForResultStatus,
  formatBytes,
  formatResultDateTime,
  getMockResultsSeed,
  matchesResultProject,
  matchesResultStatus,
  matchesResultTimeRange,
  normalizeResultStatus,
  parseLocalDateTimeToIso,
} from "./resultsMockData";

function SelectField({ id, label, value, onChange, options, helperText }) {
  return (
    <div className="uiField">
      <label className="uiField__label" htmlFor={id}>
        {label}
      </label>
      <div
        style={{
          borderRadius: 12,
          border: "1px solid var(--color-border)",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px 12px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <select
          id={id}
          value={value}
          onChange={onChange}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(17, 24, 39, 0.88)",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {helperText ? <div className="uiField__help">{helperText}</div> : null}
    </div>
  );
}

function safeText(v) {
  return String(v ?? "").trim();
}

function matchesQuery(r, query) {
  if (!query) return true;
  const q = safeText(query).toLowerCase();
  if (!q) return true;

  const haystack = [
    r.id,
    r.executionId,
    r.projectId,
    r.testCaseName,
    r.device,
    r.status,
    r.summary,
    (r.artifacts || []).map((a) => a.name).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

// PUBLIC_INTERFACE
export default function ResultsPage() {
  /** Results list screen: filter/search + status metrics + quick actions (local mock state). */
  const navigate = useNavigate();

  const [projects] = useState(() => getMockProjectsSeed());
  const [executions] = useState(() => getMockExecutionsSeed());
  const [results] = useState(() => getMockResultsSeed());

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Time range is datetime-local to match request.
  const defaultFrom = useMemo(() => {
    const d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, []);
  const defaultTo = useMemo(() => new Date().toISOString().slice(0, 16), []);

  const [fromTs, setFromTs] = useState(() => defaultFrom);
  const [toTs, setToTs] = useState(() => defaultTo);

  const [downloadModal, setDownloadModal] = useState({ open: false, item: null });

  const projectOptions = useMemo(() => {
    const opts = [{ value: "All", label: "All projects" }];
    for (const p of projects) opts.push({ value: p.id, label: p.name });
    return opts;
  }, [projects]);

  const statusOptions = useMemo(
    () => [
      { value: "All", label: "All statuses" },
      { value: "Pass", label: "Pass" },
      { value: "Fail", label: "Fail" },
      { value: "Error", label: "Error" },
      { value: "Skipped", label: "Skipped" },
    ],
    []
  );

  const fromIso = useMemo(() => parseLocalDateTimeToIso(fromTs), [fromTs]);
  const toIso = useMemo(() => parseLocalDateTimeToIso(toTs), [toTs]);

  const execById = useMemo(() => Object.fromEntries(executions.map((e) => [e.id, e])), [executions]);
  const projectById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const filtered = useMemo(() => {
    return results
      .filter((r) => matchesQuery(r, query))
      .filter((r) => matchesResultProject(r, projectFilter))
      .filter((r) => matchesResultStatus(r, statusFilter))
      .filter((r) => matchesResultTimeRange(r, fromIso, toIso))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [results, query, projectFilter, statusFilter, fromIso, toIso]);

  const statusMetrics = useMemo(() => {
    const counts = { Pass: 0, Fail: 0, Error: 0, Skipped: 0 };
    for (const r of filtered) {
      const s = normalizeResultStatus(r.status);
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [filtered]);

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "Result",
        width: 190,
        render: (r) => (
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{r.id}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge variant="neutral">Mock</Badge>
              <span style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 800 }}>
                Exec: {r.executionId}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "project",
        header: "Project / Test Case",
        render: (r) => {
          const p = projectById[r.projectId] || null;
          return (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>
                  {p ? p.name : "Unknown project"}
                </span>
                <Badge variant="primary">{r.projectId}</Badge>
              </div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
                Test: <span style={{ fontWeight: 900 }}>{r.testCaseName}</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
                Device: <span style={{ fontWeight: 900 }}>{r.device}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        width: 160,
        render: (r) => (
          <div style={{ display: "grid", gap: 6 }}>
            <Badge variant={badgeVariantForResultStatus(r.status)}>{normalizeResultStatus(r.status)}</Badge>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 800 }}>
              {formatResultDateTime(r.createdAt)}
            </div>
          </div>
        ),
      },
      {
        key: "artifacts",
        header: "Artifacts",
        width: 260,
        render: (r) => {
          const items = Array.isArray(r.artifacts) ? r.artifacts : [];
          const top = items.slice(0, 2);
          return (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {top.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="btn btn--secondary"
                    style={{ padding: "6px 10px", fontSize: 12 }}
                    onClick={() => setDownloadModal({ open: true, item: { ...a, resultId: r.id } })}
                    aria-label={`Download ${a.name} (mock)`}
                  >
                    Download {a.type.toUpperCase()}
                  </button>
                ))}
                {items.length > 2 ? (
                  <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(17, 24, 39, 0.62)" }}>
                    +{items.length - 2} more
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 700 }}>
                Total:{" "}
                {formatBytes(items.reduce((sum, x) => sum + (Number(x.sizeBytes) || 0), 0))}
              </div>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        width: 220,
        render: (r) => {
          const exec = execById[r.executionId] || null;
          return (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/results/${r.id}`)}>
                View
              </Button>
              {exec ? (
                <Link to={`/executions/${exec.id}`} style={{ textDecoration: "none" }}>
                  <Button variant="secondary" size="sm">
                    Execution
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  Execution
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [navigate, execById, projectById]
  );

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <h1 className="page__title">Results</h1>
            <p className="page__subtitle">
              Review pass/fail outcomes, metrics, and downloadable artifacts for each execution result.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setProjectFilter("All");
                setStatusFilter("All");
                setFromTs(defaultFrom);
                setToTs(defaultTo);
              }}
            >
              Reset
            </Button>
          </div>
        </header>

        <section
          aria-label="Results status metrics"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div className="grid2">
            <div className="statCard">
              <div className="statCard__label">Pass</div>
              <div className="statCard__value" style={{ color: "var(--color-success)" }}>
                {statusMetrics.Pass || 0}
              </div>
            </div>
            <div className="statCard">
              <div className="statCard__label">Fail</div>
              <div className="statCard__value" style={{ color: "var(--color-error)" }}>
                {statusMetrics.Fail || 0}
              </div>
            </div>
            <div className="statCard">
              <div className="statCard__label">Error</div>
              <div className="statCard__value" style={{ color: "var(--color-error)" }}>
                {statusMetrics.Error || 0}
              </div>
            </div>
            <div className="statCard">
              <div className="statCard__label">Skipped</div>
              <div className="statCard__value" style={{ color: "rgba(17, 24, 39, 0.72)" }}>
                {statusMetrics.Skipped || 0}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
            Counts reflect the current filters (project, status, and time range).
          </div>
        </section>

        <section
          aria-label="Results controls"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, alignItems: "end" }}>
            <TextInput
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by result ID, execution ID, device, artifact…"
              ariaLabel="Search results"
              helperText={`Showing ${filtered.length} of ${results.length} results.`}
            />

            <SelectField
              id="results-project-filter"
              label="Project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={projectOptions}
              helperText="Filter results by project."
            />

            <SelectField
              id="results-status-filter"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              helperText="Filter by pass/fail/error/skipped."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <TextInput
              label="From (time range)"
              type="datetime-local"
              value={fromTs}
              onChange={(e) => setFromTs(e.target.value)}
              ariaLabel="From time range"
              helperText="Uses result createdAt timestamp."
            />
            <TextInput
              label="To (time range)"
              type="datetime-local"
              value={toTs}
              onChange={(e) => setToTs(e.target.value)}
              ariaLabel="To time range"
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <Badge variant="primary">Mock mode</Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
              Results are read from local mock data. Artifact downloads show a mock confirmation dialog.
            </div>
          </div>
        </section>

        <section aria-label="Results table">
          <Table
            ariaLabel="Results table"
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title={results.length === 0 ? "No results yet" : "No matches"}
                description={
                  results.length === 0
                    ? "Run some executions to produce results."
                    : "Try adjusting your search or filters (status, time range, project)."
                }
                action={
                  results.length > 0 ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setQuery("");
                        setProjectFilter("All");
                        setStatusFilter("All");
                        setFromTs(defaultFrom);
                        setToTs(defaultTo);
                      }}
                    >
                      Reset filters
                    </Button>
                  ) : null
                }
              />
            }
          />
        </section>

        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
          Tip: Open a result directly via URL (e.g.,{" "}
          <Link to="/results/res-90001" style={{ fontWeight: 900 }}>
            /results/res-90001
          </Link>
          ).
        </div>

        <Modal
          open={downloadModal.open}
          title="Download artifact (mock)"
          description={
            downloadModal.item
              ? `This will be wired to the backend later. For now, this confirms the intended action.`
              : undefined
          }
          onClose={() => setDownloadModal({ open: false, item: null })}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => setDownloadModal({ open: false, item: null })}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  // Mock action: we simply close. Later this would call API and trigger browser download.
                  setDownloadModal({ open: false, item: null });
                }}
              >
                Confirm
              </Button>
            </div>
          }
        >
          {downloadModal.item ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{downloadModal.item.name}</div>
                <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.5 }}>
                  {downloadModal.item.hint || "Artifact/attachment download."}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(17, 24, 39, 0.12)",
                  background: "rgba(17, 24, 39, 0.04)",
                  padding: 12,
                  display: "grid",
                  gap: 6,
                  fontSize: 13,
                  color: "rgba(17, 24, 39, 0.78)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Type: </span>
                  <span style={{ fontWeight: 800 }}>{String(downloadModal.item.type).toUpperCase()}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Size: </span>
                  <span style={{ fontWeight: 800 }}>{formatBytes(downloadModal.item.sizeBytes)}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Created: </span>
                  <span style={{ fontWeight: 800 }}>{formatResultDateTime(downloadModal.item.createdAt)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
