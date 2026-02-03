import React, { useEffect, useRef } from "react";
import "./Modal.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getFocusable(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

// PUBLIC_INTERFACE
export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  size = "md",
  closeLabel = "Close dialog",
  className,
}) {
  /**
   * Accessible modal dialog.
   *
   * Behavior:
   *  - ESC closes (if onClose is provided)
   *  - Clicking backdrop closes
   *  - Focus moves to first focusable element in modal; returns focus on close
   *
   * Example usage:
   *  // <Modal open={open} title="New Project" onClose={()=>setOpen(false)} footer={<Button>Save</Button>}>...</Modal>
   */
  const panelRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastActiveElementRef.current = document.activeElement;

    // Wait for render then focus inside
    const t = setTimeout(() => {
      const focusables = getFocusable(panelRef.current);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else if (panelRef.current) {
        panelRef.current.focus();
      }
    }, 0);

    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }

      // Basic focus trap for Tab key
      if (e.key === "Tab") {
        const focusables = getFocusable(panelRef.current);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;

    // Restore focus on close
    const el = lastActiveElementRef.current;
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="uiModalOverlay" role="presentation" onMouseDown={() => onClose?.()}>
      <div
        className={cx("uiModal", `uiModal--${size}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        onMouseDown={(e) => e.stopPropagation()}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="uiModal__header">
          <div className="uiModal__titleBlock">
            {title ? <div className="uiModal__title">{title}</div> : null}
            {description ? (
              <div className="uiModal__description">{description}</div>
            ) : null}
          </div>
          <button
            type="button"
            className="uiModal__close"
            onClick={() => onClose?.()}
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>

        <div className="uiModal__body">{children}</div>

        {footer ? <div className="uiModal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
