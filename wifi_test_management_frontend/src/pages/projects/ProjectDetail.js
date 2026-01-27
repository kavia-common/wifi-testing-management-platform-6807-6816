import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { notifyApiError, projectsApi, useApiClient, useToast } from "../../api";

// PUBLIC_INTERFACE
export default function ProjectDetail() {
  /** Project detail page with real API integration (mock/real via ApiClientProvider). */

  const { projectId } = useParams();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      const res = await projectsApi.getProject(client, projectId);
      if (!mounted) return;

      if (!res.ok) {
        setError(res);
        notifyApiError(toast, res, "Failed to load project");
        setProject(null);
        setLoading(false);
        return;
      }

      setProject(res.data || null);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [client, projectId, toast]);

  async function handleDelete() {
    if (!projectId) return;
    const label = project?.name || projectId;

    const confirmed = window.confirm(
      `Delete project "${label}"? This cannot be undone.`
    );
    if (!confirmed) return;

    const res = await projectsApi.deleteProject(client, projectId);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to delete project");
      return;
    }

    toast.push({
      level: "success",
      title: "Project deleted",
      message: `Deleted "${label}".`,
    });

    navigate("/projects");
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Project Detail</h1>
          <p className="muted">
            {projectId ? (
              <>
                Project <strong>{projectId}</strong>
              </>
            ) : (
              "Missing project id."
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn btn--secondary" to="/projects">
            Back to Projects
          </Link>

          <Link className="btn btn--secondary" to={`/projects/${projectId}/edit`}>
            Edit
          </Link>

          <button type="button" className="btn btn--danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          {loading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">Fetching project data.</div>
            </>
          ) : error ? (
            <>
              <div className="card__title">Failed to load</div>
              <div className="card__body">
                {error.message || "Request failed."}
                {error.status ? ` (HTTP ${error.status})` : ""}
              </div>
            </>
          ) : !project ? (
            <>
              <div className="card__title">Not found</div>
              <div className="card__body">
                The project doesn’t exist (or isn’t visible in the current API
                mode).
              </div>
            </>
          ) : (
            <>
              <div className="card__title">Overview</div>
              <div className="card__body">
                <div className="kv">
                  <div className="kv__row">
                    <div className="kv__key">Name</div>
                    <div className="kv__value">{project.name || "—"}</div>
                  </div>
                  <div className="kv__row">
                    <div className="kv__key">Status</div>
                    <div className="kv__value">{project.status || "Active"}</div>
                  </div>
                  <div className="kv__row">
                    <div className="kv__key">Created</div>
                    <div className="kv__value">
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="kv__row">
                    <div className="kv__key">Updated</div>
                    <div className="kv__value">
                      {project.updatedAt
                        ? new Date(project.updatedAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="kv__row">
                    <div className="kv__key">Description</div>
                    <div className="kv__value">
                      {project.description ? project.description : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card__title">Linked items</div>
          <div className="card__body">
            Future: test cases and executions associated with this project.
          </div>
        </section>
      </div>
    </>
  );
}
