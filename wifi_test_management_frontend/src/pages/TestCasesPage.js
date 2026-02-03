import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, Table, TextInput } from "../components/ui";
import { getMockProjectsSeed } from "./projectsMockData";
import {
  deriveUsageForNewTestCase,
  formatDateTime,
  getMockTestCasesSeed,
  makeTestCaseId,
  normalizeParametersList,
  normalizeTagsFromString,
} from "./testCasesMockData";
import TestCaseUpsertModal from "./TestCaseUpsertModal";

function getProjectName(projects, projectId) {
  return projects.find((p) => p.id === projectId)?.name || "Unknown project";
}

function matchesQuery(tc, query, projectName) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    tc.name,
    tc.description,
    tc.id,
    tc.projectId,
    projectName,
    (tc.tags || []).join(" "),
    (tc.parameters || []).map((p) => `${p.key}:${p.value}`).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function matchesProject(tc, projectFilter) {
  if (!projectFilter || projectFilter === "All") return true;
  return String(tc.projectId) === String(projectFilter);
}

function matchesTag(tc, tagFilter) {
  if (!tagFilter || tagFilter === "All") return true;
  const tags = (tc.tags || []).map((t) => String(t).toLowerCase());
  return tags.includes(String(tagFilter).toLowerCase());
}

function collectTags(testCases) {
  const set = new Set();
  for (const tc of testCases || []) {
    for (const t of tc.tags || []) set.add(t);
  }
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
}

function SelectField({ id, label, value, onChange, options, helperText }) {
  return (
    <div className="uiField">
      <label className="uiField__label" htmlFor={id}>
        {label}
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
          id={id}
          value={value}
          onChange={onChange}
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
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {helperText ? <div className="uiField__help">{helperText}</div> : null}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function TestCasesPage() {
  /** Test cases list screen: search + filter + create/edit modal (local mock state) + details navigation. */
  const navigate = useNavigate();

  const [projects, setProjects] = useState(() => getMockProjectsSeed());
  const [testCases, setTestCases] = useState(() => getMockTestCasesSeed());

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);

  const editingTestCase = useMemo(() => testCases.find((tc) => tc.id === editingId) || null, [editingId, testCases]);

  const tagOptions = useMemo(() => ["All", ...collectTags(testCases)], [testCases]);

  const projectOptions = useMemo(() => {
    const opts = [{ value: "All", label: "All projects" }];
    for (const p of projects) opts.push({ value: p.id, label: p.name });
    return opts;
  }, [projects]);

  const filtered = useMemo(() => {
    return testCases
      .filter((tc) => {
        const projectName = getProjectName(projects, tc.projectId);
        return matchesQuery(tc, query, projectName);
      })
      .filter((tc) => matchesProject(tc, projectFilter))
      .filter((tc) => matchesTag(tc, tagFilter))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }, [projects, projectFilter, query, tagFilter, testCases]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Test Case",
        render: (tc) => {
          const projectName = getProjectName(projects, tc.projectId);
          return (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{tc.name}</span>
                <Badge variant="primary">{projectName}</Badge>
                <Badge variant="neutral">{tc.id}</Badge>
              </div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)" }}>
                {(tc.description || "No description").slice(0, 120)}
                {(tc.description || "").length > 120 ? "…" : ""}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge variant="neutral">{(tc.parameters || []).length} params</Badge>
                <Badge variant="neutral">{tc.usage?.executions ?? 0} exec</Badge>
                <Badge variant="neutral">{tc.usage?.results ?? 0} results</Badge>
              </div>
            </div>
          );
        },
      },
      {
        key: "tags",
        header: "Tags",
        width: 260,
        render: (tc) => (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(tc.tags || []).slice(0, 4).map((t) => (
              <Badge key={t} variant="neutral">
                {t}
              </Badge>
            ))}
            {(tc.tags || []).length > 4 ? <Badge variant="secondary">+{(tc.tags || []).length - 4}</Badge> : null}
            {(tc.tags || []).length === 0 ? (
              <span style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.62)", fontWeight: 700 }}>No tags</span>
            ) : null}
          </div>
        ),
      },
      {
        key: "updatedAt",
        header: "Updated",
        width: 180,
        render: (tc) => (
          <span style={{ fontWeight: 800, color: "rgba(17, 24, 39, 0.75)" }}>{formatDateTime(tc.updatedAt)}</span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: 280,
        render: (tc) => (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/test-cases/${tc.id}`)}>
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingId(tc.id);
                setModalMode("edit");
                setModalOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="error"
              size="sm"
              onClick={() => {
                // eslint-disable-next-line no-alert
                const ok = window.confirm(`Delete "${tc.name}"? This only affects local mock state.`);
                if (!ok) return;
                setTestCases((prev) => prev.filter((x) => x.id !== tc.id));
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [navigate, projects]
  );

  function openCreate() {
    setEditingId(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function handleSave(formValues) {
    // Normalize here as well to keep list consistent, even if modal normalized.
    const normalized = {
      ...formValues,
      tags: normalizeTagsFromString(formValues.tags),
      parameters: normalizeParametersList(formValues.parameters),
    };

    if (modalMode === "edit" && editingTestCase) {
      setTestCases((prev) =>
        prev.map((tc) => {
          if (tc.id !== editingTestCase.id) return tc;
          return {
            ...tc,
            ...normalized,
            updatedAt: new Date().toISOString(),
          };
        })
      );
      setModalOpen(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const newId = makeTestCaseId();
    const usage = deriveUsageForNewTestCase();

    setTestCases((prev) => [
      {
        id: newId,
        ...normalized,
        createdAt: nowIso,
        updatedAt: nowIso,
        usage,
      },
      ...prev,
    ]);

    // Update project counts in-page (mock association)
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== normalized.projectId) return p;
        return {
          ...p,
          updatedAt: nowIso,
          counts: {
            ...(p.counts || {}),
            testCases: (p.counts?.testCases ?? 0) + 1,
          },
        };
      })
    );

    setModalOpen(false);
    navigate(`/test-cases/${newId}`);
  }

  return (
    <div className="page">
      <div className="pageCard">
        <header className="page__header">
          <div>
            <h1 className="page__title">Test Cases</h1>
            <p className="page__subtitle">
              Manage your test case library with project associations, searchable tags, and runtime parameters.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="primary" onClick={openCreate}>
              Create Test Case
            </Button>
          </div>
        </header>

        <section
          aria-label="Test cases controls"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <TextInput
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, project, tag, parameter…"
              ariaLabel="Search test cases"
            />

            <SelectField
              id="testcases-project-filter"
              label="Project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={projectOptions}
              helperText={`Showing ${filtered.length} of ${testCases.length} test cases.`}
            />

            <SelectField
              id="testcases-tag-filter"
              label="Tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              options={tagOptions.map((t) => ({ value: t, label: t === "All" ? "All tags" : t }))}
              helperText="Filter by a tag used on test cases."
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <Badge variant="primary">Mock mode</Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
              Test cases are stored in local page state. Routing and UI structure will stay the same when wired to APIs.
            </div>
          </div>
        </section>

        <section aria-label="Test cases table">
          <Table
            ariaLabel="Test cases table"
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title={testCases.length === 0 ? "No test cases yet" : "No matches"}
                description={
                  testCases.length === 0
                    ? "Create your first test case to begin building a reusable library."
                    : "Try adjusting your search or filters."
                }
                action={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={openCreate}>
                      Create Test Case
                    </Button>
                    {testCases.length > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setQuery("");
                          setProjectFilter("All");
                          setTagFilter("All");
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
          Tip: You can open a test case directly via URL (e.g.,{" "}
          <span style={{ fontWeight: 900 }}>/test-cases/tc-1</span>).
        </div>

        <TestCaseUpsertModal
          open={modalOpen}
          mode={modalMode}
          testCase={modalMode === "edit" ? editingTestCase : null}
          projects={projects}
          existingTestCases={testCases}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
