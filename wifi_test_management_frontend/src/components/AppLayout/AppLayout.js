import React from "react";
import { NavLink } from "react-router-dom";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/test-cases", label: "Test Cases" },
  { to: "/executions", label: "Executions" },
  { to: "/results", label: "Results" },
  { to: "/settings", label: "Settings" },
];

// PUBLIC_INTERFACE
export default function AppLayout({ children }) {
  /**
   * Global application layout providing a fixed header, a sidebar for navigation,
   * a main content area, and a toast/notification region.
   *
   * @param {object} props
   * @param {React.ReactNode} props.children - The routed page content
   * @returns {JSX.Element}
   */
  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="appHeader__left">
          <div className="appBrand" aria-label="WiFi Test Management Platform">
            <span className="appBrand__mark" aria-hidden="true">
              WiFi
            </span>
            <div className="appBrand__text">
              <div className="appBrand__title">WiFi Test Management</div>
              <div className="appBrand__subtitle">Ocean Professional</div>
            </div>
          </div>
        </div>

        <div className="appHeader__right" aria-label="User actions">
          <button className="btn btn--secondary" type="button">
            New Project
          </button>
          <div className="userChip" aria-label="Signed in user (placeholder)">
            <div className="userChip__avatar" aria-hidden="true">
              U
            </div>
            <div className="userChip__meta">
              <div className="userChip__name">User</div>
              <div className="userChip__role">Admin</div>
            </div>
          </div>
        </div>
      </header>

      <div className="appBody">
        <aside className="appSidebar" aria-label="Primary navigation">
          <nav className="nav">
            <div className="nav__sectionLabel">Modules</div>
            <ul className="nav__list">
              {NAV_ITEMS.map((item) => (
                <li className="nav__item" key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `nav__link ${isActive ? "is-active" : ""}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebarFooter">
            <div className="sidebarFooter__card">
              <div className="sidebarFooter__title">Status</div>
              <div className="sidebarFooter__text">
                Backend: <span className="pill pill--neutral">Not connected</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="appMain" role="main">
          {children}
        </main>

        <div className="toastRegion" aria-live="polite" aria-label="Notifications">
          {/* Placeholder toasts area (wired later) */}
          <div className="toast toast--info">
            <div className="toast__title">Welcome</div>
            <div className="toast__msg">UI skeleton is ready.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
