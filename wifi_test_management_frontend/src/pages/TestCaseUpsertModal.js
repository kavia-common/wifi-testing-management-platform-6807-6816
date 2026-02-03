import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Modal, TextInput } from "../components/ui";
import { normalizeParametersList, normalizeTagsFromString } from "./testCasesMockData";

function validateTestCase(values, existingTestCases, editingId) {
  const errors = {};

  const name = String(values.name || "").trim();
  const description = String(values.description || "").trim();
  const projectId = String(values.projectId || "").trim();
  const tags = normalizeTagsFromString(values.tags);
  const parameters = normalizeParametersList(values.parameters);

  if (!name) errors.name = "Test case name is required.";
  if (name.length > 80) errors.name = "Keep the name under 80 characters.";

  // Enforce unique name within same project (case-insensitive), excluding the edited item.
  if (projectId) {
    const collision = (existingTestCases || []).find((tc) => {
      if (tc.id === editingId) return false;
      return (
        String(tc.projectId || "") === projectId &&
        String(tc.name || "").trim().toLowerCase() === name.toLowerCase()
      );
    });
    if (collision) errors.name = "A test case with this name already exists in the selected project.";
  }

  if (description.length > 360) errors.description = "Keep the description under 360 characters.";
  if (!projectId) errors.projectId = "Project association is required.";

  // Light validation for parameters: key required if value present.
  const hasBadParam = parameters.some((p) => !p.key && p.value);
  if (hasBadParam) errors.parameters = "Parameter key is required when a value is provided.";

  if (tags.length > 12) errors.tags = "Use 12 tags or fewer.";
  if (parameters.length > 24) errors.parameters = "Use 24 parameters or fewer.";

  return {
    errors,
    normalized: {
      name,
      description,
      projectId,
      tags,
      parameters,
    },
  };
}

function makeDefaultForm(testCase) {
  return {
    name: testCase?.name || "",
    description: testCase?.description || "",
    projectId: testCase?.projectId || "",
    tags: (testCase?.tags || []).join(", "),
    // Keep a couple of blank rows for easier entry
    parameters:
      (testCase?.parameters || []).length > 0
        ? (testCase?.parameters || []).map((p) => ({ key: p.key, value: p.value }))
        : [
            { key: "", value: "" },
            { key: "", value: "" },
          ],
  };
}

function SelectField({ id, label, value, onChange, options, errorText, helperText }) {
  return (
    <div className="uiField">
      <label className="uiField__label" htmlFor={id}>
        {label} <span aria-hidden="true">*</span>
      </label>

      <div
        style={{
          borderRadius: 12,
          border: errorText ? "1px solid rgba(220, 38, 38, 0.28)" : "1px solid var(--color-border)",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px 12px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <select
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={errorText ? "true" : "false"}
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
          <option value="" disabled>
            Select a project…
          </option>
          {options.map((o) => (
            <option value={o.value} key={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {errorText ? (
        <div className="uiField__error" role="alert">
          {errorText}
        </div>
      ) : helperText ? (
        <div className="uiField__help">{helperText}</div>
      ) : null}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function TestCaseUpsertModal({
  open,
  mode, // "create" | "edit"
  testCase,
  projects,
  existingTestCases,
  onClose,
  onSave,
}) {
  /**
   * Modal used for creating or editing a Test Case.
   *
   * @param {object} props
   * @param {boolean} props.open - Whether the modal is visible
   * @param {"create"|"edit"} props.mode - Determines title and save behavior
   * @param {object|null} props.testCase - Existing test case for edit mode
   * @param {Array} props.projects - Used to select association
   * @param {Array} props.existingTestCases - Used for uniqueness validation
   * @param {Function} props.onClose - Close handler
   * @param {Function} props.onSave - Called with normalized form values when valid
   */
  const editingId = testCase?.id;
  const isEdit = mode === "edit";

  const [values, setValues] = useState(() => makeDefaultForm(testCase));
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(makeDefaultForm(testCase));
    setErrors({});
    setSubmitAttempted(false);
  }, [open, testCase]);

  const projectOptions = useMemo(
    () =>
      (projects || []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [projects]
  );

  const normalizedTags = useMemo(() => normalizeTagsFromString(values.tags), [values.tags]);

  function setField(key, nextValue) {
    setValues((v) => ({ ...v, [key]: nextValue }));
    if (submitAttempted) {
      const { errors: nextErrors } = validateTestCase(
        { ...values, [key]: nextValue },
        existingTestCases,
        editingId
      );
      setErrors(nextErrors);
    }
  }

  function setParamRow(idx, patch) {
    const next = (values.parameters || []).map((p, i) => (i === idx ? { ...p, ...patch } : p));
    setField("parameters", next);
  }

  function addParamRow() {
    const next = [...(values.parameters || []), { key: "", value: "" }];
    setField("parameters", next);
  }

  function removeParamRow(idx) {
    const next = (values.parameters || []).filter((_, i) => i !== idx);
    setField("parameters", next.length > 0 ? next : [{ key: "", value: "" }]);
  }

  function onSubmit() {
    setSubmitAttempted(true);
    const { errors: nextErrors, normalized } = validateTestCase(values, existingTestCases, editingId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave?.(normalized);
  }

  const title = isEdit ? "Edit Test Case" : "Create Test Case";
  const description = isEdit
    ? "Update test case metadata, project association, parameters, and tags."
    : "Create a reusable test case with parameters and tags. Associate it to a project for organization.";

  const footer = (
    <>
      <Button variant="ghost" onClick={() => onClose?.()}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSubmit}>
        {isEdit ? "Save changes" : "Create test case"}
      </Button>
    </>
  );

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer} size="lg">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
          <TextInput
            label="Name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g., 5GHz Throughput (iperf3)"
            required
            errorText={errors.name}
          />

          <SelectField
            id="testcase-project"
            label="Project"
            value={values.projectId}
            onChange={(e) => setField("projectId", e.target.value)}
            options={projectOptions}
            errorText={errors.projectId}
            helperText="Test cases are organized and filtered by project."
          />
        </div>

        <TextInput
          label="Description"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Short description for this test case…"
          helperText="Max 360 characters."
          errorText={errors.description}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12, alignItems: "start" }}>
          <TextInput
            label="Tags"
            value={values.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder="comma-separated (e.g., roaming, 802.11r, voice)"
            helperText="Comma-separated; shown as badges."
            errorText={errors.tags}
          />

          <div
            aria-label="Tags preview"
            style={{
              borderRadius: 14,
              border: "1px solid var(--color-border)",
              background: "rgba(255, 255, 255, 0.85)",
              padding: 12,
              boxShadow: "var(--shadow-sm)",
              minHeight: 76,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(17, 24, 39, 0.55)" }}>
              Preview
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
              {normalizedTags.length > 0 ? (
                normalizedTags.map((t) => (
                  <Badge key={t} variant="neutral">
                    {t}
                  </Badge>
                ))
              ) : (
                <span style={{ fontSize: 13, color: "rgba(17, 24, 39, 0.65)", fontWeight: 700 }}>No tags</span>
              )}
            </div>
          </div>
        </div>

        <section
          aria-label="Parameters"
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.9)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", color: "rgba(17, 24, 39, 0.92)" }}>
                Parameters
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "rgba(17, 24, 39, 0.72)", lineHeight: 1.45 }}>
                Provide key/value parameters used when executing this test case.
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={addParamRow}>
              Add parameter
            </Button>
          </div>

          {errors.parameters ? (
            <div
              style={{
                marginTop: 10,
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(220, 38, 38, 0.22)",
                background: "rgba(220, 38, 38, 0.06)",
                padding: 12,
                color: "rgba(127, 29, 29, 0.95)",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.45,
              }}
              role="alert"
            >
              {errors.parameters}
            </div>
          ) : null}

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {(values.parameters || []).map((row, idx) => (
              <div
                key={`param-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                <TextInput
                  label={idx === 0 ? "Key" : undefined}
                  ariaLabel={idx === 0 ? undefined : `Parameter ${idx + 1} key`}
                  value={row.key}
                  onChange={(e) => setParamRow(idx, { key: e.target.value })}
                  placeholder="e.g., ssid"
                />
                <TextInput
                  label={idx === 0 ? "Value" : undefined}
                  ariaLabel={idx === 0 ? undefined : `Parameter ${idx + 1} value`}
                  value={row.value}
                  onChange={(e) => setParamRow(idx, { value: e.target.value })}
                  placeholder="e.g., Office-WiFi"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  ariaLabel={`Remove parameter ${idx + 1}`}
                  onClick={() => removeParamRow(idx)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="uiField__help" style={{ marginTop: 10 }}>
            Tip: Leave blank rows empty; they will not be saved. Keys are required if a value is provided.
          </div>
        </section>

        {Object.keys(errors).length > 0 ? (
          <div
            style={{
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(220, 38, 38, 0.22)",
              background: "rgba(220, 38, 38, 0.06)",
              padding: 12,
              color: "rgba(127, 29, 29, 0.95)",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.45,
            }}
            role="alert"
            aria-label="Validation summary"
          >
            Please fix the highlighted fields and try again.
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
