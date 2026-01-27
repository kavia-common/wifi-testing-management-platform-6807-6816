import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  executionsApi,
  notifyApiError,
  projectsApi,
  resultsApi,
  testCasesApi,
  useApiClient,
  useToast,
} from "../../api";

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "running") return "pill pill--info";
  if (s === "completed") return "pill pill--success";
  if (s === "failed") return "pill pill--danger";
  if (s === "stopped") return "pill pill--warning";
  if (s === "queued") return "pill pill--muted";
  return "pill pill--muted";
}

function canStart(status) {
  const s = String(status || "").toLowerCase();
  return s !== "running";
}

function canStop(status) {
  const s = String(status || "").toLowerCase();
  return s === "running";
}

// PUBLIC_INTERFACE
export default function ExecutionDetail() {
  /** Execution detail page with start/stop/status updates and result navigation. */

  const { executionId } = useParams();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);

  const [execution, setExecution] = useState(null);
  const [project, setProject] = useState(null);
  const [testCase, setTestCase] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!executionId) return;

      setLoading(true);
      setError(null);
      setExecution(null);
      setProject(null);
      setTestCase(null);
      setResults([]);

      const res = await executionsApi.getExecution(client, executionId);
      if (!mounted) return;

      if (!res.ok) {
        setError(res);
        notifyApiError(toast, res, "Failed to load execution");
        setLoading(false);
        return;
      }

      const ex = res.data || null;
      setExecution(ex);

      // Best-effort associated objects (non-fatal).
      if (ex?.projectId) {
        const pRes = await projectsApi.getProject(client, ex.projectId);
        if (mounted && pRes.ok) setProject(pRes.data || null);
      }

      if (ex?.testCaseId) {
        const tcRes = await testCasesApi.getTestCase(client, ex.testCaseId);
        if (mounted && tcRes.ok) setTestCase(tcRes.data || null);
      }

      // Results list for this execution.
      const rRes = await resultsApi.listResults(client, {
        executionId,
      });
      if (mounted && rRes.ok) setResults(Array.isArray(rRes.data) ? rRes.data : []);

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [client, executionId, toast]);

  const status = execution?.status || "—";

  const primaryTitle = useMemo(() => {
    if (!execution) return "Execution Detail";
    return execution.label ? `Execution: ${execution.label}` : "Execution Detail";
  }, [execution]);

  async function refresh() {
    if (!executionId) return;
    const res = await executionsApi.getExecution(client, executionId);
    if (res.ok) setExecution(res.data || null);
  }

  async function handleStart() {
    if (!executionId || mutating) return;

    setMutating(true);
    const patch = {
      status: "Running",
      startedAt: execution?.startedAt || new Date().toISOString(),
      finishedAt: null,
    };

    const res = await executionsApi.updateExecution(client, executionId, patch);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to start execution");
      setMutating(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Execution started",
      message: `Execution ${executionId} is now running.`,
    });

    setExecution(res.data || patch);
    setMutating(false);
  }

  async function handleStop() {
    if (!executionId || mutating) return;

    const confirmed = window.confirm(
      "Stop this execution? This will mark it as Stopped and set a finished timestamp."
    );
    if (!confirmed) return;

    setMutating(true);

    const patch = {
      status: "Stopped",
      finishedAt: new Date().toISOString(),
    };

    const res = await executionsApi.updateExecution(client, executionId, patch);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to stop execution");
      setMutating(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Execution stopped",
      message: `Execution ${executionId} stopped.`,
    });

    setExecution(res.data || { ...execution, ...patch });
    setMutating(false);
  }

  async function handleMarkCompleted() {
    if (!executionId || mutating) return;

    setMutating(true);

    const patch = {
      status: "Completed",
      finishedAt: new Date().toISOString(),
    };

    const res = await executionsApi.updateExecution(client, executionId, patch);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to mark completed");
      setMutating(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Execution completed",
      message: `Execution ${executionId} marked Completed.`,
    });

    setExecution(res.data || { ...execution, ...patch });
    setMutating(false);
  }

  async function handleDelete() {
    if (!executionId || mutating) return;
    const label = execution?.label || executionId;

    const confirmed = window.confirm(
      `Delete execution "${label}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setMutating(true);

    const res = await executionsApi.deleteExecution(client, executionId);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to delete execution");
      setMutating(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Execution deleted",
      message: `Deleted "${label}".`,
    });

    setMutating(false);

    const backTo = execution?.projectId
      ? `/executions?projectId=${encodeURIComponent(execution.projectId)}`
      : "/executions";

    navigate(backTo);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">{primaryTitle}</h1>
          <p className="muted">
            {executionId ? (
              <>
                Execution <strong>{executionId}</strong>
              </>
            ) : (
              "Missing execution id."
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn--secondary" to="/executions">
            Back to Executions
          </Link>

          <Link
            className="btn btn--secondary"
            to={`/results?executionId=${encodeURIComponent(executionId || "")}`}
          >
            View Results
          </Link>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={refresh}
            disabled={loading || mutating}
          >
            Refresh
          </button>

          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={loading || mutating}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          {loading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">Fetching execution data.</div>
            </>
          ) : error ? (
            <>
              <div className="card__title">Failed to load</div>
              <div className="card__body">
                {error.message || "Request failed."}
                {error.status ? ` (HTTP ${error.status})` : ""}
              </div>
            </>
          ) : !execution ? (
            <>
              <div className="card__title">Not found</div>
              <div className="card__body">
                The execution doesn’t exist (or isn’t visible in the current API
                mode).
              </div>
            </>
          ) : (
            <>
              <div className="card__title">Status</div>
              <div className="card__body">
                <div className="kv">
                  <div className="kv__row">
                    <div className="kv__key">Status</div>
                    <div className="kv__value">
                      <span className={statusPillClass(status)}>{status}</span>
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Started</div>
                    <div className="kv__value">{formatWhen(execution.startedAt)}</div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Finished</div>
                    <div className="kv__value">{formatWhen(execution.finishedAt)}</div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Project</div>
                    <div className="kv__value">
                      {execution.projectId ? (
                        <Link className="table__link" to={`/projects/${execution.projectId}`}>
                          {project?.name || execution.projectId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Test Case</div>
                    <div className="kv__value">
                      {execution.testCaseId ? (
                        <Link className="table__link" to={`/test-cases/${execution.testCaseId}`}>
                          {testCase?.name || execution.testCaseId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Label</div>
                    <div className="kv__value">{execution.label || "—"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleStart}
                    disabled={mutating || !canStart(execution.status)}
                  >
                    {mutating ? "Updating…" : "Start"}
                  </button>

                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleStop}
                    disabled={mutating || !canStop(execution.status)}
                  >
                    Stop
                  </button>

                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleMarkCompleted}
                    disabled={mutating || String(execution.status || "").toLowerCase() === "completed"}
                  >
                    Mark Completed
                  </button>
                </div>

                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  Status updates are stored via the executions endpoint (mock/real depending on runtime
                  mode).
                </div>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card__title">Results</div>
          <div className="card__body">
            {!execution ? (
              <div className="muted">Load an execution to view results.</div>
            ) : results.length === 0 ? (
              <div className="muted">
                No results linked to this execution yet. When results are generated, they’ll show
                here and in the Results module.
              </div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {results.map((r) => (
                  <li key={r.id} style={{ margin: "6px 0" }}>
                    <Link to={`/results/${r.id}`}>{r.label || r.id}</Link>{" "}
                    <span className="muted" style={{ fontSize: 12 }}>
                      ({r.verdict || "—"})
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {execution ? (
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link
                  className="btn btn--secondary"
                  to={`/results?executionId=${encodeURIComponent(executionId)}`}
                >
                  View in Results list
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
