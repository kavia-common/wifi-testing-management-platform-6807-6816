import React from "react";
import PropTypes from "prop-types";

function getColors(tone) {
  if (tone === "success") return { bg: "rgba(5,150,105,0.12)", fg: "var(--color-success)", bd: "rgba(5,150,105,0.25)" };
  if (tone === "error") return { bg: "rgba(220,38,38,0.12)", fg: "var(--color-error)", bd: "rgba(220,38,38,0.25)" };
  if (tone === "warning") return { bg: "rgba(245,158,11,0.15)", fg: "#92400e", bd: "rgba(245,158,11,0.35)" };
  if (tone === "info") return { bg: "rgba(30,58,138,0.12)", fg: "var(--color-primary)", bd: "rgba(30,58,138,0.25)" };
  return { bg: "rgba(107,114,128,0.12)", fg: "var(--color-text-muted)", bd: "rgba(107,114,128,0.25)" };
}

// PUBLIC_INTERFACE
export function Badge({ tone, children }) {
  /** Small label for statuses/priorities. */
  const c = getColors(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        border: `1px solid ${c.bd}`,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.oneOf(["success", "error", "warning", "info", "neutral"]),
  children: PropTypes.node
};

Badge.defaultProps = {
  tone: "neutral"
};
