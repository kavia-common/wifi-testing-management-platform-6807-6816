import React from "react";
import { getEnvConfig } from "../config/env";
import { Badge } from "../components/Badge";

// PUBLIC_INTERFACE
export function Header() {
  /** App header with title and environment badges. */
  const cfg = getEnvConfig();

  return (
    <header
      style={{
        height: 56,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "var(--shadow-sm)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--gradient-accent)",
            border: "1px solid var(--color-border)"
          }}
          aria-hidden="true"
        />
        <div style={{ fontWeight: 900 }}>WiFi Test Management</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {cfg.mockApiEnabled ? <Badge tone="warning">Mock API</Badge> : <Badge tone="info">Real API</Badge>}
      </div>
    </header>
  );
}
