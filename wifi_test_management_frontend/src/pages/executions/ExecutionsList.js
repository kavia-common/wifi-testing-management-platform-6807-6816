import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Table from "../../components/common/Table";
import {
  executionsApi,
  notifyApiError,
  projectsApi,
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

// PUBLIC_INTERFACE
export default function ExecutionsList() {
  /** Executions list page with API integration and optional project filter. */

  const client = useApiClient();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("projectId") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [executions, setExecutions] = useState([]);
  const [projectsById, setProjectsById] = useState({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const res = await executionsApi.listExecutions(client, {
        projectId: projectId || undefined,
      });

      if (!mounted) return;

      if (!res.ok) {
        setError(res);
        setExecutions([]);
        notifyApiError(toast, res, "Failed to load executions");
        setLoading(false);
        return;
      }

      const items = Array.isArray(res.data) ? res.data : [];
      setExecutions(items);

      // Load project names for displayed rows (non-fatal, best-effort).
      const uniqueProjectIds = Array.from(
        new Set(items.map((e) => e.projectId).filter(Boolean))
      );

      const nextMap = {};
      await Promise.all(
        uniqueProjectIds.map(async (pid) => {
          const pRes = await projectsApi.getProject(client, pid);
          if (pRes.ok && pRes.data) nextMap[pid] = pRes.data;
        })
      );

      if (mounted) setProjectsById(nextMap);

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [client, projectId, toast]);

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "Execution",
        render: (row) => (
          <Link className="table__link" to={`/executions/${row.id}`}>
            {row.id}
          </Link>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <span className={statusPillClass(row.status)}>{row.status || "—"}</span>
        ),
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
        key: "startedAt",
        header: "Started",
        render: (row) => formatWhen(row.startedAt),
      },
      {
        key: "finishedAt",
        header: "Finished",
        render: (row) => formatWhen(row.finishedAt),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (row) => (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Link className="btn btn--secondary" to={`/executions/${row.id}`}>
              View
            </Link>
            <Link
              className="btn btn--secondary"
              to={`/results?executionId=${encodeURIComponent(row.id)}`}
            >
              Results
            </Link>
          </div>
        ),
      },
    ],
    [projectsById]
  );

  const emptyTitle = projectId ? "No executions for this project" : "No executions yet";
  const emptyDescription = projectId
    ? "Start an execution for this project to begin tracking status and results."
    : "Create an execution to begin tracking status and results.";

  const createHref = projectId
    ? `/executions/new?projectId=${encodeURIComponent(projectId)}`
    : "/executions/new";

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Executions</h1>
          <p className="muted">
            Track execution status, start/stop runs, and navigate to results.
            {projectId ? (
              <>
                {" "}
                Filtered by project <strong>{projectId}</strong>.
              </>
            ) : null}
          </p>
        </div>
        <Link className="btn" to={createHref}>
          New Execution
        </Link>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Execution runs</div>
          <div className="card__body">
            <Table
              aria-label="Executions table"
              columns={columns}
              rows={executions}
              loading={loading}
              error={error}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              actions={
                projectId ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="muted" style={{ fontSize: 12 }}>
                      Project filter:
                    </span>
                    <Link className="table__link" to={`/projects/${projectId}`}>
                      {projectsById[projectId]?.name || projectId}
                    </Link>
                    <Link className="btn btn--secondary" to="/executions">
                      Clear filter
                    </Link>
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
