import React from "react";
import "./Toast.css";

function variantToDotClass(variant) {
  if (variant === "success") return "uiToast__dot--success";
  if (variant === "error") return "uiToast__dot--error";
  return "uiToast__dot--info";
}

// PUBLIC_INTERFACE
export default function Toast({ toasts, onDismiss }) {
  /** Renders ephemeral toast notifications. */
  const list = Array.isArray(toasts) ? toasts : [];
  if (list.length === 0) return null;

  return (
    <div className="uiToastWrap" aria-live="polite" aria-relevant="additions removals">
      {list.map((t) => (
        <div key={t.id} className="uiToast" role="status">
          <div className="uiToast__row">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div className={`uiToast__dot ${variantToDotClass(t.variant)}`} aria-hidden="true" />
              <div style={{ display: "grid", gap: 4 }}>
                <div className="uiToast__title">{t.title}</div>
                {t.message ? <div className="uiToast__text">{t.message}</div> : null}
              </div>
            </div>
            <button className="uiToast__close" onClick={() => onDismiss?.(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
