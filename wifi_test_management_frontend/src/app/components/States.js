import React from "react";
import PropTypes from "prop-types";
import { Button } from "./Button";

// PUBLIC_INTERFACE
export function ErrorBanner({ title, message, onRetry }) {
  /** Displays an error state with optional retry action. */
  return (
    <div
      role="alert"
      className="card"
      style={{
        padding: 14,
        borderColor: "rgba(220,38,38,0.35)",
        background: "rgba(220,38,38,0.06)"
      }}
    >
      <div style={{ fontWeight: 900, color: "var(--color-error)" }}>{title}</div>
      {message ? <div style={{ marginTop: 6, color: "var(--color-text)" }}>{message}</div> : null}
      {onRetry ? (
        <div style={{ marginTop: 10 }}>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

ErrorBanner.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func
};

ErrorBanner.defaultProps = {
  title: "Something went wrong",
  message: "",
  onRetry: null
};

// PUBLIC_INTERFACE
export function EmptyState({ title, message, action }) {
  /** Displays an empty state message with optional action. */
  return (
    <div className="card" style={{ padding: 18, textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
      {message ? <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>{message}</div> : null}
      {action ? <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>{action}</div> : null}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  action: PropTypes.node
};

EmptyState.defaultProps = {
  message: "",
  action: null
};
