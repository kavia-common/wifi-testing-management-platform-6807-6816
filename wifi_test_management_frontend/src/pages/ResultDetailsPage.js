import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, EmptyState, Table, Modal } from "../components/ui";
import { getMockProjectsSeed } from "./projectsMockData";
import { getMockExecutionsSeed, formatDateTime } from "./executionsMockData";
import {
  badgeVariantForResultStatus,
  formatBytes,
  formatResultDateTime,
  getMockResultsSeed,
  normalizeResultStatus,
} from "./resultsMockData";

function MetricCard({ label, value, hint, accent = "rgba(30, 58, 138, 0.10)" }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid rgba(17, 24, 39, 0.12)",
        background: "rgba(255, 255, 255, 0.92)",
        boxShadow: "var(--shadow-sm)",
        padding: 12,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(17, 24, 39, 0.60)" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 18, fontWeight: 950, color: "rgba(17, 24, 39, 0.92)" }}>{value}</div>
        <div
          aria-hidden="true"
          style={{
            height: 10,
            width: 64,
            borderRadius: 999,
            background: accent,
            border: "1px solid rgba(30, 58, 138, 0.14)",
          }}
        />
      </div>
      {hint ? <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 700 }}>{hint}</div> : null}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function ResultDetailsPage() {
  /** Result detail screen: status/summary, metrics, artifacts/attachments (mock/local data). */
  const { resultId } = useParams();
  const navigate = useNavigate();

  const [projects] = useState(() => getMockProjectsSeed());
  const [executions] = useState(() => getMockExecutionsSeed());
  const [results] = useState(() => getMockResultsSeed());

  const result = useMemo(() => results.find((r) => String(r.id) === String(resultId)) || null, [results, resultId]);
  const execution = useMemo(
    () => executions.find((e) => String(e.id) === String(result?.executionId)) || null,
    [executions, result]
  );
  const project = useMemo(() => projects.find((p) => p.id === result?.projectId) || null, [projects, result]);

  const [downloadModal, setDownloadModal] = useState({ open: false, item: null });

  const status = normalizeResultStatus(result?.status);

  const artifacts = Array.isArray(result?.artifacts) ? result.artifacts : [];
  const artifactsOnly = artifacts.filter((a) => a.kind === "artifact");
  const attachmentsOnly = artifacts.filter((a) => a.kind === "attachment");

  const artifactsColumns = useMemo(
    () => [
      {
        key: "name",
        header: "File",
        render: (a) => (
          <div style={{ display: "grid", gap: 3 }}>
            <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{a.name}</div>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 700 }}>
              {String(a.type).toUpperCase()} • {formatBytes(a.sizeBytes)}
            </div>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        width: 190,
        render: (a) => <span style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.78)" }}>{formatResultDateTime(a.createdAt)}</span>,
      },
      {
        key: "kind",
        header: "Kind",
        width: 130,
        render: (a) => <Badge variant={a.kind === "attachment" ? "secondary" : "neutral"}>{a.kind}</Badge>,
      },
      {
        key: "actions",
        header: "Actions",
        width: 170,
        render: (a) => (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" size="sm" onClick={() => setDownloadModal({ open: true, item: a })}>
              Download
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (!result) {
    return (
      <div className="page">
        <div className="pageCard">
          <header className="page__header">
            <div>
              <h1 className="page__title">Result Details</h1>
              <p className="page__subtitle">Result not found in local mock data.</p>
            </div>
          </header>

          <EmptyState
            title="Result not found"
            description={
              <span>
                The result ID <span style={{ fontWeight: 900 }}>{resultId}</span> is not available in this mock dataset.
                Go back to the list to pick an existing result.
              </span>
            }
            action={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => navigate("/results")}>
                  Back to Results
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const metrics = result.metrics || {};
  const totalBytes = artifacts.reduce((sum, a) => sum + (Number(a.sizeBytes) || 0), 0);

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h1 className="page__title" style={{ marginRight: 6 }}>
                Result {result.id}
              </h1>
              <Badge variant={badgeVariantForResultStatus(status)}>{status}</Badge>
              {project ? <Badge variant="primary">Project: {project.name}</Badge> : <Badge variant="secondary">Project: Unknown</Badge>}
            </div>
            <p className="page__subtitle">
              {execution ? (
                <>
                  Execution:{" "}
                  <Link to={`/executions/${execution.id}`} style={{ fontWeight: 900 }}>
                    {execution.id}
                  </Link>{" "}
                  • Created {formatDateTime(result.createdAt)}
                </>
              ) : (
                <>Created {formatDateTime(result.createdAt)}</>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => navigate("/results")}>
              Back
            </Button>
            {project ? (
              <Link to={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <Button variant="secondary">View Project</Button>
              </Link>
            ) : null}
          </div>
        </header>

        <section
          aria-label="Result summary"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                  Summary
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "rgba(17, 24, 39, 0.76)", lineHeight: 1.55, fontWeight: 650 }}>
                  {result.summary}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(30, 58, 138, 0.14)",
                  background: "rgba(30, 58, 138, 0.06)",
                  padding: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, fontSize: 13, color: "rgba(17, 24, 39, 0.78)" }}>
                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Test case</div>
                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{result.testCaseName}</div>

                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Device</div>
                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{result.device}</div>

                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Duration</div>
                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>
                    {Number(result.durationSec) > 0 ? `${result.durationSec}s` : "—"}
                  </div>

                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Artifacts total</div>
                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{formatBytes(totalBytes)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                  Metrics
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                  Snapshot of key performance metrics for this result (mock).
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <MetricCard label="Throughput" value={`${Math.round(metrics.throughputMbps ?? 0)} Mbps`} hint="Measured via mock iperf3 profile." />
                <MetricCard label="Latency (p50)" value={`${Math.round(metrics.latencyMsP50 ?? 0)} ms`} hint="Median ping under load." accent="rgba(245, 158, 11, 0.12)" />
                <MetricCard label="Roam time (p95)" value={`${Math.round(metrics.roamTimeMsP95 ?? 0)} ms`} hint="95th percentile handoff time." />
                <MetricCard label="Packet loss" value={`${(metrics.packetLossPct ?? 0).toFixed(1)}%`} hint="Higher values correlate with failures." accent="rgba(220, 38, 38, 0.10)" />
                <MetricCard label="RSSI" value={`${Math.round(metrics.rssiDbm ?? 0)} dBm`} hint={`Quality: ${metrics.rssiQuality || "Unknown"}`} />
                <MetricCard label="Status" value={status} hint="Derived from result outcome." accent={status === "Pass" ? "rgba(5, 150, 105, 0.12)" : "rgba(220, 38, 38, 0.10)"} />
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Artifacts and attachments"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Artifacts & Attachments
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Files generated by the run (artifacts) plus any attached evidence (attachments).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  // Mock bulk download action: open a modal for the first item if any.
                  const first = artifacts[0] || null;
                  if (first) setDownloadModal({ open: true, item: first });
                }}
                disabled={artifacts.length === 0}
              >
                Download all (mock)
              </Button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Table
              ariaLabel="Artifacts and attachments table"
              columns={artifactsColumns}
              rows={artifacts}
              getRowKey={(a) => a.id}
              emptyState={<EmptyState title="No artifacts" description="No artifacts were produced for this result." />}
            />
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Badge variant="neutral">Artifacts: {artifactsOnly.length}</Badge>
            <Badge variant="secondary">Attachments: {attachmentsOnly.length}</Badge>
          </div>
        </section>

        <section
          aria-label="Related information"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Related execution
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Context links for triage and traceability.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(17, 24, 39, 0.12)",
                background: "rgba(17, 24, 39, 0.03)",
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(17, 24, 39, 0.60)" }}>
                Execution
              </div>
              <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "rgba(17, 24, 39, 0.78)" }}>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>ID: </span>
                  <span style={{ fontWeight: 900 }}>{result.executionId}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Status: </span>
                  <span style={{ fontWeight: 800 }}>{execution?.status || "Unknown"}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Started: </span>
                  <span style={{ fontWeight: 800 }}>{execution?.startedAt ? formatDateTime(execution.startedAt) : "—"}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Finished: </span>
                  <span style={{ fontWeight: 800 }}>{execution?.finishedAt ? formatDateTime(execution.finishedAt) : "—"}</span>
                </div>

                <div style={{ marginTop: 6 }}>
                  {execution ? (
                    <Link to={`/executions/${execution.id}`} style={{ textDecoration: "none" }}>
                      <Button variant="primary" size="sm">
                        Open Execution
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="primary" size="sm" disabled>
                      Open Execution
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(17, 24, 39, 0.12)",
                background: "rgba(17, 24, 39, 0.03)",
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(17, 24, 39, 0.60)" }}>
                Project
              </div>
              <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "rgba(17, 24, 39, 0.78)" }}>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>ID: </span>
                  <span style={{ fontWeight: 900 }}>{result.projectId}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Name: </span>
                  <span style={{ fontWeight: 900 }}>{project?.name || "Unknown"}</span>
                </div>

                <div style={{ marginTop: 6 }}>
                  {project ? (
                    <Link to={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                      <Button variant="secondary" size="sm">
                        Open Project
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Open Project
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Modal
          open={downloadModal.open}
          title="Download artifact (mock)"
          description="Backend download endpoints will be wired later. This modal confirms what would be downloaded."
          onClose={() => setDownloadModal({ open: false, item: null })}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => setDownloadModal({ open: false, item: null })}>
                Close
              </Button>
              <Button variant="primary" onClick={() => setDownloadModal({ open: false, item: null })}>
                Confirm
              </Button>
            </div>
          }
        >
          {downloadModal.item ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 950, color: "rgba(17, 24, 39, 0.92)" }}>{downloadModal.item.name}</div>
                <Badge variant={downloadModal.item.kind === "attachment" ? "secondary" : "neutral"}>
                  {downloadModal.item.kind}
                </Badge>
              </div>

              <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.76)", lineHeight: 1.55, fontWeight: 650 }}>
                {downloadModal.item.hint || "Artifact download."}
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
