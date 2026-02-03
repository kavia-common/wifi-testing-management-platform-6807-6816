import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, TextInput } from "../components/ui";
import { normalizeProjectStatus } from "./projectsMockData";

function validateProject(values, existingProjects, editingId) {
  const errors = {};

  const name = String(values.name || "").trim();
  const owner = String(values.owner || "").trim();
  const environment = String(values.environment || "").trim();

  if (!name) errors.name = "Project name is required.";
  if (name.length > 60) errors.name = "Keep the name under 60 characters.";

  // Enforce unique name within mock list (case-insensitive), excluding the edited item.
  const nameLower = name.toLowerCase();
  const collision = (existingProjects || []).find(
    (p) => p.id !== editingId && String(p.name || "").toLowerCase() === nameLower
  );
  if (collision) errors.name = "A project with this name already exists.";

  if (!owner) errors.owner = "Owner is required.";
  if (owner.length > 40) errors.owner = "Keep the owner under 40 characters.";

  if (!environment) errors.environment = "Environment is required.";
  if (environment.length > 80) errors.environment = "Keep the environment under 80 characters.";

  const description = String(values.description || "").trim();
  if (description.length > 240) errors.description = "Keep the description under 240 characters.";

  const tags = String(values.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length > 8) errors.tags = "Use 8 tags or fewer.";

  const status = normalizeProjectStatus(values.status);

  return { errors, normalized: { ...values, name, owner, environment, description, tags, status } };
}

function makeDefaultForm(project) {
  return {
    name: project?.name || "",
    owner: project?.owner || "",
    environment: project?.environment || "",
    status: project?.status || "Active",
    tags: (project?.tags || []).join(", "),
    description: project?.description || "",
  };
}

// PUBLIC_INTERFACE
export default function ProjectUpsertModal({
  open,
  mode, // "create" | "edit"
  project,
  existingProjects,
  onClose,
  onSave,
}) {
  /**
   * Modal used for creating or editing a Project.
   *
   * @param {object} props
   * @param {boolean} props.open - Whether the modal is visible
   * @param {"create"|"edit"} props.mode - Determines title and save behavior
   * @param {object|null} props.project - Existing project for edit mode
   * @param {Array} props.existingProjects - Used for name uniqueness validation
   * @param {Function} props.onClose - Close handler
   * @param {Function} props.onSave - Called with normalized form values when valid
   */
  const editingId = project?.id;
  const isEdit = mode === "edit";

  const [values, setValues] = useState(() => makeDefaultForm(project));
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    // When (re)opening for different project, reset.
    if (!open) return;
    setValues(makeDefaultForm(project));
    setErrors({});
    setSubmitAttempted(false);
  }, [open, project]);

  const title = isEdit ? "Edit Project" : "Create Project";
  const description = isEdit
    ? "Update project metadata. Changes apply to future executions and organization."
    : "Create a project to group test cases, executions, and results under one suite.";

  const statusOptions = useMemo(() => ["Active", "Paused", "Archived"], []);

  function setField(key, nextValue) {
    setValues((v) => ({ ...v, [key]: nextValue }));
    if (submitAttempted) {
      // Live re-validate after first submit attempt (reduces noisy validation before user interacts).
      const { errors: nextErrors } = validateProject(
        { ...values, [key]: nextValue },
        existingProjects,
        editingId
      );
      setErrors(nextErrors);
    }
  }

  function onSubmit() {
    setSubmitAttempted(true);
    const { errors: nextErrors, normalized } = validateProject(values, existingProjects, editingId);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSave?.(normalized);
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={() => onClose?.()}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSubmit}>
        {isEdit ? "Save changes" : "Create project"}
      </Button>
    </>
  );

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer} size="md">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <TextInput
            label="Project name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g., Office WiFi Regression"
            required
            errorText={errors.name}
          />

          <TextInput
            label="Owner"
            value={values.owner}
            onChange={(e) => setField("owner", e.target.value)}
            placeholder="e.g., QA Team"
            required
            errorText={errors.owner}
          />
        </div>

        <TextInput
          label="Environment"
          value={values.environment}
          onChange={(e) => setField("environment", e.target.value)}
          placeholder="e.g., HQ Floor 3 (AP-LAB-03)"
          required
          errorText={errors.environment}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="uiField">
            <label className="uiField__label" htmlFor="project-status">
              Status <span aria-hidden="true">*</span>
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
                id="project-status"
                value={values.status}
                onChange={(e) => setField("status", e.target.value)}
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
              Active projects appear by default. Paused disables new execution scheduling. Archived is read-only.
            </div>
          </div>

          <TextInput
            label="Tags"
            value={values.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder="comma-separated (e.g., regression, nightly)"
            helperText="Use commas to separate tags."
            errorText={errors.tags}
          />
        </div>

        <TextInput
          label="Description"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Short description for this project..."
          helperText="Max 240 characters."
          errorText={errors.description}
        />

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
