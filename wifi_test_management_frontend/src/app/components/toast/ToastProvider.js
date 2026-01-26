import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

const ToastContext = createContext(null);

function toneColors(tone) {
  if (tone === "success") return { bar: "var(--color-success)", bg: "white" };
  if (tone === "error") return { bar: "var(--color-error)", bg: "white" };
  if (tone === "warning") return { bar: "var(--color-secondary)", bg: "white" };
  return { bar: "var(--color-primary)", bg: "white" };
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provides toast notifications shown at top-right of the app. */
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((xs) => xs.filter((t) => t.id !== id)), []);

  const push = useCallback((toast) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const ttlMs = toast.ttlMs ?? 3500;

    setToasts((xs) => [{ ...toast, id }, ...xs].slice(0, 5));
    window.setTimeout(() => remove(id), ttlMs);
  }, [remove]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: 14,
          right: 14,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: 360,
          maxWidth: "calc(100vw - 28px)"
        }}
      >
        {toasts.map((t) => {
          const c = toneColors(t.tone);
          return (
            <div
              key={t.id}
              role="status"
              style={{
                background: c.bg,
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                boxShadow: "var(--shadow-md)",
                overflow: "hidden"
              }}
            >
              <div style={{ height: 4, background: c.bar }} />
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{t.title}</div>
                {t.message ? <div style={{ marginTop: 4, fontSize: 13, color: "var(--color-text-muted)" }}>{t.message}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node
};

ToastProvider.defaultProps = {
  children: null
};

// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to enqueue a toast notification. */
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>.");
  }
  return ctx;
}
