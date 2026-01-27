import React, { useMemo, useState } from "react";

function validate(values) {
  const errors = {};

  const name = (values.name || "").toString().trim();
  if (!name) errors.name = "Project name is required.";
  else if (name.length < 2) errors.name = "Name must be at least 2 characters.";

  const status = (values.status || "").toString().trim();
  if (status && !["Active", "Paused", "Archived"].includes(status)) {
    errors.status = "Status must be one of: Active, Paused, Archived.";
  }

  const description = (values.description || "").toString();
  if (description.length > 500) errors.description = "Max length is 500 chars.";

  return errors;
}

// PUBLIC_INTERFACE
export default function ProjectForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save",
}) {
  /** Reusable create/edit form for projects with client-side validation. */

  const defaults = useMemo(
    () => ({
      name: "",
      description: "",
      status: "Active",
      ...(initialValues || {}),
    }),
    [initialValues]
  );

  const [values, setValues] = useState(defaults);
  const [touched, setTouched] = useState({});
  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, description: true, status: true });

    const currentErrors = validate(values);
    if (Object.keys(currentErrors).length > 0) return;

    // Shape payload without backend assumptions.
    const payload = {
      name: values.name.trim(),
      description: values.description?.toString().trim() || "",
      status: values.status || "Active",
    };

    await onSubmit?.(payload);
  }

  const showError = (field) => touched[field] && errors[field];

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__grid">
        <label className="form__field">
          <div className="form__label">Name</div>
          <input
            className={`form__input ${showError("name") ? "form__input--error" : ""}`}
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            placeholder="e.g., Office AP Regression"
            autoFocus
            disabled={submitting}
          />
          {showError("name") ? (
            <div className="form__error">{errors.name}</div>
          ) : (
            <div className="form__hint">A short, human-friendly project name.</div>
          )}
        </label>

        <label className="form__field">
          <div className="form__label">Status</div>
          <select
            className="form__input"
            value={values.status}
            onChange={(e) => setField("status", e.target.value)}
            onBlur={() => markTouched("status")}
            disabled={submitting}
          >
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Archived">Archived</option>
          </select>
          {showError("status") ? (
            <div className="form__error">{errors.status}</div>
          ) : (
            <div className="form__hint">Used for filtering and visibility.</div>
          )}
        </label>

        <label className="form__field form__field--full">
          <div className="form__label">Description</div>
          <textarea
            className={`form__textarea ${
              showError("description") ? "form__input--error" : ""
            }`}
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => markTouched("description")}
            placeholder="What is this project used for?"
            rows={5}
            disabled={submitting}
          />
          {showError("description") ? (
            <div className="form__error">{errors.description}</div>
          ) : (
            <div className="form__hint">
              Optional. Keep it brief (max 500 characters).
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
