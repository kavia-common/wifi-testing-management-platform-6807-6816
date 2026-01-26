import React from "react";
import PropTypes from "prop-types";

const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 };
const helpStyle = { fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 };

function baseControlStyle() {
  return {
    width: "100%",
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    padding: "10px 10px",
    fontSize: 14,
    outline: "none",
    background: "white"
  };
}

// PUBLIC_INTERFACE
export function Input({ label, helpText, ...props }) {
  /** Text input with label and helper text. */
  return (
    <label style={{ display: "block" }}>
      {label ? <div style={labelStyle}>{label}</div> : null}
      <input
        {...props}
        style={baseControlStyle()}
        onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--focus-ring)")}
        onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      />
      {helpText ? <div style={helpStyle}>{helpText}</div> : null}
    </label>
  );
}

// PUBLIC_INTERFACE
export function Select({ label, helpText, children, ...props }) {
  /** Select input with label and helper text. */
  return (
    <label style={{ display: "block" }}>
      {label ? <div style={labelStyle}>{label}</div> : null}
      <select
        {...props}
        style={baseControlStyle()}
        onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--focus-ring)")}
        onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        {children}
      </select>
      {helpText ? <div style={helpStyle}>{helpText}</div> : null}
    </label>
  );
}

// PUBLIC_INTERFACE
export function TextArea({ label, helpText, ...props }) {
  /** TextArea with label and helper text. */
  return (
    <label style={{ display: "block" }}>
      {label ? <div style={labelStyle}>{label}</div> : null}
      <textarea
        {...props}
        style={{ ...baseControlStyle(), minHeight: 96, resize: "vertical" }}
        onFocus={(e) => (e.currentTarget.style.boxShadow = "var(--focus-ring)")}
        onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
      />
      {helpText ? <div style={helpStyle}>{helpText}</div> : null}
    </label>
  );
}

// PUBLIC_INTERFACE
export function Checkbox({ label, ...props }) {
  /** Checkbox with label. */
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

Input.propTypes = { label: PropTypes.string, helpText: PropTypes.string };
Select.propTypes = { label: PropTypes.string, helpText: PropTypes.string, children: PropTypes.node };
TextArea.propTypes = { label: PropTypes.string, helpText: PropTypes.string };
Checkbox.propTypes = { label: PropTypes.string };

Input.defaultProps = { label: "", helpText: "" };
Select.defaultProps = { label: "", helpText: "" };
TextArea.defaultProps = { label: "", helpText: "" };
Checkbox.defaultProps = { label: "" };
