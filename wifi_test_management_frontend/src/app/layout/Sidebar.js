import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/projects", label: "Projects" },
  { to: "/test-cases", label: "Test Cases" },
  { to: "/test-runs", label: "Test Runs" },
  { to: "/results", label: "Results" }
];

function linkStyle(isActive) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid",
    borderColor: isActive ? "rgba(30,58,138,0.28)" : "transparent",
    background: isActive ? "rgba(30,58,138,0.08)" : "transparent",
    color: "var(--color-text)",
    fontWeight: isActive ? 900 : 700
  };
}

// PUBLIC_INTERFACE
export function Sidebar() {
  /** Left sidebar navigation for main modules. */
  return (
    <aside
      style={{
        width: 260,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        padding: 12
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--color-text-muted)", padding: "8px 10px" }}>Modules</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {navItems.map((it) => (
          <NavLink key={it.to} to={it.to} style={({ isActive }) => linkStyle(isActive)}>
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: "var(--color-primary)",
                opacity: 0.7
              }}
            />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ marginTop: 14, padding: 10, borderRadius: 12, background: "var(--gradient-accent)", border: "1px solid var(--color-border)" }}>
        <div style={{ fontWeight: 900, fontSize: 12 }}>Tip</div>
        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
          Enable mock mode with <code>REACT_APP_FEATURE_FLAGS=mockApi</code>.
        </div>
      </div>
    </aside>
  );
}
