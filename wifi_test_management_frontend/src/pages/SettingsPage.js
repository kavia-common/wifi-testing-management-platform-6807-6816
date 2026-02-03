import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "../components/ui";
import { isMockModeEnabled, setMockModeEnabled } from "../api";
import { isMockImportEnabled, setMockImportEnabled } from "../utils/mockImportSettings";
import { TESTPLAN_MAPPING_STORAGE_KEY } from "../utils/testPlanParser";

function ToggleRow({ title, description, value, onChange, rightHint }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        background: "rgba(255, 255, 255, 0.92)",
        boxShadow: "var(--shadow-sm)",
        padding: 14,
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>{title}</div>
        <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45, maxWidth: 680 }}>
          {description}
        </div>
        {rightHint ? (
          <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 800 }}>{rightHint}</div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Badge variant={value ? "success" : "neutral"}>{value ? "Enabled" : "Disabled"}</Badge>
        <Button variant={value ? "secondary" : "primary"} onClick={() => onChange(!value)}>
          {value ? "Disable" : "Enable"}
        </Button>
      </div>
    </div>
  );
}

function readMapping() {
  try {
    const raw = window?.localStorage?.getItem(TESTPLAN_MAPPING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      project: typeof parsed.project === "string" ? parsed.project : "",
    };
  } catch {
    return null;
  }
}

function clearMapping() {
  try {
    window?.localStorage?.removeItem(TESTPLAN_MAPPING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings route: environment toggles and developer preferences (localStorage-backed). */
  const [mockMode, setMockMode] = useState(isMockModeEnabled());
  const [mockImports, setMockImports] = useState(isMockImportEnabled());
  const [mapping, setMapping] = useState(() => readMapping());

  useEffect(() => {
    setMockMode(isMockModeEnabled());
    setMockImports(isMockImportEnabled());
    setMapping(readMapping());
  }, []);

  function handleToggleMockMode(next) {
    setMockModeEnabled(next);
    setMockMode(next);
  }

  function handleToggleMockImports(next) {
    setMockImportEnabled(next);
    setMockImports(next);
  }

  const mappingText = useMemo(() => {
    if (!mapping?.name && !mapping?.project) return "(none)";
    return `Name=${mapping?.name || "(unset)"}, Project=${mapping?.project || "(unset)"}`;
  }, [mapping]);

  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Settings</h1>
            <p className="page__subtitle">Configure environment, integrations, and platform preferences.</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <ToggleRow
            title="Use mock API store"
            description="When enabled, the app reads/writes data from a local persisted mock store (localStorage). This is useful during UI prototyping or when backend APIs are unavailable."
            value={mockMode}
            onChange={handleToggleMockMode}
            rightHint="This affects Projects, Test Cases, Executions, and Results APIs in this UI template."
          />

          <ToggleRow
            title="Use mock TestPlan imports"
            description="When enabled, importing a TestPlan file on the Test Cases page will persist parsed items into the store and they will appear in the Test Cases list."
            value={mockImports}
            onChange={handleToggleMockImports}
            rightHint="If disabled, TestPlan imports are blocked to prevent unintended local store changes."
          />

          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              background: "rgba(255, 255, 255, 0.92)",
              boxShadow: "var(--shadow-sm)",
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 900, color: "rgba(17, 24, 39, 0.92)" }}>TestPlan header mapping</div>
              <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45, maxWidth: 680 }}>
                If your Excel/CSV headers are unusual (multi-row headers, merged header cells, localized variants), you can
                map the Name/Project columns during import. The last choice is stored in localStorage.
              </div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.62)", fontWeight: 800 }}>
                Current mapping: {mappingText}
              </div>
              <div style={{ fontSize: 12, color: "rgba(17, 24, 39, 0.55)" }}>
                Storage key: <span style={{ fontWeight: 900 }}>{TESTPLAN_MAPPING_STORAGE_KEY}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  clearMapping();
                  setMapping(null);
                }}
              >
                Reset TestPlan header mapping
              </Button>
            </div>
          </div>

          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(30, 58, 138, 0.14)",
              background: "rgba(30, 58, 138, 0.06)",
              padding: 14,
              color: "rgba(17, 24, 39, 0.78)",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6, color: "rgba(17, 24, 39, 0.9)" }}>Import format tips</div>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                CSV/XLSX columns supported: <span style={{ fontWeight: 900 }}>name</span>,{" "}
                <span style={{ fontWeight: 900 }}>projectId</span> (or <span style={{ fontWeight: 900 }}>project</span>
                ), optional <span style={{ fontWeight: 900 }}>description</span>, <span style={{ fontWeight: 900 }}>tags</span>,{" "}
                <span style={{ fontWeight: 900 }}>parameters</span>.
              </div>
              <div>
                Dedupe key: <span style={{ fontWeight: 900 }}>projectId + name</span> (case-insensitive). Existing entries are
                never removed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
