import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProjectForm from "./ProjectForm";
import { notifyApiError, projectsApi, useApiClient, useToast } from "../../api";

// PUBLIC_INTERFACE
export default function CreateProject() {
  /** Create project page using shared API endpoints and toasts. */

  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleCreate(payload) {
    setSaving(true);
    const res = await projectsApi.createProject(client, payload);

    if (!res.ok) {
      notifyApiError(toast, res, "Failed to create project");
      setSaving(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Project created",
      message: `Created "${res.data?.name || payload.name}".`,
    });

    setSaving(false);

    // Navigate to detail for visibility. Avoid assuming list ordering.
    const id = res.data?.id;
    if (id) navigate(`/projects/${id}`);
    else navigate("/projects");
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Create Project</h1>
          <p className="muted">
            Create a new project to group test cases and track executions.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/projects">
          Back to Projects
        </Link>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Project details</div>
          <div className="card__body" style={{ marginBottom: 12 }}>
            Fill in the basic information below.
          </div>

          <ProjectForm
            submitLabel="Create"
            submitting={saving}
            onCancel={() => navigate("/projects")}
            onSubmit={handleCreate}
          />
        </section>
      </div>
    </>
  );
}
