import React from "react";
import "./Loader.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export default function Loader({ label = "Loading", size = "md", inline = false, className }) {
  /**
   * Accessible loader.
   *
   * Props:
   *  - size: "sm" | "md" | "lg"
   *  - inline: renders as inline-flex instead of block-centered
   *
   * Example usage:
   *  // <Loader label="Fetching projects" />
   *  // <Loader inline size="sm" label="Saving" />
   */
  return (
    <div
      className={cx("uiLoader", inline ? "uiLoader--inline" : "uiLoader--block", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cx("uiLoader__ring", `uiLoader__ring--${size}`)} aria-hidden="true" />
      <div className="uiLoader__text">{label}</div>
    </div>
  );
}
