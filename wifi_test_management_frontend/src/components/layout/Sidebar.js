import React, { useMemo } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projects" },
  { id: "testCases", label: "Test Cases" },
  { id: "executions", label: "Executions" },
  { id: "results", label: "Results" },
];

// PUBLIC_INTERFACE
export default function Sidebar({ collapsed = false, activeId = "dashboard" }) {
  const items = useMemo(() => NAV_ITEMS, []);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__section">
        <div className="sidebar__section-title">
          {collapsed ? "Nav" : "Modules"}
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar__nav-item ${
                  isActive ? "sidebar__nav-item--active" : ""
                }`}
                aria-current={isActive ? "page" : undefined}
                // Routing intentionally not implemented yet
                onClick={() => {}}
              >
                <span className="sidebar__dot" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar__footer">
        {!collapsed ? (
          <div className="sidebar__hint">
            <div className="sidebar__hint-title">Tip</div>
            <div className="sidebar__hint-text">
              Use the sidebar to switch modules once routing is enabled.
            </div>
          </div>
        ) : (
          <div className="sidebar__hint sidebar__hint--collapsed" title="Tip">
            i
          </div>
        )}
      </div>
    </aside>
  );
}
