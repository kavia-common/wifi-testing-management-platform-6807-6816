import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import TestCaseForm from "./TestCaseForm";
import {
  notifyApiError,
  projectsApi,
  testCasesApi,
  useApiClient,
  useToast,
} from "../../api";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search || ""), [search]);
}

// PUBLIC_INTERFACE
export default function TestCasesList() {
  /** Test cases list page with CRUD actions using the shared API client (mock/real). */

  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useQueryParams();

  const initialProjectId = params.get("projectId") || "";

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [testCases, setTestCases] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState(initialProjectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTestCase, setEditTestCase] = useState(null);
  const [saving, setSaving] = useState(false);

  const refreshProjects = useCallback(async () => {
    setProjectsLoading(true);
    const res = await projectsApi.listProjects(client);
    if (!res.ok) {
      // Projects are only used for labels/filter; keep list usable if it fails.
      notifyApiError(toast, res, "Failed to load projects");
      setProjects([]);
      setProjectsLoading(false);
      return;
    }
    setProjects(Array.isArray(res.data) ? res.data : []);
    setProjectsLoading(false);
  }, [client, toast]);

  const refreshTestCases = useCallback(
    async ({ projectId } = {}) => {
      setListLoading(true);
      setListError(null);

      const res = await testCasesApi.listTestCases(client, {
        projectId: projectId || undefined,
      });

      if (!res.ok) {
        setListError(res);
        notifyApiError(toast, res, "Failed to load test cases");
        setTestCases([]);
        setListLoading(false);
        return;
      }

      setTestCases(Array.isArray(res.data) ? res.data : []);
      setListLoading(false);
    },
    [client, toast]
  );

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    refreshTestCases({ projectId: projectFilter });
    // keep URL in sync for shareable filter
    const next = projectFilter ? `?projectId=${encodeURIComponent(projectFilter)}` : "";
    navigate(`/test-cases${next}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, refreshTestCases]);

  const projectById = useMemo(() => {
    const map = new Map();
    (projects || []).forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = (query || "").toString().trim().toLowerCase();
    if (!q) return testCases;

    return (testCases || []).filter((tc) => {
      const name = (tc?.name || "").toString().toLowerCase();
      const id = (tc?.id || "").toString().toLowerCase();
      const pid = (tc?.projectId || "").toString().toLowerCase();
      const tags = Array.isArray(tc?.tags) ? tc.tags.join(",").toLowerCase() : "";
      return (
        name.includes(q) ||
        id.includes(q) ||
        pid.includes(q) ||
        tags.includes(q)
      );
    });
  }, [testCases, query]);

  async function handleCreate(payload) {
    setSaving(true);
    const res = await testCasesApi.createTestCase(client, payload);

    if (!res.ok) {
      notifyApiError(toast, res, "Failed to create test case");
      setSaving(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Test case created",
      message: `Created "${res.data?.name || payload.name}".`,
    });

    setCreateOpen(false);
    setSaving(false);

    await refreshTestCases({ projectId: projectFilter });
  }

  async function handleUpdate(payload) {
    if (!editTestCase?.id) return;

    setSaving(true);
    const res = await testCasesApi.updateTestCase(client, editTestCase.id, payload);

    if (!res.ok) {
      notifyApiError(toast, res, "Failed to update test case");
      setSaving(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Test case updated",
      message: `Updated "${res.data?.name || payload.name}".`,
    });

    setEditTestCase(null);
    setSaving(false);

    await refreshTestCases({ projectId: projectFilter });
  }

  async function handleDelete(tc) {
    const id = tc?.id;
    if (!id) return;

    const confirmed = window.confirm(
      `Delete test case "${tc?.name || id}"? This cannot be undone.`
    );
    if (!confirmed) return;

    // Optimistic UI: remove from list immediately, rollback on failure.
    const previous = testCases;
    setTestCases((prev) => prev.filter((t) => t.id !== id));

    const res = await testCasesApi.deleteTestCase(client, id);
    if (!res.ok) {
      setTestCases(previous);
      notifyApiError(toast, res, "Failed to delete test case");
      return;
    }

    toast.push({
      level: "success",
      title: "Test case deleted",
      message: `Deleted "${tc?.name || id}".`,
    });

    await refreshTestCases({ projectId: projectFilter });
  }

  const columns = useMemo(
    () => [
      { key: "name", header: "Test Case" },
      { key: "projectId", header: "Project" },
      { key: "tags", header: "Tags" },
      { key: "actions", header: "", align: "right" },
    ],
    []
  );

  const actions = (
    <div className="table-toolbar">
      <div className="table-toolbar__left">
        <div className="table-toolbar__title">Test Cases</div>
        <div className="table-toolbar__subtitle">
          Define test cases and associate them with projects.
        </div>
      </div>

      <div className="table-toolbar__right">
        <select
          className="table-toolbar__search"
          style={{ minWidth: 220 }}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="Filter by project"
          disabled={projectsLoading}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || p.id}
            </option>
          ))}
        </select>

        <input
          className="table-toolbar__search"
          placeholder="Search (name, id, tags)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search test cases"
        />

        <button type="button" className="btn" onClick={() => setCreateOpen(true)}>
          New Test Case
        </button>
      </div>
    </div>
  );

  const emptyTitle = query
    ? "No matching test cases"
    : projectFilter
      ? "No test cases for this project"
      : "No test cases yet";

  const emptyDescription = query
    ? "Try clearing your search."
    : projectFilter
      ? "Create the first test case for this project."
      : "Create your first test case to start building a suite.";

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Test Cases</h1>
          <p className="muted">
            View and manage test cases. Works in mock mode when no backend base URL
            is configured.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              const qs = projectFilter
                ? `?projectId=${encodeURIComponent(projectFilter)}`
                : "";
              navigate(`/test-cases/new${qs}`);
            }}
            title="Go to create page"
          >
            Create (page)
          </button>

          {projectFilter ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate(`/projects/${projectFilter}`)}
              title="Go to selected project"
            >
              View Project
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <Table
            aria-label="Test cases table"
            columns={columns}
            rows={filtered}
            loading={listLoading}
            error={listError}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            actions={actions}
            renderRow={(tc) => {
              const p = tc?.projectId ? projectById.get(tc.projectId) : null;
              const tagList = Array.isArray(tc?.tags) ? tc.tags : [];
              return (
                <>
                  <div className="table__cell" role="cell">
                    <div className="table__primary">
                      <Link className="table__link" to={`/test-cases/${tc.id}`}>
                        {tc.name || tc.id}
                      </Link>
                      <div className="table__secondary">{tc.id}</div>
                    </div>
                  </div>

                  <div className="table__cell" role="cell">
                    {tc.projectId ? (
                      <Link className="table__link" to={`/projects/${tc.projectId}`}>
                        {p?.name || tc.projectId}
                      </Link>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>
                        —
                      </span>
                    )}
                  </div>

                  <div className="table__cell" role="cell">
                    {tagList.length ? (
                      <span className="muted" style={{ fontSize: 12 }}>
                        {tagList.join(", ")}
                      </span>
                    ) : (
                      <span className="muted" style={{ fontSize: 12 }}>
                        —
                      </span>
                    )}
                  </div>

                  <div className="table__cell table__cell--right" role="cell">
                    <div className="table__row-actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => navigate(`/test-cases/${tc.id}/edit`)}
                        title="Edit on page"
                      >
                        Edit (page)
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setEditTestCase(tc)}
                        title="Edit in modal"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => handleDelete(tc)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              );
            }}
          />
        </section>
      </div>

      <Modal
        open={createOpen}
        title="Create Test Case"
        onClose={() => (saving ? null : setCreateOpen(false))}
        footer={null}
      >
        <TestCaseForm
          projects={projects}
          lockedProjectId={projectFilter || null}
          submitLabel="Create"
          submitting={saving}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal
        open={!!editTestCase}
        title={`Edit Test Case${editTestCase?.name ? ` — ${editTestCase.name}` : ""}`}
        onClose={() => (saving ? null : setEditTestCase(null))}
        footer={null}
      >
        <TestCaseForm
          initialValues={editTestCase || {}}
          projects={projects}
          submitLabel="Update"
          submitting={saving}
          onCancel={() => setEditTestCase(null)}
          onSubmit={handleUpdate}
        />
      </Modal>
    </>
  );
}
