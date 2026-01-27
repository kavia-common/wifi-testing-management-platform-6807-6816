import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  width = 640,
}) {
  /** Simple modal dialog with an overlay. */

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            Close
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
