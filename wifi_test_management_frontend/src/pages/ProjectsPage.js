import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, Table, TextInput } from "../components/ui";
import {
  badgeVariantForProjectStatus,
  formatDate,
  getMockProjectsSeed,
  normalizeProjectStatus,
} from "./projectsMockData";
import ProjectUpsertModal from "./ProjectUpsertModal";

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

function makeProjectId() {
  // Stable enough for mock UI; replace with backend IDs later.
  return `proj-${Math.floor(1000 + Math.random() * 9000)}`;
}

// PUBLIC_INTERFACE
export default function ProjectsPage() {
  /** Projects list screen: search + filter + create/edit modal (local mock state). */
  const navigate = useNavigate();

  const [projects, setProjects] = useState(() => getMockProjectsSeed());
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

  function handleSave(formValues) {
    if (modalMode === "edit" && editingProject) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== editingProject.id) return p;
          return {
            ...p,
            ...formValues,
            status: normalizeProjectStatus(formValues.status),
            tags: formValues.tags || [],
            updatedAt: new Date().toISOString(),
          };
        })
      );
      setModalOpen(false);
      return;
    }

    // Create
    const nowIso = new Date().toISOString();
    const newId = makeProjectId();
    setProjects((prev) => [
      {
        id: newId,
        ...formValues,
        status: normalizeProjectStatus(formValues.status),
        tags: formValues.tags || [],
        createdAt: nowIso,
        updatedAt: nowIso,
        counts: { testCases: 0, executions: 0, results: 0 },
      },
      ...prev,
    ]);
    setModalOpen(false);

    // Optional nice UX: go straight to details after creation.
    navigate(`/projects/${newId}`);
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
            <Badge variant="primary">Mock mode</Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
              Projects are stored in local page state for now. Later we’ll swap to API calls without changing the UI
              layout.
            </div>
          </div>
        </section>

        <section aria-label="Projects table">
          <Table
            ariaLabel="Projects table"
            columns={columns}
            rows={filteredProjects}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title={projects.length === 0 ? "No projects yet" : "No matches"}
                description={
                  projects.length === 0
                    ? "Create your first project to start organizing test cases and executions."
                    : "Try adjusting your search or filter."
                }
                action={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={openCreate}>
                      Create Project
                    </Button>
                    {projects.length > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setQuery("");
                          setStatusFilter("All");
                        }}
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
