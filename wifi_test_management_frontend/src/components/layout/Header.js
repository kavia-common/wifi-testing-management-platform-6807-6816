import React from "react";

// PUBLIC_INTERFACE
export default function Header({
  onToggleSidebar,
  isSidebarCollapsed,
  apiModeLabel,
  apiBaseUrl,
}) {
  return (
    <header className="header" role="banner">
      <div className="header__left">
        <button
          type="button"
          className="icon-button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* simple hamburger icon */}
          <span className="icon-button__hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="header__title">
          <div className="header__app-name">WiFi Test Management</div>
          <div className="header__subtitle">Platform</div>
        </div>

        <div
          className={`api-mode-badge api-mode-badge--${apiModeLabel || "unknown"}`}
          title={
            apiModeLabel === "real"
              ? `Real API: ${apiBaseUrl || "(no base URL)"}`
              : "Mock API (in-memory)"
          }
          aria-label={`API mode: ${apiModeLabel || "unknown"}`}
        >
          {apiModeLabel === "real" ? "REAL API" : "MOCK API"}
        </div>
      </div>

      <div className="header__right" aria-label="User actions area">
        {/* Reserved for user profile, search, actions, etc. */}
        <button type="button" className="btn btn--secondary" disabled>
          Actions
        </button>
        <div className="header__user-pill" aria-label="User placeholder">
          <div className="header__avatar" aria-hidden="true">
            U
          </div>
          <div className="header__user-text">
            <div className="header__user-name">User</div>
            <div className="header__user-role">Viewer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
