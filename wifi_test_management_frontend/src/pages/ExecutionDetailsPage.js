import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, EmptyState } from "../components/ui";
import { getMockProjectsSeed } from "./projectsMockData";
import { getMockTestCasesSeed } from "./testCasesMockData";
import {
  badgeVariantForExecutionStatus,
  computeDurationMs,
  computeExecutionProgressPercent,
  formatDateTime,
  formatDuration,
  getMockExecutionsSeed,
  hydrateExecutionDerivedFields,
  makeExecutionId,
  normalizeExecutionStatus,
} from "./executionsMockData";

function KeyValueGrid({ items }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", fontWeight: 700 }}>No parameters.</div>;
  }

  return (
    <div style={{ overflow: "auto", width: "100%" }}>
      <table
        style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 520 }}
        aria-label="Execution parameters table"
      >
        <thead>
          <tr>
            <th
              scope="col"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(17, 24, 39, 0.65)",
                borderBottom: "1px solid var(--color-border)",
                background: "rgba(30, 58, 138, 0.06)",
              }}
            >
              Key
            </th>
            <th
              scope="col"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(17, 24, 39, 0.65)",
                borderBottom: "1px solid var(--color-border)",
                background: "rgba(30, 58, 138, 0.06)",
              }}
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, idx) => (
            <tr key={`${p.key}-${idx}`}>
              <td
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  borderBottom: "1px solid rgba(17, 24, 39, 0.06)",
                  fontWeight: 900,
                  color: "rgba(17, 24, 39, 0.82)",
                  whiteSpace: "nowrap",
                }}
              >
                {p.key}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  borderBottom: "1px solid rgba(17, 24, 39, 0.06)",
                  fontWeight: 700,
                  color: "rgba(17, 24, 39, 0.78)",
                }}
              >
                {p.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ steps }) {
  const list = Array.isArray(steps) ? steps : [];

  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }} aria-label="Execution status timeline">
      {list.map((s, idx) => {
        const isDone = s.state === "done";
        const isActive = s.state === "active";

        const dotBg = isDone ? "var(--color-success)" : isActive ? "var(--color-primary)" : "rgba(17, 24, 39, 0.22)";
        const border = isDone || isActive ? "transparent" : "rgba(17, 24, 39, 0.22)";
        const labelColor = isActive ? "rgba(17, 24, 39, 0.92)" : "rgba(17, 24, 39, 0.78)";

        return (
          <li key={s.key} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 10, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 8, alignItems: "center" }}>
              <div
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: dotBg,
                  border: `2px solid ${border}`,
                  boxShadow: isActive ? "0 0 0 4px rgba(30, 58, 138, 0.14)" : "none",
                }}
              />
              {idx < list.length - 1 ? (
                <div aria-hidden="true" style={{ width: 2, height: 22, marginLeft: 6, background: "rgba(17, 24, 39, 0.10)" }} />
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 900, color: labelColor }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 700 }}>
                {isDone ? "Done" : isActive ? "In progress" : "Pending"}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Logs({ lines }) {
  const list = Array.isArray(lines) ? lines : [];

  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid rgba(17, 24, 39, 0.12)",
        background: "rgba(17, 24, 39, 0.04)",
        padding: 12,
        maxHeight: 320,
        overflow: "auto",
      }}
      aria-label="Execution logs"
      role="region"
    >
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: 12,
          color: "rgba(17, 24, 39, 0.86)",
          lineHeight: 1.6,
          display: "grid",
          gap: 4,
        }}
      >
        {list.map((l, idx) => (
          <div key={`${l.ts}-${idx}`} style={{ display: "grid", gridTemplateColumns: "172px 58px 1fr", gap: 10 }}>
            <span style={{ color: "rgba(17, 24, 39, 0.70)" }}>{formatDateTime(l.ts)}</span>
            <span
              style={{
                fontWeight: 900,
                color: l.level === "ERROR" ? "var(--color-error)" : l.level === "WARN" ? "var(--color-secondary)" : "rgba(17, 24, 39, 0.78)",
              }}
            >
              {l.level}
            </span>
            <span>{l.msg}</span>
          </div>
        ))}
        {list.length === 0 ? (
          <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", fontWeight: 700 }}>No logs.</div>
        ) : null}
      </div>
    </div>
  );
}

function pushLog(execution, level, msg) {
  const ts = new Date().toISOString();
  const next = { ...execution };
  next.logs = [...(execution.logs || []), { ts, level, msg }];
  return next;
}

// PUBLIC_INTERFACE
export default function ExecutionDetailsPage() {
  /** Execution detail screen: summary, parameters, timeline, and logs (mock/local state). */
  const { executionId } = useParams();
  const navigate = useNavigate();

  // Local mock data for this page (kept self-contained as requested).
  const [projects] = useState(() => getMockProjectsSeed());
  const [testCases] = useState(() => getMockTestCasesSeed());
  const [executions, setExecutions] = useState(() => getMockExecutionsSeed().map((e) => hydrateExecutionDerivedFields(e, projects, testCases)));

  const execution = useMemo(
    () => executions.find((e) => String(e.id) === String(executionId)) || null,
    [executions, executionId]
  );

  const project = useMemo(() => projects.find((p) => p.id === execution?.projectId) || null, [projects, execution]);
  const testCase = useMemo(() => testCases.find((t) => t.id === execution?.testCaseId) || null, [testCases, execution]);

  const status = normalizeExecutionStatus(execution?.status);
  const progress = execution ? computeExecutionProgressPercent(execution) : 0;
  const durationMs = execution ? computeDurationMs(execution) : null;

  function updateExecution(nextExec) {
    setExecutions((prev) =>
      prev.map((e) => (e.id === nextExec.id ? hydrateExecutionDerivedFields(nextExec, projects, testCases) : e))
    );
  }

  function handleCancel() {
    if (!execution) return;
    const s = normalizeExecutionStatus(execution.status);
    if (s !== "Running") return;

    const nowIso = new Date().toISOString();
    let next = { ...execution, status: "Canceled", finishedAt: nowIso };
    next = pushLog(next, "WARN", "Cancellation requested from UI (mock)");
    next = pushLog(next, "INFO", "Execution canceled; runner resources released");
    updateExecution(next);
  }

  function handleRerun() {
    if (!execution) return;
    const nowIso = new Date().toISOString();
    const newId = makeExecutionId();

    const fresh = hydrateExecutionDerivedFields(
      {
        id: newId,
        projectId: execution.projectId,
        testCaseId: execution.testCaseId,
        status: "Queued",
        createdAt: nowIso,
        expectedDurationSec: execution.expectedDurationSec ?? 240,
        parameters: execution.parameters || [],
      },
      projects,
      testCases
    );

    setExecutions((prev) => [fresh, ...prev]);
    navigate(`/executions/${newId}`);
  }

  function handleStartNow() {
    if (!execution) return;
    const s = normalizeExecutionStatus(execution.status);
    if (s !== "Queued" && s !== "Scheduled") return;

    const nowIso = new Date().toISOString();
    let next = { ...execution, status: "Running", startedAt: nowIso, scheduledAt: execution.scheduledAt ?? null };
    next = pushLog(next, "INFO", "Start requested from UI (mock)");
    next = pushLog(next, "INFO", "Runner acquired: lab-runner-03");
    updateExecution(next);
  }

  if (!execution) {
    return (
      <div className="page">
        <div className="pageCard">
          <header className="page__header">
            <div>
              <h1 className="page__title">Execution Details</h1>
              <p className="page__subtitle">Execution not found in local mock data.</p>
            </div>
          </header>

          <EmptyState
            title="Execution not found"
            description={
              <span>
                The execution ID <span style={{ fontWeight: 900 }}>{executionId}</span> is not available in this mock dataset.
                Go back to the list to pick an existing execution.
              </span>
            }
            action={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => navigate("/executions")}>
                  Back to Executions
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const canCancel = status === "Running";
  const canStart = status === "Queued" || status === "Scheduled";

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h1 className="page__title" style={{ marginRight: 6 }}>
                Execution {execution.id}
              </h1>
              <Badge variant={badgeVariantForExecutionStatus(status)}>{status}</Badge>
              {project ? (
                <Badge variant="primary">Project: {project.name}</Badge>
              ) : (
                <Badge variant="secondary">Project: Unknown</Badge>
              )}
            </div>
            <p className="page__subtitle">
              {testCase ? (
                <>
                  Test case:{" "}
                  <Link to={`/test-cases/${testCase.id}`} style={{ fontWeight: 900 }}>
                    {testCase.name}
                  </Link>
                </>
              ) : (
                "Test case: Unknown"
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => navigate("/executions")}>
              Back
            </Button>
            {canStart ? (
              <Button variant="primary" onClick={handleStartNow}>
                Start
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="error" onClick={handleCancel}>
                Cancel
              </Button>
            ) : null}
            <Button variant="secondary" onClick={handleRerun}>
              Rerun
            </Button>
          </div>
        </header>

        <section
          aria-label="Execution summary"
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
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "170px 1fr",
                  gap: 10,
                  fontSize: 13,
                  color: "rgba(17, 24, 39, 0.78)",
                }}
              >
                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Created</div>
                <div style={{ fontWeight: 800 }}>{formatDateTime(execution.createdAt)}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Scheduled</div>
                <div style={{ fontWeight: 800 }}>{execution.scheduledAt ? formatDateTime(execution.scheduledAt) : "—"}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Started</div>
                <div style={{ fontWeight: 800 }}>{execution.startedAt ? formatDateTime(execution.startedAt) : "—"}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Finished</div>
                <div style={{ fontWeight: 800 }}>{execution.finishedAt ? formatDateTime(execution.finishedAt) : "—"}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Duration</div>
                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.88)" }}>{formatDuration(durationMs)}</div>
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
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge variant="primary">Progress</Badge>
                  <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.88)" }}>{progress}%</div>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(17, 24, 39, 0.08)",
                    overflow: "hidden",
                    border: "1px solid rgba(17, 24, 39, 0.10)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: status === "Failed" ? "var(--color-error)" : status === "Completed" ? "var(--color-success)" : "var(--color-primary)",
                      transition: "width 200ms ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 700 }}>
                  Progress is a mock estimate (API integration later).
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                  Status timeline
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                  Live-like steps for the execution lifecycle.
                </div>
              </div>
              <Timeline steps={execution.timeline} />
            </div>
          </div>
        </section>

        <section
          aria-label="Execution parameters"
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
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Parameters
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Key/value overrides used at runtime (mock).
              </div>
            </div>

            {project ? (
              <Link to={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="sm">
                  View Project
                </Button>
              </Link>
            ) : null}
          </div>

          <div style={{ marginTop: 12 }}>
            <KeyValueGrid items={execution.parameters} />
          </div>
        </section>

        <section
          aria-label="Execution logs"
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
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Logs
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Scrollable mock log stream. In backend mode, this will be live-updated.
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateExecution(pushLog(execution, "INFO", "User refreshed logs (mock)"));
              }}
            >
              Refresh
            </Button>
          </div>

          <div style={{ marginTop: 12 }}>
            <Logs lines={execution.logs} />
          </div>
        </section>
      </div>
    </div>
  );
}
