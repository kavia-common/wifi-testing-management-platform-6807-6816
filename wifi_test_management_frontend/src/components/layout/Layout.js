import React, { useMemo, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Notifications from "./Notifications";

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

  // Placeholder notifications (no backend integration yet)
  const notifications = useMemo(
    () => [
      {
        id: "n1",
        level: "info",
        title: "Welcome",
        message: "Ocean Professional theme loaded.",
      },
    ],
    []
  );

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

      <Notifications items={notifications} />
    </div>
  );
}
