import React, { useEffect, useMemo, useState } from "react";

function normalizeTags(input) {
  if (Array.isArray(input)) {
    return input
      .map((t) => (t ?? "").toString().trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  const raw = (input ?? "").toString();
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function validate(values, { requireProject = true } = {}) {
  const errors = {};

  const name = (values.name || "").toString().trim();
  if (!name) errors.name = "Test case name is required.";
  else if (name.length < 3) errors.name = "Name must be at least 3 characters.";
  else if (name.length > 120) errors.name = "Max length is 120 characters.";

  const projectId = (values.projectId || "").toString().trim();
  if (requireProject && !projectId) {
    errors.projectId = "Please select a project.";
  }

  const tags = normalizeTags(values.tags);
  const tooLong = tags.find((t) => t.length > 32);
  if (tooLong) errors.tags = "Each tag must be 32 characters or less.";

  return errors;
}

// PUBLIC_INTERFACE
export default function TestCaseForm({
  initialValues,
  projects = [],
  lockedProjectId = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save",
}) {
  /** Reusable create/edit form for test cases with client-side validation. */

  const defaults = useMemo(
    () => ({
      name: "",
      projectId: lockedProjectId || "",
      tags: [],
      ...(initialValues || {}),
    }),
    [initialValues, lockedProjectId]
  );

  const [values, setValues] = useState(defaults);
  const [touched, setTouched] = useState({});

  // If project context changes, ensure form stays in sync.
  useEffect(() => {
    if (!lockedProjectId) return;
    setValues((prev) => ({ ...prev, projectId: lockedProjectId }));
  }, [lockedProjectId]);

  const requireProject = !lockedProjectId;
  const errors = useMemo(
    () => validate(values, { requireProject }),
    [values, requireProject]
  );
  const isValid = Object.keys(errors).length === 0;

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const touchAll = { name: true, projectId: true, tags: true };
    setTouched(touchAll);

    const currentErrors = validate(values, { requireProject });
    if (Object.keys(currentErrors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      projectId: (lockedProjectId || values.projectId || "").toString().trim(),
      tags: normalizeTags(values.tags),
    };

    await onSubmit?.(payload);
  }

  const showError = (field) => touched[field] && errors[field];

  const projectOptions = Array.isArray(projects) ? projects : [];
  const hasProjects = projectOptions.length > 0;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__grid">
        <label className="form__field form__field--full">
          <div className="form__label">Name</div>
          <input
            className={`form__input ${showError("name") ? "form__input--error" : ""}`}
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            placeholder="e.g., Throughput (UDP) - 5GHz"
            autoFocus
            disabled={submitting}
          />
          {showError("name") ? (
            <div className="form__error">{errors.name}</div>
          ) : (
            <div className="form__hint">
              A short, human-friendly test name (max 120 characters).
            </div>
          )}
        </label>

        <label className="form__field">
          <div className="form__label">Project</div>

          {lockedProjectId ? (
            <>
              <input className="form__input" value={lockedProjectId} disabled />
              <div className="form__hint">
                Project is fixed by context for this create flow.
              </div>
            </>
          ) : (
            <>
              <select
                className={`form__input ${
                  showError("projectId") ? "form__input--error" : ""
                }`}
                value={values.projectId}
                onChange={(e) => setField("projectId", e.target.value)}
                onBlur={() => markTouched("projectId")}
                disabled={submitting}
              >
                <option value="" disabled>
                  {hasProjects ? "Select a project…" : "No projects available"}
                </option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id} ({p.id})
                  </option>
                ))}
              </select>

              {showError("projectId") ? (
                <div className="form__error">{errors.projectId}</div>
              ) : (
                <div className="form__hint">
                  Test cases are grouped under a project.
                </div>
              )}
            </>
          )}
        </label>

        <label className="form__field">
          <div className="form__label">Tags</div>
          <input
            className={`form__input ${showError("tags") ? "form__input--error" : ""}`}
            value={
              Array.isArray(values.tags) ? values.tags.join(", ") : values.tags || ""
            }
            onChange={(e) => setField("tags", e.target.value)}
            onBlur={() => markTouched("tags")}
            placeholder="e.g., throughput, udp, 5ghz"
            disabled={submitting}
          />
          {showError("tags") ? (
            <div className="form__error">{errors.tags}</div>
          ) : (
            <div className="form__hint">
              Optional. Comma-separated (max 20 tags; 32 chars each).
            </div>
          )}
        </label>
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>

        <button type="submit" className="btn" disabled={submitting || !isValid}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
