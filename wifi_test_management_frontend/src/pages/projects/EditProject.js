import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProjectForm from "./ProjectForm";
import { notifyApiError, projectsApi, useApiClient, useToast } from "../../api";

// PUBLIC_INTERFACE
export default function EditProject() {
  /** Edit project page using shared API endpoints and toasts. */

  const { projectId } = useParams();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  async function handleUpdate(payload) {
    if (!projectId) return;
    setSaving(true);

    const res = await projectsApi.updateProject(client, projectId, payload);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to update project");
      setSaving(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Project updated",
      message: `Updated "${res.data?.name || payload.name}".`,
    });

    setSaving(false);
    navigate(`/projects/${projectId}`);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Edit Project</h1>
          <p className="muted">
            {projectId ? (
              <>
                Editing project <strong>{projectId}</strong>.
              </>
            ) : (
              "Missing project id."
            )}
          </p>
        </div>
        <Link className="btn btn--secondary" to={projectId ? `/projects/${projectId}` : "/projects"}>
          Cancel
        </Link>
      </div>

      <div className="grid">
        <section className="card">
          {loading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">
                Fetching project data from the API.
              </div>
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
                This project doesn’t exist (or isn’t visible in the current API
                mode).
              </div>
            </>
          ) : (
            <>
              <div className="card__title">Project details</div>
              <div className="card__body" style={{ marginBottom: 12 }}>
                Update name, status, and description.
              </div>

              <ProjectForm
                initialValues={project}
                submitLabel="Update"
                submitting={saving}
                onCancel={() => navigate(`/projects/${projectId}`)}
                onSubmit={handleUpdate}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
