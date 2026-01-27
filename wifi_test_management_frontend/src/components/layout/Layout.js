import React, { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Notifications from "./Notifications";
import { getDefaultApiConfig } from "../../api";
import { useToast } from "../../api";

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

  // On first mount, show whether we're using mock or real backend.
  useEffect(() => {
    const cfg = getDefaultApiConfig();
    toast.push({
      level: "info",
      title: "API mode",
      message: cfg.useMock
        ? "Using mock API (no base URL configured or mock forced)."
        : "Using real backend API.",
      ttlMs: 3000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <Header
        onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
        isSidebarCollapsed={isSidebarCollapsed}
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
