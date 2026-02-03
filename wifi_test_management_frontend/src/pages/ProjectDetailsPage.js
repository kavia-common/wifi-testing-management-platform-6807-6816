import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, EmptyState } from "../components/ui";
import {
  badgeVariantForProjectStatus,
  formatDate,
  getMockProjectsSeed,
  normalizeProjectStatus,
} from "./projectsMockData";
import ProjectUpsertModal from "./ProjectUpsertModal";

function StatCard({ label, value, hint }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "rgba(255, 255, 255, 0.85)",
        padding: 14,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(17, 24, 39, 0.55)",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, color: "var(--color-primary)" }}>{value}</div>
      {hint ? (
        <div style={{ marginTop: 6, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>{hint}</div>
      ) : null}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function ProjectDetailsPage() {
  /** Project details screen: overview + related counts (mock data only). */
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Local mock data for this page (kept self-contained as requested).
  const [projects, setProjects] = useState(() => getMockProjectsSeed());
  const [editOpen, setEditOpen] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === projectId) || null, [projects, projectId]);

  function handleSave(formValues) {
    if (!project) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== project.id) return p;
        return {
          ...p,
          ...formValues,
          status: normalizeProjectStatus(formValues.status),
          tags: formValues.tags || [],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setEditOpen(false);
  }

  if (!project) {
    return (
      <div className="page">
        <div className="pageCard">
          <header className="page__header">
            <div>
              <h1 className="page__title">Project Details</h1>
              <p className="page__subtitle">Project not found in local mock data.</p>
            </div>
          </header>

          <EmptyState
            title="Project not found"
            description={
              <span>
                The project ID <span style={{ fontWeight: 900 }}>{projectId}</span> is not available in this mock dataset.
                Go back to the list to pick an existing project.
              </span>
            }
            action={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => navigate("/projects")}>
                  Back to Projects
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h1 className="page__title" style={{ marginRight: 6 }}>
                {project.name}
              </h1>
              <Badge variant={badgeVariantForProjectStatus(project.status)}>{project.status}</Badge>
              <Badge variant="neutral">{project.id}</Badge>
            </div>

            <p className="page__subtitle">{project.description}</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => navigate("/projects")}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
        </header>

        <section
          aria-label="Project overview"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 10,
                  fontSize: 13,
                  color: "rgba(17, 24, 39, 0.78)",
                }}
              >
                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Owner</div>
                <div style={{ fontWeight: 800 }}>{project.owner}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Environment</div>
                <div style={{ fontWeight: 800 }}>{project.environment}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Created</div>
                <div style={{ fontWeight: 800 }}>{formatDate(project.createdAt)}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Updated</div>
                <div style={{ fontWeight: 800 }}>{formatDate(project.updatedAt)}</div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge variant="primary">Tags</Badge>
                {(project.tags || []).length > 0 ? (
                  (project.tags || []).map((t) => (
                    <Badge variant="neutral" key={t}>
                      {t}
                    </Badge>
                  ))
                ) : (
                  <span style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.65)", fontWeight: 700 }}>No tags</span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <StatCard label="Test cases" value={project.counts?.testCases ?? 0} hint="Associated cases in this suite." />
                <StatCard label="Executions" value={project.counts?.executions ?? 0} hint="Recent runs under this project." />
              </div>
              <StatCard
                label="Results"
                value={project.counts?.results ?? 0}
                hint="Aggregated results count (mock)."
              />

              <div
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(30, 58, 138, 0.14)",
                  background: "rgba(30, 58, 138, 0.06)",
                  padding: 12,
                  fontSize: 13,
                  color: "rgba(17, 24, 39, 0.78)",
                  lineHeight: 1.45,
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 4, color: "rgba(17, 24, 39, 0.88)" }}>Next</div>
                This details view will later link to filtered Test Cases, Executions, and Results lists.
                For now it shows the overview and counts using local mock data.
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Related navigation"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Related areas
              </div>
              <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", marginTop: 4 }}>
                Jump to other modules (links are generic until module-level filtering is implemented).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Link to="/test-cases" style={{ textDecoration: "none" }}>
                <Button variant="ghost">Test Cases</Button>
              </Link>
              <Link to="/executions" style={{ textDecoration: "none" }}>
                <Button variant="ghost">Executions</Button>
              </Link>
              <Link to="/results" style={{ textDecoration: "none" }}>
                <Button variant="ghost">Results</Button>
              </Link>
            </div>
          </div>
        </section>

        <ProjectUpsertModal
          open={editOpen}
          mode="edit"
          project={project}
          existingProjects={projects}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
