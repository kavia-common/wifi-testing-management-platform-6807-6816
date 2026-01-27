import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard", end: true },
  { id: "projects", label: "Projects", to: "/projects" },
  { id: "testCases", label: "Test Cases", to: "/test-cases" },
  { id: "executions", label: "Executions", to: "/executions" },
  { id: "results", label: "Results", to: "/results" },
];

// PUBLIC_INTERFACE
export default function Sidebar({ collapsed = false }) {
  /** Sidebar module navigation; active state is derived from the current route. */
  const items = useMemo(() => NAV_ITEMS, []);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__section">
        <div className="sidebar__section-title">
          {collapsed ? "Nav" : "Modules"}
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? "sidebar__nav-item--active" : ""}`
              }
              aria-label={item.label}
            >
              <span className="sidebar__dot" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar__footer">
        {!collapsed ? (
          <div className="sidebar__hint">
            <div className="sidebar__hint-title">Tip</div>
            <div className="sidebar__hint-text">
              Use the sidebar to switch modules.
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
