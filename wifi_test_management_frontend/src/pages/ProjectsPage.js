import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, Table, TextInput } from "../components/ui";
import {
  badgeVariantForProjectStatus,
  formatDate,
  normalizeProjectStatus,
} from "./projectsMockData";
import ProjectUpsertModal from "./ProjectUpsertModal";
import { isMockModeEnabled, projectsApi, useApiRequest } from "../api";

function matchesQuery(project, query) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    project.name,
    project.owner,
    project.environment,
    project.status,
    (project.tags || []).join(" "),
    project.description,
    project.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function matchesStatus(project, statusFilter) {
  if (!statusFilter || statusFilter === "All") return true;
  return normalizeProjectStatus(project.status) === statusFilter;
}

// PUBLIC_INTERFACE
export default function ProjectsPage() {
  /** Projects list screen: search + filter + create/edit modal (API-backed with mock fallback). */
  const navigate = useNavigate();

  const {
    data: projectsData,
    loading,
    error,
    setData: setProjectsData,
  } = useApiRequest(() => projectsApi.list(), [], { immediate: true, initialData: [] });

  const projects = Array.isArray(projectsData) ? projectsData : [];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingProjectId, setEditingProjectId] = useState(null);

  const editingProject = useMemo(
    () => projects.find((p) => p.id === editingProjectId) || null,
    [editingProjectId, projects]
  );

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => matchesQuery(p, query))
      .filter((p) => matchesStatus(p, statusFilter))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }, [projects, query, statusFilter]);

  const statusOptions = useMemo(() => ["All", "Active", "Paused", "Archived"], []);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Project",
        render: (p) => (
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{p.name}</span>
              <Badge variant={badgeVariantForProjectStatus(p.status)}>{p.status}</Badge>
            </div>
            <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
              Owner: <span style={{ fontWeight: 800 }}>{p.owner}</span> • Env:{" "}
              <span style={{ fontWeight: 800 }}>{p.environment}</span>
            </div>
          </div>
        ),
      },
      {
        key: "counts",
        header: "Counts",
        width: 220,
        render: (p) => (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge variant="neutral">{p.counts?.testCases ?? 0} test cases</Badge>
            <Badge variant="neutral">{p.counts?.executions ?? 0} exec</Badge>
            <Badge variant="neutral">{p.counts?.results ?? 0} results</Badge>
          </div>
        ),
      },
      {
        key: "updated",
        header: "Updated",
        width: 140,
        render: (p) => (
          <span style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.75)" }}>
            {formatDate(p.updatedAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: 240,
        render: (p) => (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate(`/projects/${p.id}`);
              }}
            >
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingProjectId(p.id);
                setModalMode("edit");
                setModalOpen(true);
              }}
            >
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  function openCreate() {
    setEditingProjectId(null);
    setModalMode("create");
    setModalOpen(true);
  }

  async function handleSave(formValues) {
    const payload = {
      ...formValues,
      status: normalizeProjectStatus(formValues.status),
      tags: formValues.tags || [],
    };

    try {
      if (modalMode === "edit" && editingProject) {
        const updated = await projectsApi.update(editingProject.id, payload);
        setProjectsData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setModalOpen(false);
        return;
      }

      const created = await projectsApi.create(payload);
      setProjectsData((prev) => [created, ...prev]);
      setModalOpen(false);
      navigate(`/projects/${created.id}`);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e?.message || "Failed to save project");
    }
  }

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <h1 className="page__title">Projects</h1>
            <p className="page__subtitle">
              Create and manage WiFi testing projects. Filter by status, search by name/owner, and open details to view
              related counts.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="primary" onClick={openCreate}>
              Create Project
            </Button>
          </div>
        </header>

        <section
          aria-label="Projects controls"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, alignItems: "end" }}>
            <TextInput
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, owner, environment, tag..."
              ariaLabel="Search projects"
            />

            <div className="uiField">
              <label className="uiField__label" htmlFor="projects-status-filter">
                Status
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
                  id="projects-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  {statusOptions.map((s) => (
                    <option value={s} key={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="uiField__help">
                Showing <span style={{ fontWeight: 900 }}>{filteredProjects.length}</span> of{" "}
                <span style={{ fontWeight: 900 }}>{projects.length}</span> projects.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <Badge variant={isMockModeEnabled() ? "primary" : "neutral"}>
              {isMockModeEnabled() ? "Mock mode" : "API mode"}
            </Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
              {isMockModeEnabled()
                ? "Projects are served from the local mock API store."
                : "Projects are fetched from the backend API (base URL from env)."}
            </div>
          </div>

          {error ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-error)", fontWeight: 800 }}>
              Error: {error.message}
            </div>
          ) : null}
        </section>

        <section aria-label="Projects table">
          <Table
            ariaLabel="Projects table"
            columns={columns}
            rows={filteredProjects}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title={loading ? "Loading projects…" : projects.length === 0 ? "No projects yet" : "No matches"}
                description={
                  loading
                    ? "Fetching projects."
                    : projects.length === 0
                      ? "Create your first project to start organizing test cases and executions."
                      : "Try adjusting your search or filter."
                }
                action={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={openCreate} disabled={loading}>
                      Create Project
                    </Button>
                    {projects.length > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setQuery("");
                          setStatusFilter("All");
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
          Tip: You can also open a project via URL (e.g.,{" "}
          <Link to="/projects/proj-1" style={{ fontWeight: 900 }}>
            /projects/proj-1
          </Link>
          ).
        </div>

        <ProjectUpsertModal
          open={modalOpen}
          mode={modalMode}
          project={modalMode === "edit" ? editingProject : null}
          existingProjects={projects}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

