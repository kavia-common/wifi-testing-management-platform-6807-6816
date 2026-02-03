import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, EmptyState } from "../components/ui";
import { formatDateTime, getMockTestCasesSeed } from "./testCasesMockData";
import { getMockProjectsSeed } from "./projectsMockData";
import TestCaseUpsertModal from "./TestCaseUpsertModal";

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

function ParametersTable({ parameters }) {
  const list = Array.isArray(parameters) ? parameters : [];
  if (list.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", fontWeight: 700 }}>
        No parameters defined.
      </div>
    );
  }

  return (
    <div style={{ overflow: "auto", width: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 520 }} aria-label="Parameters table">
        <thead>
          <tr>
            <th
              scope="col"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(17, 24, 39, 0.65)",
                borderBottom: "1px solid var(--color-border)",
                background: "rgba(30, 58, 138, 0.06)",
              }}
            >
              Key
            </th>
            <th
              scope="col"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(17, 24, 39, 0.65)",
                borderBottom: "1px solid var(--color-border)",
                background: "rgba(30, 58, 138, 0.06)",
              }}
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, idx) => (
            <tr key={`${p.key}-${idx}`}>
              <td style={{ padding: "10px 12px", fontSize: 13, borderBottom: "1px solid rgba(17, 24, 39, 0.06)", fontWeight: 900, color: "rgba(17, 24, 39, 0.82)" }}>
                {p.key}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 13, borderBottom: "1px solid rgba(17, 24, 39, 0.06)", fontWeight: 700, color: "rgba(17, 24, 39, 0.78)" }}>
                {p.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function TestCaseDetailsPage() {
  /** Test Case details screen: metadata + parameters + usage counts (mock data only). */
  const { testCaseId } = useParams();
  const navigate = useNavigate();

  // Local mock data for this page (kept self-contained as requested).
  const [projects, setProjects] = useState(() => getMockProjectsSeed());
  const [testCases, setTestCases] = useState(() => getMockTestCasesSeed());
  const [editOpen, setEditOpen] = useState(false);

  const testCase = useMemo(() => testCases.find((tc) => tc.id === testCaseId) || null, [testCases, testCaseId]);
  const project = useMemo(() => projects.find((p) => p.id === testCase?.projectId) || null, [projects, testCase]);

  function handleSave(formValues) {
    if (!testCase) return;
    setTestCases((prev) =>
      prev.map((tc) => {
        if (tc.id !== testCase.id) return tc;
        return {
          ...tc,
          ...formValues,
          tags: formValues.tags || [],
          parameters: formValues.parameters || [],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setEditOpen(false);
  }

  function handleDelete() {
    if (!testCase) return;
    // Simple confirm; consistent with lightweight template.
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Delete "${testCase.name}"? This only affects local mock state.`);
    if (!ok) return;

    setTestCases((prev) => prev.filter((tc) => tc.id !== testCase.id));
    navigate("/test-cases");
  }

  if (!testCase) {
    return (
      <div className="page">
        <div className="pageCard">
          <header className="page__header">
            <div>
              <h1 className="page__title">Test Case Details</h1>
              <p className="page__subtitle">Test case not found in local mock data.</p>
            </div>
          </header>

          <EmptyState
            title="Test case not found"
            description={
              <span>
                The test case ID <span style={{ fontWeight: 900 }}>{testCaseId}</span> is not available in this mock dataset.
                Go back to the list to pick an existing test case.
              </span>
            }
            action={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => navigate("/test-cases")}>
                  Back to Test Cases
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
                {testCase.name}
              </h1>
              <Badge variant="neutral">{testCase.id}</Badge>
              {project ? (
                <Badge variant="primary">Project: {project.name}</Badge>
              ) : (
                <Badge variant="secondary">Project: Unknown</Badge>
              )}
            </div>
            <p className="page__subtitle">{testCase.description || "No description provided."}</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => navigate("/test-cases")}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="error" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </header>

        <section
          aria-label="Test case overview"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, alignItems: "start" }}>
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
                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Project</div>
                <div style={{ fontWeight: 800 }}>
                  {project ? (
                    <Link to={`/projects/${project.id}`} style={{ fontWeight: 900 }}>
                      {project.name}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                </div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Created</div>
                <div style={{ fontWeight: 800 }}>{formatDateTime(testCase.createdAt)}</div>

                <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.65)" }}>Updated</div>
                <div style={{ fontWeight: 800 }}>{formatDateTime(testCase.updatedAt)}</div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge variant="primary">Tags</Badge>
                {(testCase.tags || []).length > 0 ? (
                  (testCase.tags || []).map((t) => (
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
                <StatCard label="Executions" value={testCase.usage?.executions ?? 0} hint="How often this case is used." />
                <StatCard label="Results" value={testCase.usage?.results ?? 0} hint="Associated result records." />
              </div>
              <StatCard
                label="Parameters"
                value={(testCase.parameters || []).length}
                hint="Key/value pairs used at runtime."
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
                <div style={{ fontWeight: 900, marginBottom: 4, color: "rgba(17, 24, 39, 0.88)" }}>Note</div>
                Usage counts are mock values. Later they will come from execution/result relationships in the backend.
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Parameters"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Parameters
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Runtime inputs attached to this test case.
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit parameters
            </Button>
          </div>

          <div style={{ marginTop: 12 }}>
            <ParametersTable parameters={testCase.parameters} />
          </div>
        </section>

        <TestCaseUpsertModal
          open={editOpen}
          mode="edit"
          testCase={testCase}
          projects={projects}
          existingTestCases={testCases}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
