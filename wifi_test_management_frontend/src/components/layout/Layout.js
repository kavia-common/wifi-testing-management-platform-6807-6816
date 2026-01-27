import React, { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Notifications from "./Notifications";
import { useApi, useToast } from "../../api";

/**
 * Classic app shell layout:
 * - fixed header
 * - fixed sidebar
 * - scrollable main content
 * - top-right notifications overlay
 */
// PUBLIC_INTERFACE
export default function Layout({ children }) {
  /** Application shell layout that wraps routed content. */
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toast = useToast();
  const { config } = useApi();

  // On first mount, show whether we're using mock or real backend.
  useEffect(() => {
    toast.push({
      level: "info",
      title: "API mode",
      message:
        config?.modeLabel === "mock"
          ? "Using mock API (in-memory)."
          : `Using real backend API (${config?.baseUrl || "no base URL"}).`,
      ttlMs: 3000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <Header
        onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
        isSidebarCollapsed={isSidebarCollapsed}
        apiModeLabel={config?.modeLabel || (config?.useMock ? "mock" : "real")}
        apiBaseUrl={config?.baseUrl}
      />

      <div className="app-shell__body">
        <Sidebar collapsed={isSidebarCollapsed} />

        <main className="app-shell__main" role="main">
          <div className="page">
            <div className="page__content">{children}</div>
          </div>
        </main>
      </div>

      <Notifications items={toast.items} />
    </div>
  );
}
