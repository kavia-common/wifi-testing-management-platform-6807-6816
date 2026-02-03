import React, { useMemo, useState } from "react";
import { Badge, Button, Modal, TextInput } from "../components/ui";
import { parseLocalDateTimeToIso } from "./executionsMockData";

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

function normalizeParamsFromTextarea(text) {
  // Accept "key=value" per line; ignore blanks; preserve ordering.
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    out.push({ key, value });
  }
  return out.slice(0, 24);
}

function paramsToTextarea(params) {
  const list = Array.isArray(params) ? params : [];
  return list.map((p) => `${p.key}=${p.value}`).join("\n");
}

// PUBLIC_INTERFACE
export default function ExecutionScheduleModal({ open, onClose, onSubmit, projects, testCases, initialValues }) {
  /**
   * Schedule/start execution modal.
   *
   * Props:
   *  - open: boolean
   *  - onClose: () => void
   *  - onSubmit: ({ mode: "schedule"|"start", projectId, testCaseId, scheduledAt?, parameters }) => void
   *  - projects/testCases: arrays for selects
   *  - initialValues: optional { projectId, testCaseId, parameters }
   */
  const projectOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select a project…" }];
    for (const p of projects || []) opts.push({ value: p.id, label: p.name });
    return opts;
  }, [projects]);

  const testCaseOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select a test case…" }];
    for (const tc of testCases || []) opts.push({ value: tc.id, label: tc.name });
    return opts;
  }, [testCases]);

  const [projectId, setProjectId] = useState(initialValues?.projectId || "");
  const [testCaseId, setTestCaseId] = useState(initialValues?.testCaseId || "");
  const [scheduleLocal, setScheduleLocal] = useState("");
  const [paramsText, setParamsText] = useState(paramsToTextarea(initialValues?.parameters || []));

  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => {
    const e = {};
    if (!projectId) e.projectId = "Please select a project.";
    if (!testCaseId) e.testCaseId = "Please select a test case.";
    return e;
  }, [projectId, testCaseId]);

  function submit(mode) {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    const parameters = normalizeParamsFromTextarea(paramsText);
    const scheduledAt = mode === "schedule" ? parseLocalDateTimeToIso(scheduleLocal) : null;

    if (mode === "schedule" && !scheduledAt) {
      // Keep this light; reuse TextInput error for schedule field.
      return;
    }

    onSubmit?.({
      mode,
      projectId,
      testCaseId,
      scheduledAt,
      parameters,
    });

    // Reset only after successful submit (caller updates state then closes)
  }

  const footer = (
    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Button
          variant="secondary"
          onClick={() => {
            submit("schedule");
          }}
        >
          Schedule
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            submit("start");
          }}
        >
          Start now
        </Button>
      </div>
    </div>
  );

  const scheduleError =
    submitted && scheduleLocal && !parseLocalDateTimeToIso(scheduleLocal) ? "Invalid date/time." : submitted && !scheduleLocal ? "Required to schedule." : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule / Start Execution"
      description="Pick a project & test case, override parameters if needed, then schedule for later or start immediately."
      footer={footer}
      size="lg"
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(30, 58, 138, 0.14)",
            background: "rgba(30, 58, 138, 0.06)",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Badge variant="primary">Mock mode</Badge>
            <div style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.78)", fontWeight: 700 }}>
              This form updates local state only. Later it will call the backend scheduler.
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
          <SelectField
            id="exec-project"
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projectOptions}
            helperText={submitted && errors.projectId ? errors.projectId : "Choose the project this execution belongs to."}
          />
          <SelectField
            id="exec-testcase"
            label="Test Case"
            value={testCaseId}
            onChange={(e) => setTestCaseId(e.target.value)}
            options={testCaseOptions}
            helperText={submitted && errors.testCaseId ? errors.testCaseId : "Select the test case to run."}
          />
        </div>

        <TextInput
          label="Schedule time (optional for Start now)"
          type="datetime-local"
          value={scheduleLocal}
          onChange={(e) => setScheduleLocal(e.target.value)}
          helperText="For Schedule, pick a time; Start now ignores this."
          errorText={submitted && scheduleError ? scheduleError : ""}
          ariaLabel="Schedule time"
        />

        <div className="uiField">
          <label className="uiField__label" htmlFor="exec-params">
            Parameters (key=value, one per line)
          </label>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "rgba(255, 255, 255, 0.9)",
              padding: 10,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <textarea
              id="exec-params"
              value={paramsText}
              onChange={(e) => setParamsText(e.target.value)}
              rows={8}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                resize: "vertical",
                background: "transparent",
                fontSize: 13,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                color: "rgba(17, 24, 39, 0.82)",
              }}
              aria-label="Execution parameters"
            />
          </div>
          <div className="uiField__help">Tip: leave blank to use the test case defaults (in real backend mode).</div>
        </div>
      </div>
    </Modal>
  );
}
