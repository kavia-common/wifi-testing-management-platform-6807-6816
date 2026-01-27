import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Minimal toast/notification store.
 * It feeds the existing <Notifications /> component so the layout can remain unchanged.
 */

const ToastContext = createContext(null);

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provides toast APIs and renders children. */
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = toast.id || `t_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    const next = {
      id,
      level: toast.level || "info",
      title: toast.title || "Notice",
      message: toast.message || "",
    };

    setItems((prev) => [next, ...prev].slice(0, 5));

    // Auto-dismiss after a short delay (keep conservative).
    const ttl = typeof toast.ttlMs === "number" ? toast.ttlMs : 4500;
    window.setTimeout(() => remove(id), ttl);

    return id;
  }, [remove]);

  const api = useMemo(() => ({ items, push, remove }), [items, push, remove]);

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to access toast store; must be used under <ToastProvider/>. */
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback: avoid crashing if provider isn't wired yet.
    return { items: [], push: () => null, remove: () => {} };
  }
  return ctx;
}
