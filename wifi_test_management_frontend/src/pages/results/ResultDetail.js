import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function verdictPillClass(verdictOrStatus) {
  const v = String(verdictOrStatus || "").toLowerCase();
  if (v === "pass" || v === "passed") return "pill pill--success";
  if (v === "fail" || v === "failed") return "pill pill--danger";
  if (v === "running") return "pill pill--info";
  if (v === "skipped") return "pill pill--muted";
  return "pill pill--muted";
}

function normalizeOutcome(result) {
  return String(result?.status || result?.verdict || "—");
}

// PUBLIC_INTERFACE
export default function ResultDetail() {
  /** Result detail page with related entity navigation and status indicators. */

  const { resultId } = useParams();
  const client = useApiClient();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [result, setResult] = useState(null);
  const [project, setProject] = useState(null);
  const [testCase, setTestCase] = useState(null);
  const [execution, setExecution] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!resultId) return;

      setLoading(true);
      setError(null);
      setResult(null);
      setProject(null);
      setTestCase(null);
      setExecution(null);

      const res = await resultsApi.getResult(client, resultId);

      if (!mounted) return;

      if (!res.ok) {
        setError(res);
        notifyApiError(toast, res, "Failed to load result");
        setLoading(false);
        return;
      }

      const r = res.data || null;
      setResult(r);

      // best-effort associated objects (non-fatal)
      if (r?.projectId) {
        const pRes = await projectsApi.getProject(client, r.projectId);
        if (mounted && pRes.ok) setProject(pRes.data || null);
      }
      if (r?.testCaseId) {
        const tcRes = await testCasesApi.getTestCase(client, r.testCaseId);
        if (mounted && tcRes.ok) setTestCase(tcRes.data || null);
      }
      if (r?.executionId) {
        const eRes = await executionsApi.getExecution(client, r.executionId);
        if (mounted && eRes.ok) setExecution(eRes.data || null);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [client, resultId, toast]);

  const title = useMemo(() => {
    if (!result) return "Result Detail";
    return result.label ? `Result: ${result.label}` : `Result: ${result.id}`;
  }, [result]);

  const outcome = normalizeOutcome(result);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">{title}</h1>
          <p className="muted">
            {resultId ? (
              <>
                Result <strong>{resultId}</strong>
              </>
            ) : (
              "Missing result id."
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn--secondary" to="/results">
            Back to Results
          </Link>

          {result?.executionId ? (
            <Link
              className="btn btn--secondary"
              to={`/results?executionId=${encodeURIComponent(result.executionId)}`}
            >
              View execution results
            </Link>
          ) : null}

          <button
            type="button"
            className="btn btn--secondary"
            onClick={() =>
              toast.push({
                level: "info",
                title: "Result opened",
                message: "You are viewing a single result record.",
              })
            }
            disabled={loading}
          >
            Notify
          </button>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          {loading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">Fetching result details from the API.</div>
            </>
          ) : error ? (
            <>
              <div className="card__title">Failed to load</div>
              <div className="card__body">
                {error.message || "Request failed."}
                {error.status ? ` (HTTP ${error.status})` : ""}
              </div>
            </>
          ) : !result ? (
            <>
              <div className="card__title">Not found</div>
              <div className="card__body">
                The result doesn’t exist (or isn’t visible in the current API mode).
              </div>
            </>
          ) : (
            <>
              <div className="card__title">Outcome</div>
              <div className="card__body">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className={verdictPillClass(outcome)}>{outcome}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Updated: {formatWhen(result.updatedAt)}
                  </span>
                </div>

                <div className="kv" style={{ marginTop: 14 }}>
                  <div className="kv__row">
                    <div className="kv__key">Result ID</div>
                    <div className="kv__value">{result.id}</div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Label</div>
                    <div className="kv__value">{result.label || "—"}</div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Created</div>
                    <div className="kv__value">{formatWhen(result.createdAt)}</div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Execution</div>
                    <div className="kv__value">
                      {result.executionId ? (
                        <Link className="table__link" to={`/executions/${result.executionId}`}>
                          {execution?.label || result.executionId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Project</div>
                    <div className="kv__value">
                      {result.projectId ? (
                        <Link className="table__link" to={`/projects/${result.projectId}`}>
                          {project?.name || result.projectId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Test Case</div>
                    <div className="kv__value">
                      {result.testCaseId ? (
                        <Link className="table__link" to={`/test-cases/${result.testCaseId}`}>
                          {testCase?.name || result.testCaseId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  This page shows core result metadata. Detailed metrics/charts can be added later when
                  the backend provides them.
                </div>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card__title">Navigate</div>
          <div className="card__body">
            {!result ? (
              <div className="muted">Load a result to see related links.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {result.projectId ? (
                  <Link className="btn btn--secondary" to={`/projects/${result.projectId}`}>
                    Open Project
                  </Link>
                ) : null}

                {result.testCaseId ? (
                  <Link className="btn btn--secondary" to={`/test-cases/${result.testCaseId}`}>
                    Open Test Case
                  </Link>
                ) : null}

                {result.executionId ? (
                  <Link className="btn btn--secondary" to={`/executions/${result.executionId}`}>
                    Open Execution
                  </Link>
                ) : null}

                <Link
                  className="btn btn--secondary"
                  to={`/results?projectId=${encodeURIComponent(result.projectId || "")}&testCaseId=${encodeURIComponent(
                    result.testCaseId || ""
                  )}&executionId=${encodeURIComponent(result.executionId || "")}`}
                >
                  View similar results
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
