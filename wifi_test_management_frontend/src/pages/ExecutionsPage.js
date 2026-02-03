import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, Table, TextInput } from "../components/ui";
import ExecutionScheduleModal from "./ExecutionScheduleModal";
import {
  badgeVariantForExecutionStatus,
  computeExecutionProgressPercent,
  formatDateTime,
  normalizeExecutionStatus,
} from "./executionsMockData";
import { executionsApi, isMockModeEnabled, projectsApi, testCasesApi, useApiRequest } from "../api";

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

function toLocalDateInputValue(dateIso) {
  // yyyy-mm-dd for <input type="date">
  if (!dateIso) return "";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayMs(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function endOfDayMs(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T23:59:59.999`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function matchesQuery(exec, query) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    exec.id,
    exec.projectName,
    exec.testCaseName,
    exec.projectId,
    exec.testCaseId,
    exec.status,
    (exec.parameters || []).map((p) => `${p.key}:${p.value}`).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function matchesProject(exec, projectFilter) {
  if (!projectFilter || projectFilter === "All") return true;
  return String(exec.projectId) === String(projectFilter);
}

function matchesStatus(exec, statusFilter) {
  if (!statusFilter || statusFilter === "All") return true;
  return normalizeExecutionStatus(exec.status) === statusFilter;
}

function inDateRange(exec, fromDateStr, toDateStr) {
  if (!fromDateStr && !toDateStr) return true;
  const fromMs = startOfDayMs(fromDateStr);
  const toMs = endOfDayMs(toDateStr);

  const candidates = [exec.createdAt, exec.scheduledAt, exec.startedAt, exec.finishedAt].filter(Boolean);
  // Use the most relevant timestamp available for list filtering
  const basisIso = exec.finishedAt || exec.startedAt || exec.scheduledAt || exec.createdAt;
  const basisMs = basisIso ? new Date(basisIso).getTime() : null;

  if (!basisMs || Number.isNaN(basisMs)) {
    // fallback: any candidate within range
    return candidates.some((iso) => {
      const ms = new Date(iso).getTime();
      if (Number.isNaN(ms)) return false;
      if (fromMs != null && ms < fromMs) return false;
      if (toMs != null && ms > toMs) return false;
      return true;
    });
  }

  if (fromMs != null && basisMs < fromMs) return false;
  if (toMs != null && basisMs > toMs) return false;
  return true;
}

function mergeDefaultParameters(testCase, overrides) {
  // For now, if overrides provided use them; else use test case params.
  if (Array.isArray(overrides) && overrides.length > 0) return overrides;
  const defaults = Array.isArray(testCase?.parameters) ? testCase.parameters : [];
  return defaults.map((p) => ({ key: p.key, value: p.value }));
}

function appendLog(execution, level, msg) {
  const ts = new Date().toISOString();
  return { ...execution, logs: [...(execution.logs || []), { ts, level, msg }] };
}

// PUBLIC_INTERFACE
export default function ExecutionsPage() {
  /** Executions list screen: filter/search + schedule/start actions (API-backed with mock fallback). */
  const navigate = useNavigate();

  const { data: projectsData } = useApiRequest(() => projectsApi.list(), [], { immediate: true, initialData: [] });
  const { data: testCasesData } = useApiRequest(() => testCasesApi.list(), [], { immediate: true, initialData: [] });

  const {
    data: executionsData,
    loading,
    error,
    setData: setExecutions,
  } = useApiRequest(() => executionsApi.list(), [], { immediate: true, initialData: [] });

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const testCases = Array.isArray(testCasesData) ? testCasesData : [];
  const executions = Array.isArray(executionsData) ? executionsData : [];

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [fromDate, setFromDate] = useState(() => {
    // Default to last 14 days for a useful view
    const d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return toLocalDateInputValue(d.toISOString());
  });
  const [toDate, setToDate] = useState(() => toLocalDateInputValue(new Date().toISOString()));

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleInitial, setScheduleInitial] = useState(null);

  const projectOptions = useMemo(() => {
    const opts = [{ value: "All", label: "All projects" }];
    for (const p of projects) opts.push({ value: p.id, label: p.name });
    return opts;
  }, [projects]);

  const statusOptions = useMemo(
    () => [
      { value: "All", label: "All statuses" },
      { value: "Scheduled", label: "Scheduled" },
      { value: "Queued", label: "Queued" },
      { value: "Running", label: "Running" },
      { value: "Completed", label: "Completed" },
      { value: "Failed", label: "Failed" },
      { value: "Canceled", label: "Canceled" },
    ],
    []
  );

  const filtered = useMemo(() => {
    return executions
      .filter((e) => matchesQuery(e, query))
      .filter((e) => matchesProject(e, projectFilter))
      .filter((e) => matchesStatus(e, statusFilter))
      .filter((e) => inDateRange(e, fromDate, toDate))
      .sort((a, b) => {
        const aIso = a.finishedAt || a.startedAt || a.scheduledAt || a.createdAt;
        const bIso = b.finishedAt || b.startedAt || b.scheduledAt || b.createdAt;
        return String(bIso).localeCompare(String(aIso));
      });
  }, [executions, fromDate, projectFilter, query, statusFilter, toDate]);

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        width: 150,
        render: (e) => (
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{e.id}</div>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
              <Badge variant="neutral">{isMockModeEnabled() ? "Mock" : "API"}</Badge>
            </div>
          </div>
        ),
      },
      {
        key: "project",
        header: "Project",
        render: (e) => (
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{e.projectName}</span>
              <Badge variant="primary">{e.projectId}</Badge>
            </div>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
              Test: <span style={{ fontWeight: 800 }}>{e.testCaseName}</span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: 150,
        render: (e) => (
          <div style={{ display: "grid", gap: 6 }}>
            <Badge variant={badgeVariantForExecutionStatus(e.status)}>{normalizeExecutionStatus(e.status)}</Badge>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 800 }}>
              Progress: {computeExecutionProgressPercent(e)}%
            </div>
          </div>
        ),
      },
      {
        key: "times",
        header: "Scheduled / Started / Finished",
        width: 330,
        render: (e) => (
          <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 10 }}>
              <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.55)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Scheduled
              </span>
              <span style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.78)" }}>
                {e.scheduledAt ? formatDateTime(e.scheduledAt) : "—"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 10 }}>
              <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.55)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Started
              </span>
              <span style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.78)" }}>
                {e.startedAt ? formatDateTime(e.startedAt) : "—"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 10 }}>
              <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.55)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Finished
              </span>
              <span style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.78)" }}>
                {e.finishedAt ? formatDateTime(e.finishedAt) : "—"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: 320,
        render: (e) => {
          const status = normalizeExecutionStatus(e.status);
          const canStart = status === "Queued" || status === "Scheduled";

          return (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/executions/${e.id}`)}>
                View
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setScheduleInitial({ projectId: e.projectId, testCaseId: e.testCaseId, parameters: e.parameters || [] });
                  setScheduleOpen(true);
                }}
              >
                Schedule
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!canStart}
                onClick={async () => {
                  if (!canStart) return;
                  const nowIso = new Date().toISOString();
                  let next = { ...e, status: "Running", startedAt: nowIso };
                  next = appendLog(next, "INFO", "Start requested from list view");
                  next = appendLog(next, "INFO", "Runner acquired: lab-runner-03");
                  try {
                    const updated = await executionsApi.update(e.id, next);
                    setExecutions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  } catch (err) {
                    // eslint-disable-next-line no-alert
                    window.alert(err?.message || "Failed to start execution");
                  }
                }}
              >
                Start
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, setExecutions]
  );

  function openScheduleEmpty() {
    setScheduleInitial(null);
    setScheduleOpen(true);
  }

  async function handleScheduleSubmit(payload) {
    const nowIso = new Date().toISOString();

    const tc = testCases.find((t) => t.id === payload.testCaseId) || null;
    const params = mergeDefaultParameters(tc, payload.parameters);

    try {
      if (payload.mode === "start") {
        const created = await executionsApi.create({
          projectId: payload.projectId,
          testCaseId: payload.testCaseId,
          status: "Running",
          createdAt: nowIso,
          startedAt: nowIso,
          expectedDurationSec: 240,
          parameters: params,
        });

        setExecutions((prev) => [created, ...prev]);
        setScheduleOpen(false);
        navigate(`/executions/${created.id}`);
        return;
      }

      const created = await executionsApi.create({
        projectId: payload.projectId,
        testCaseId: payload.testCaseId,
        status: "Scheduled",
        createdAt: nowIso,
        scheduledAt: payload.scheduledAt,
        expectedDurationSec: 240,
        parameters: params,
      });

      setExecutions((prev) => [created, ...prev]);
      setScheduleOpen(false);
      navigate(`/executions/${created.id}`);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e?.message || "Failed to schedule execution");
    }
  }

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <h1 className="page__title">Executions</h1>
            <p className="page__subtitle">
              Track execution runs, schedules, and runtime status. Use filters to find runs by project, status, or date range.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="primary" onClick={openScheduleEmpty}>
              Schedule / Start
            </Button>
          </div>
        </header>

        <section
          aria-label="Executions controls"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <TextInput
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, project, test case, parameter…"
              ariaLabel="Search executions"
            />

            <SelectField
              id="exec-project-filter"
              label="Project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={projectOptions}
              helperText={`Showing ${filtered.length} of ${executions.length} executions.`}
            />

            <SelectField
              id="exec-status-filter"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              helperText="Filter by current execution status."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <TextInput
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              ariaLabel="From date"
              helperText="Filters by the most relevant timestamp (finished/started/scheduled/created)."
            />
            <TextInput label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} ariaLabel="To date" />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <Badge variant={isMockModeEnabled() ? "primary" : "neutral"}>
              {isMockModeEnabled() ? "Mock mode" : "API mode"}
            </Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
              Executions are loaded via the centralized API layer.
            </div>
          </div>

          {error ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-error)", fontWeight: 800 }}>
              Error: {error.message}
            </div>
          ) : null}
        </section>

        <section aria-label="Executions table">
          <Table
            ariaLabel="Executions table"
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title={loading ? "Loading executions…" : executions.length === 0 ? "No executions yet" : "No matches"}
                description={
                  loading
                    ? "Fetching executions."
                    : executions.length === 0
                      ? "Schedule or start your first execution to begin tracking run status and logs."
                      : "Try adjusting your search or filters."
                }
                action={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={openScheduleEmpty} disabled={loading}>
                      Schedule / Start
                    </Button>
                    {executions.length > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setQuery("");
                          setProjectFilter("All");
                          setStatusFilter("All");
                          setFromDate("");
                          setToDate("");
                        }}
                        disabled={loading}
                      >
                        Clear filters
                      </Button>
                    ) : null}
                  </div>
                }
              />
            }
          />
        </section>

        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
          Tip: You can open an execution directly via URL (e.g.,{" "}
          <Link to="/executions/exec-1001" style={{ fontWeight: 900 }}>
            /executions/exec-1001
          </Link>
          ).
        </div>

        <ExecutionScheduleModal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          onSubmit={handleScheduleSubmit}
          projects={projects}
          testCases={testCases}
          initialValues={scheduleInitial}
        />
      </div>
    </div>
  );
}

