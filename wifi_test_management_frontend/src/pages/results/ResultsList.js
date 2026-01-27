import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Table from "../../components/common/Table";
import {
  notifyApiError,
  projectsApi,
  resultsApi,
  testCasesApi,
  executionsApi,
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
  // Prefer explicit status; fall back to verdict.
  const raw = result?.status || result?.verdict || "";
  const v = String(raw).trim();
  if (!v) return "—";
  return v;
}

function computeSummary(results) {
  const summary = { total: 0, pass: 0, fail: 0, other: 0 };
  (Array.isArray(results) ? results : []).forEach((r) => {
    summary.total += 1;
    const v = String(normalizeOutcome(r)).toLowerCase();
    if (v === "pass" || v === "passed" || v === "pass/fail" || v === "passed") {
      summary.pass += 1;
    } else if (v === "fail" || v === "failed") {
      summary.fail += 1;
    } else {
      summary.other += 1;
    }
  });
  return summary;
}

function Chip({ tone = "muted", label }) {
  const klass =
    tone === "success"
      ? "pill pill--success"
      : tone === "danger"
        ? "pill pill--danger"
        : tone === "info"
          ? "pill pill--info"
          : tone === "warning"
            ? "pill pill--warning"
            : "pill pill--muted";

  return (
    <span className={klass} style={{ display: "inline-flex", alignItems: "center" }}>
      {label}
    </span>
  );
}

// PUBLIC_INTERFACE
export default function ResultsList() {
  /** Results list page with filtering and navigation to related entities. */

  const client = useApiClient();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const projectId = searchParams.get("projectId") || "";
  const testCaseId = searchParams.get("testCaseId") || "";
  const executionId = searchParams.get("executionId") || "";
  const status = searchParams.get("status") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [results, setResults] = useState([]);

  // best-effort entity lookups for nicer labels
  const [project, setProject] = useState(null);
  const [testCase, setTestCase] = useState(null);
  const [execution, setExecution] = useState(null);

  const [projectsById, setProjectsById] = useState({});
  const [testCasesById, setTestCasesById] = useState({});
  const [executionsById, setExecutionsById] = useState({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      setResults([]);
      setProject(null);
      setTestCase(null);
      setExecution(null);

      const res = await resultsApi.listResults(client, {
        projectId: projectId || undefined,
        testCaseId: testCaseId || undefined,
        executionId: executionId || undefined,
        status: status || undefined,
      });

      if (!mounted) return;

      if (!res.ok) {
        setError(res);
        notifyApiError(toast, res, "Failed to load results");
        setLoading(false);
        return;
      }

      const items = Array.isArray(res.data) ? res.data : [];
      setResults(items);

      // Pull unique foreign keys from returned results (best-effort; non-fatal).
      const uniqueProjectIds = Array.from(new Set(items.map((r) => r.projectId).filter(Boolean)));
      const uniqueTestCaseIds = Array.from(
        new Set(items.map((r) => r.testCaseId).filter(Boolean))
      );
      const uniqueExecutionIds = Array.from(
        new Set(items.map((r) => r.executionId).filter(Boolean))
      );

      const nextProjects = {};
      const nextTestCases = {};
      const nextExecutions = {};

      await Promise.all([
        Promise.all(
          uniqueProjectIds.map(async (pid) => {
            const pRes = await projectsApi.getProject(client, pid);
            if (pRes.ok && pRes.data) nextProjects[pid] = pRes.data;
          })
        ),
        Promise.all(
          uniqueTestCaseIds.map(async (tcid) => {
            const tcRes = await testCasesApi.getTestCase(client, tcid);
            if (tcRes.ok && tcRes.data) nextTestCases[tcid] = tcRes.data;
          })
        ),
        Promise.all(
          uniqueExecutionIds.map(async (eid) => {
            const eRes = await executionsApi.getExecution(client, eid);
            if (eRes.ok && eRes.data) nextExecutions[eid] = eRes.data;
          })
        ),
      ]);

      if (mounted) {
        setProjectsById(nextProjects);
        setTestCasesById(nextTestCases);
        setExecutionsById(nextExecutions);
      }

      // Focused objects for current filter chips.
      if (projectId) {
        const pRes = await projectsApi.getProject(client, projectId);
        if (mounted && pRes.ok) setProject(pRes.data || null);
      }
      if (testCaseId) {
        const tcRes = await testCasesApi.getTestCase(client, testCaseId);
        if (mounted && tcRes.ok) setTestCase(tcRes.data || null);
      }
      if (executionId) {
        const eRes = await executionsApi.getExecution(client, executionId);
        if (mounted && eRes.ok) setExecution(eRes.data || null);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [client, toast, projectId, testCaseId, executionId, status]);

  const summary = useMemo(() => computeSummary(results), [results]);

  const columns = useMemo(
    () => [
      {
        key: "label",
        header: "Result",
        render: (row) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Link className="table__link" to={`/results/${row.id}`}>
              {row.label || row.id}
            </Link>
            <span className="muted" style={{ fontSize: 12 }}>
              ID: {row.id}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => {
          const outcome = normalizeOutcome(row);
          return <span className={verdictPillClass(outcome)}>{outcome}</span>;
        },
      },
      {
        key: "projectId",
        header: "Project",
        render: (row) =>
          row.projectId ? (
            <Link className="table__link" to={`/projects/${row.projectId}`}>
              {projectsById[row.projectId]?.name || row.projectId}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        key: "testCaseId",
        header: "Test Case",
        render: (row) =>
          row.testCaseId ? (
            <Link className="table__link" to={`/test-cases/${row.testCaseId}`}>
              {testCasesById[row.testCaseId]?.name || row.testCaseId}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        key: "executionId",
        header: "Execution",
        render: (row) =>
          row.executionId ? (
            <Link className="table__link" to={`/executions/${row.executionId}`}>
              {executionsById[row.executionId]?.label || row.executionId}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (row) => formatWhen(row.createdAt),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (row) => (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Link className="btn btn--secondary" to={`/results/${row.id}`}>
              View
            </Link>
          </div>
        ),
      },
    ],
    [projectsById, testCasesById, executionsById]
  );

  function applyFilters(next) {
    const sp = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    });
    setSearchParams(sp, { replace: true });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const hasAnyFilter = Boolean(projectId || testCaseId || executionId || status);

  const emptyTitle = hasAnyFilter ? "No results match these filters" : "No results yet";
  const emptyDescription = hasAnyFilter
    ? "Try clearing one or more filters, or check another execution."
    : "Run an execution to start generating results.";

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Results</h1>
          <p className="muted">
            Review outcomes, drill into details, and navigate to related projects, test cases, and
            executions.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn--secondary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Filters</div>
          <div className="card__body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
                gap: 12,
                alignItems: "end",
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Project ID
                </span>
                <input
                  className="input"
                  value={projectId}
                  placeholder="e.g., p-001"
                  onChange={(e) => applyFilters({ projectId: e.target.value.trim() })}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Test Case ID
                </span>
                <input
                  className="input"
                  value={testCaseId}
                  placeholder="e.g., tc-101"
                  onChange={(e) => applyFilters({ testCaseId: e.target.value.trim() })}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Execution ID
                </span>
                <input
                  className="input"
                  value={executionId}
                  placeholder="e.g., ex-9001"
                  onChange={(e) => applyFilters({ executionId: e.target.value.trim() })}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  Status
                </span>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => applyFilters({ status: e.target.value })}
                >
                  <option value="">Any</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Running">Running</option>
                  <option value="Skipped">Skipped</option>
                </select>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 14,
              }}
            >
              <Chip tone="muted" label={`Total: ${summary.total}`} />
              <Chip tone="success" label={`Pass: ${summary.pass}`} />
              <Chip tone="danger" label={`Fail: ${summary.fail}`} />
              {summary.other ? <Chip tone="info" label={`Other: ${summary.other}`} /> : null}

              <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
                {hasAnyFilter ? "Active filters:" : "No active filters."}
              </span>

              {projectId ? (
                <Link className="table__link" to={`/projects/${projectId}`}>
                  Project: {project?.name || projectId}
                </Link>
              ) : null}
              {testCaseId ? (
                <Link className="table__link" to={`/test-cases/${testCaseId}`}>
                  Test Case: {testCase?.name || testCaseId}
                </Link>
              ) : null}
              {executionId ? (
                <Link className="table__link" to={`/executions/${executionId}`}>
                  Execution: {execution?.label || executionId}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__title">Results</div>
          <div className="card__body">
            <Table
              aria-label="Results table"
              columns={columns}
              rows={results}
              loading={loading}
              error={error}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              actions={
                hasAnyFilter ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="muted" style={{ fontSize: 12 }}>
                      Quick links:
                    </span>

                    {projectId ? (
                      <Link className="btn btn--secondary" to={`/executions?projectId=${projectId}`}>
                        Executions for project
                      </Link>
                    ) : null}

                    {executionId ? (
                      <Link className="btn btn--secondary" to={`/executions/${executionId}`}>
                        Execution detail
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() =>
                        toast.push({
                          level: "info",
                          title: "Filters applied",
                          message: "Results have been filtered using the URL query parameters.",
                        })
                      }
                      disabled={loading}
                    >
                      Notify
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}
