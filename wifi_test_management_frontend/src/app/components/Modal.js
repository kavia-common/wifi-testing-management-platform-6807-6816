import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Button } from "./Button";

// PUBLIC_INTERFACE
export function Modal({ title, open, onClose, children, footer }) {
  /** Accessible modal dialog with basic focus/escape handling. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        // close if clicking outside content
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 50
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "min(680px, 100%)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--gradient-accent)",
            borderBottom: "1px solid var(--color-border)"
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <Button variant="subtle" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </div>

        <div style={{ padding: 18 }}>{children}</div>

        <div
          style={{
            padding: 18,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node
};

Modal.defaultProps = {
  open: false,
  children: null,
  footer: null
};
