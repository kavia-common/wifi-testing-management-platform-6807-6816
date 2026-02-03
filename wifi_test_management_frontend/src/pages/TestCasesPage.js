import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, Modal, Table, TextInput, Toast } from "../components/ui";
import {
  deriveUsageForNewTestCase,
  formatDateTime,
  normalizeParametersList,
  normalizeTagsFromString,
} from "./testCasesMockData";
import TestCaseUpsertModal from "./TestCaseUpsertModal";
import { isMockModeEnabled, projectsApi, testCasesApi, useApiRequest } from "../api";
import {
  getMockImportDebugInfo,
  isMockImportEnabled,
  subscribeToMockImportChanges,
} from "../utils/mockImportSettings";
import { parseTestPlanFile } from "../utils/testPlanParser";
import { fetchArrayBufferFromUrl } from "../utils/assetLoader";

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
  /** Test cases list screen: search + filter + create/edit modal (API-backed with mock fallback). */
  const navigate = useNavigate();

  const {
    data: projectsData,
    loading: projectsLoading,
    error: projectsError,
    setData: setProjects,
  } = useApiRequest(() => projectsApi.list(), [], { immediate: true, initialData: [] });

  const {
    data: testCasesData,
    loading: testCasesLoading,
    error: testCasesError,
    setData: setTestCases,
  } = useApiRequest(() => testCasesApi.list(), [], { immediate: true, initialData: [] });

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const testCases = Array.isArray(testCasesData) ? testCasesData : [];

  const loading = projectsLoading || testCasesLoading;
  const error = projectsError || testCasesError;

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);

  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [assetImportOpen, setAssetImportOpen] = useState(false);
  const [assetUrl, setAssetUrl] = useState("");
  const [assetLoading, setAssetLoading] = useState(false);

  // Reactive mock-import detection:
  // - reads on mount from localStorage (including legacy keys)
  // - listens for storage changes (cross-tab) and in-tab broadcast events
  // - also includes env fallback (REACT_APP_USE_MOCKS === 'true' => enabled)
  const [mockImportEnabled, setMockImportEnabledState] = useState(isMockImportEnabled());
  const [mockImportDebug, setMockImportDebug] = useState(getMockImportDebugInfo());

  useEffect(() => {
    function refresh() {
      setMockImportEnabledState(isMockImportEnabled());
      setMockImportDebug(getMockImportDebugInfo());
    }

    refresh();
    const unsubscribe = subscribeToMockImportChanges(refresh);

    // Also refresh on focus (common case: user toggles in another tab/app then returns).
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      unsubscribe?.();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  function pushToast({ variant, title, message, ttlMs = 4500 }) {
    const id = `t-${Math.floor(Math.random() * 1e9)}`;
    const toast = { id, variant: variant || "info", title: title || "Notice", message: message || "" };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttlMs);
  }

  /**
   * Unified gating:
   * - If mock-import flag is enabled => allow imports regardless of API/mock mode.
   *   (Requested: "Do not block enabling due to API mode when mock-import flag is true.")
   * - If mock-import flag is disabled => block and explain why.
   *
   * NOTE: Some APIs may still be mock-only behind the scenes; in that case, errors will be shown on attempt.
   */
  function getImportUnavailableReason() {
    if (mockImportEnabled) return "";

    // Disabled only when setting is OFF (or explicitly disabled via localStorage).
    // Provide the most actionable message.
    const envFallback = String(process.env.REACT_APP_USE_MOCKS ?? "").trim().toLowerCase() === "true";
    if (envFallback) {
      return "Mock imports appear disabled via local settings (localStorage) even though REACT_APP_USE_MOCKS=true. Re-enable “Use mock TestPlan imports” in Settings.";
    }

    return "Mock imports are disabled. Enable “Use mock TestPlan imports” in Settings.";
  }

  function openAssetImport() {
    const reason = getImportUnavailableReason();
    if (reason) {
      pushToast({ variant: "error", title: "Import unavailable", message: reason });
      return;
    }
    setAssetImportOpen(true);
  }

  function inferFileNameFromUrl(url) {
    const s = String(url || "");
    const cut = Math.min(
      s.indexOf("?") === -1 ? s.length : s.indexOf("?"),
      s.indexOf("#") === -1 ? s.length : s.indexOf("#")
    );
    const clean = s.slice(0, cut);
    const lastSlash = clean.lastIndexOf("/");
    return lastSlash === -1 ? clean : clean.slice(lastSlash + 1);
  }

  async function handleImportFromAssetUrl() {
    const reason = getImportUnavailableReason();
    if (reason) {
      pushToast({ variant: "error", title: "Import unavailable", message: reason });
      return;
    }

    const url = String(assetUrl || "").trim();
    if (!url) {
      pushToast({ variant: "error", title: "Missing URL", message: "Paste an asset URL to load (Excel .xlsx supported)." });
      return;
    }

    setAssetLoading(true);
    try {
      const { arrayBuffer, extensionHint, fileNameHint } = await fetchArrayBufferFromUrl(url);

      const nameHint = fileNameHint || inferFileNameFromUrl(url) || "TestPlan.xlsx";
      const ext = String(extensionHint || "").toLowerCase();

      if (ext !== "xlsx" && !String(nameHint).toLowerCase().endsWith(".xlsx")) {
        throw new Error("Unsupported asset type. Please provide an Excel .xlsx TestPlan URL.");
      }

      // Route through the existing parser by creating a File, so we reuse the exact pipeline.
      const file = new File([arrayBuffer], nameHint.endsWith(".xlsx") ? nameHint : `${nameHint}.xlsx`, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const { items, warnings, summary } = await parseTestPlanFile(file, {
        defaultProjectId: projects?.[0]?.id || "",
      });

      // Show a compact summary first (headers + skip counts), then any additional notes.
      if (summary) {
        pushToast({
          variant: summary.skippedRows > 0 ? "info" : "success",
          title: "Import summary",
          message: `Imported ${summary.importedRows}. Skipped ${summary.skippedRows} (blank ${summary.blankRows}). Missing headers: ${
            summary.missingHeaders?.length ? summary.missingHeaders.join(", ") : "none"
          }.`,
          ttlMs: 7000,
        });
      }

      if (warnings?.length) {
        for (const w of warnings) {
          pushToast({ variant: "info", title: "Import note", message: w, ttlMs: 6200 });
        }
      }

      const res = await testCasesApi.importTestPlan(items);

      pushToast({
        variant: "success",
        title: "TestPlan imported",
        message: `Added ${res.added}, updated ${res.updated}, skipped ${res.skipped}.`,
      });

      setAssetImportOpen(false);
      await refreshListAfterImport();
    } catch (e) {
      pushToast({
        variant: "error",
        title: "Import failed (Project Asset)",
        message:
          e?.message ||
          "Unable to import asset. Ensure it is a publicly accessible Excel .xlsx TestPlan URL (mock imports enabled).",
        ttlMs: 8000,
      });
    } finally {
      setAssetLoading(false);
    }
  }

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
              onClick={async () => {
                // eslint-disable-next-line no-alert
                const ok = window.confirm(`Delete "${tc.name}"?`);
                if (!ok) return;
                try {
                  await testCasesApi.delete(tc.id);
                  setTestCases((prev) => prev.filter((x) => x.id !== tc.id));
                } catch (e) {
                  // eslint-disable-next-line no-alert
                  window.alert(e?.message || "Failed to delete test case");
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [navigate, projects, setTestCases]
  );

  function openCreate() {
    setEditingId(null);
    setModalMode("create");
    setModalOpen(true);
  }

  async function handleSave(formValues) {
    // Normalize here as well to keep list consistent, even if modal normalized.
    const normalized = {
      ...formValues,
      tags: normalizeTagsFromString(formValues.tags),
      parameters: normalizeParametersList(formValues.parameters),
    };

    try {
      if (modalMode === "edit" && editingTestCase) {
        const updated = await testCasesApi.update(editingTestCase.id, normalized);
        setTestCases((prev) => prev.map((tc) => (tc.id === updated.id ? updated : tc)));
        setModalOpen(false);
        return;
      }

      // Create: ensure usage exists (mock helper gives nice non-empty details)
      const payload = {
        ...normalized,
        usage: normalized.usage || deriveUsageForNewTestCase(),
      };
      const created = await testCasesApi.create(payload);

      setTestCases((prev) => [created, ...prev]);

      // Best-effort: update project counts in UI cache if mocks are on (mock store already does it)
      if (isMockModeEnabled()) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== created.projectId) return p;
            const nowIso = new Date().toISOString();
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
      }

      setModalOpen(false);
      navigate(`/test-cases/${created.id}`);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e?.message || "Failed to save test case");
    }
  }

  async function refreshListAfterImport() {
    const latest = await testCasesApi.list();
    setTestCases(Array.isArray(latest) ? latest : []);
  }

  async function handleImportFileSelected(file) {
    if (!file) return;

    const reason = getImportUnavailableReason();
    if (reason) {
      pushToast({
        variant: "error",
        title: "Import unavailable",
        message: reason,
      });
      return;
    }

    setImporting(true);
    try {
      const { items, warnings, summary } = await parseTestPlanFile(file, {
        defaultProjectId: projects?.[0]?.id || "",
      });

      if (summary) {
        pushToast({
          variant: summary.skippedRows > 0 ? "info" : "success",
          title: "Import summary",
          message: `Imported ${summary.importedRows}. Skipped ${summary.skippedRows} (blank ${summary.blankRows}). Missing headers: ${
            summary.missingHeaders?.length ? summary.missingHeaders.join(", ") : "none"
          }.`,
          ttlMs: 7000,
        });
      }

      if (warnings?.length) {
        for (const w of warnings) {
          pushToast({ variant: "info", title: "Import note", message: w, ttlMs: 6200 });
        }
      }

      const res = await testCasesApi.importTestPlan(items);

      pushToast({
        variant: "success",
        title: "TestPlan imported",
        message: `Added ${res.added}, updated ${res.updated}, skipped ${res.skipped}.`,
      });

      await refreshListAfterImport();
    } catch (e) {
      const rawMsg =
        e?.message ||
        "Unable to import file. Ensure it contains required columns/values for Name and Project (supports Excel .xlsx).";

      // Make the toast more actionable: users typically need to fix headers.
      const looksLikeHeaderIssue =
        /missing headers|could not find any values for name|could not find any values for project|required columns/i.test(rawMsg);

      pushToast({
        variant: "error",
        title: looksLikeHeaderIssue ? "Import failed: header mismatch" : "Import failed (TestPlan)",
        message: looksLikeHeaderIssue
          ? `${rawMsg} Tip: Confirm the header row contains “Test Case Name” and “Project/Project Name” (or Chinese equivalents like 用例名称/项目).`
          : rawMsg,
        ttlMs: 10000,
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const importDisabledReason = getImportUnavailableReason();
  const importButtonsDisabled = loading || importing || assetLoading || Boolean(importDisabledReason);

  return (
    <div className="page">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <div className="pageCard">
        <header className="page__header">
          <div>
            <h1 className="page__title">Test Cases</h1>
            <p className="page__subtitle">
              Manage your test case library with project associations, searchable tags, and runtime parameters. Import
              TestPlans from CSV, Excel (.xlsx), or JSON. When mock imports are enabled, you can also import directly
              from a Project Assets document URL.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              style={{ display: "none" }}
              onChange={(e) => handleImportFileSelected(e.target.files?.[0] || null)}
            />
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={importButtonsDisabled}
              title={importDisabledReason || "Import a TestPlan file."}
            >
              {importing ? "Importing…" : "Import TestPlan"}
            </Button>

            <Button
              variant="secondary"
              onClick={openAssetImport}
              disabled={importButtonsDisabled}
              title={importDisabledReason || "Import a TestPlan from a Project Asset URL."}
            >
              Import from Project Assets
            </Button>

            <Button variant="primary" onClick={openCreate} disabled={loading}>
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
            <Badge variant={isMockModeEnabled() ? "primary" : "neutral"}>{isMockModeEnabled() ? "Mock mode" : "API mode"}</Badge>

            <Badge variant={mockImportEnabled ? "success" : "secondary"}>
              {mockImportEnabled ? "Mock imports on" : "Mock imports off"}
            </Badge>

            {!mockImportEnabled ? (
              <div style={{ fontSize: 13, color: "var(--color-error)", fontWeight: 900, lineHeight: 1.35 }}>
                Imports disabled: {importDisabledReason}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Imports enabled (listening for Settings/localStorage changes).
              </div>
            )}
          </div>

          {/* Debug-ish detail, but still user-friendly: helps verify which flag is being read */}
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(17, 24, 39, 0.62)", lineHeight: 1.45 }}>
            <span style={{ fontWeight: 900 }}>Mock-import flag source:</span>{" "}
            {mockImportDebug?.primaryRawValue == null ? "default/env" : `localStorage="${mockImportDebug.primaryRawValue}"`}{" "}
            <span style={{ fontWeight: 900, marginLeft: 10 }}>REACT_APP_USE_MOCKS:</span>{" "}
            {mockImportDebug?.envReactAppUseMocks || "(unset)"}
          </div>

          {error ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-error)", fontWeight: 800 }}>
              Error: {error.message}
            </div>
          ) : null}
        </section>

        <section aria-label="Test cases table">
          <Table
            ariaLabel="Test cases table"
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title={loading ? "Loading test cases…" : testCases.length === 0 ? "No test cases yet" : "No matches"}
                description={
                  loading
                    ? "Fetching test cases."
                    : testCases.length === 0
                      ? "Create your first test case to begin building a reusable library."
                      : "Try adjusting your search or filters."
                }
                action={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={openCreate} disabled={loading}>
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
          Tip: You can open a test case directly via URL (e.g., <span style={{ fontWeight: 900 }}>/test-cases/tc-1</span>
          ).
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

        <Modal
          open={assetImportOpen}
          title="Import from Project Assets"
          description="Paste a Project Assets → Documents URL to an Excel (.xlsx) TestPlan and import it."
          onClose={() => {
            if (assetLoading) return;
            setAssetImportOpen(false);
          }}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => setAssetImportOpen(false)} disabled={assetLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleImportFromAssetUrl} loading={assetLoading} disabled={assetLoading}>
                Load & Import
              </Button>
            </div>
          }
        >
          <TextInput
            label="Asset URL"
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
            placeholder="https://…/WiFi%20Function%20TestPlan.xlsx"
            ariaLabel="Project Asset URL"
            helperText={
              importDisabledReason
                ? `Import unavailable: ${importDisabledReason}`
                : "Tip: The URL must be accessible from your browser (CORS/public access)."
            }
            disabled={assetLoading}
            autoComplete="off"
            inputMode="url"
          />
          <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", marginTop: 10, lineHeight: 1.45 }}>
            Supported format: Excel <span style={{ fontWeight: 900 }}>.xlsx</span>. If the URL cannot be fetched due to
            CORS restrictions, download the file locally and use “Import TestPlan”.
          </div>
        </Modal>
      </div>
    </div>
  );
}
