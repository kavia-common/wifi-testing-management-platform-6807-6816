import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import ProjectForm from "./ProjectForm";
import { notifyApiError, projectsApi, useApiClient, useToast } from "../../api";

// PUBLIC_INTERFACE
export default function ProjectsList() {
  /** Projects list page with CRUD actions using the shared API client (mock/real). */

  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [query, setQuery] = useState("");
  const [page] = useState(1); // placeholder
  const [pageSize] = useState(10); // placeholder

  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setListLoading(true);
    setListError(null);

    const res = await projectsApi.listProjects(client);
    if (!res.ok) {
      setListError(res);
      notifyApiError(toast, res, "Failed to load projects");
      setProjects([]);
      setListLoading(false);
      return;
    }

    const data = Array.isArray(res.data) ? res.data : [];
    setProjects(data);
    setListLoading(false);
  }, [client, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = (query || "").toString().trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((p) => {
      const name = (p?.name || "").toString().toLowerCase();
      const id = (p?.id || "").toString().toLowerCase();
      const status = (p?.status || "").toString().toLowerCase();
      return name.includes(q) || id.includes(q) || status.includes(q);
    });
  }, [projects, query]);

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

    setCreateOpen(false);
    setSaving(false);

    // Refetch to avoid backend assumptions (sorting, ids, etc).
    await refresh();
  }

  async function handleUpdate(payload) {
    if (!editProject?.id) return;

    setSaving(true);
    const res = await projectsApi.updateProject(client, editProject.id, payload);

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

    setEditProject(null);
    setSaving(false);

    await refresh();
  }

  async function handleDelete(project) {
    const id = project?.id;
    if (!id) return;

    const confirmed = window.confirm(
      `Delete project "${project?.name || id}"? This cannot be undone.`
    );
    if (!confirmed) return;

    // Optimistic UI: remove from list immediately, rollback on failure.
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== id));

    const res = await projectsApi.deleteProject(client, id);
    if (!res.ok) {
      setProjects(previous);
      notifyApiError(toast, res, "Failed to delete project");
      return;
    }

    toast.push({
      level: "success",
      title: "Project deleted",
      message: `Deleted "${project?.name || id}".`,
    });

    // Refetch to keep list consistent with server/mock.
    await refresh();
  }

  const columns = useMemo(
    () => [
      { key: "name", header: "Project" },
      { key: "status", header: "Status" },
      { key: "updatedAt", header: "Updated" },
      { key: "actions", header: "", align: "right" },
    ],
    []
  );

  const actions = (
    <div className="table-toolbar">
      <div className="table-toolbar__left">
        <div className="table-toolbar__title">All Projects</div>
        <div className="table-toolbar__subtitle">
          Manage projects used to group test cases, executions, and results.
        </div>
      </div>

      <div className="table-toolbar__right">
        <input
          className="table-toolbar__search"
          placeholder="Search (name, id, status)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search projects"
        />
        <button type="button" className="btn" onClick={() => setCreateOpen(true)}>
          New Project
        </button>
      </div>
    </div>
  );

  const footer = (
    <div className="table-footer">
      <div className="table-footer__left">
        <span className="muted" style={{ fontSize: 12 }}>
          Pagination placeholder • Page {page} • Page size {pageSize}
        </span>
      </div>
      <div className="table-footer__right">
        <button type="button" className="btn btn--secondary" disabled>
          Prev
        </button>
        <button type="button" className="btn btn--secondary" disabled>
          Next
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Projects</h1>
          <p className="muted">
            View and manage projects. Uses mock API automatically when no backend
            base URL is configured.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate("/projects/new")}
          title="Go to create page"
        >
          Create (page)
        </button>
      </div>

      <div className="grid">
        <section className="card">
          <Table
            aria-label="Projects table"
            columns={columns}
            rows={filtered}
            loading={listLoading}
            error={listError}
            emptyTitle={query ? "No matching projects" : "No projects yet"}
            emptyDescription={
              query
                ? "Try clearing your search."
                : "Create your first project to start organizing test cases."
            }
            actions={actions}
            footer={footer}
            renderRow={(p) => (
              <>
                <div className="table__cell" role="cell">
                  <div className="table__primary">
                    <Link className="table__link" to={`/projects/${p.id}`}>
                      {p.name || p.id}
                    </Link>
                    <div className="table__secondary">{p.id}</div>
                  </div>
                </div>

                <div className="table__cell" role="cell">
                  <span className={`pill pill--${(p.status || "Active").toLowerCase()}`}>
                    {p.status || "Active"}
                  </span>
                </div>

                <div className="table__cell" role="cell">
                  <span className="muted" style={{ fontSize: 12 }}>
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}
                  </span>
                </div>

                <div className="table__cell table__cell--right" role="cell">
                  <div className="table__row-actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setEditProject(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => handleDelete(p)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          />
        </section>
      </div>

      <Modal
        open={createOpen}
        title="Create Project"
        onClose={() => (saving ? null : setCreateOpen(false))}
        footer={null}
      >
        <ProjectForm
          submitLabel="Create"
          submitting={saving}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        open={!!editProject}
        title={`Edit Project${editProject?.name ? ` — ${editProject.name}` : ""}`}
        onClose={() => (saving ? null : setEditProject(null))}
        footer={null}
      >
        <ProjectForm
          initialValues={editProject || {}}
          submitLabel="Update"
          submitting={saving}
          onCancel={() => setEditProject(null)}
          onSubmit={handleUpdate}
        />
      </Modal>
    </>
  );
}
