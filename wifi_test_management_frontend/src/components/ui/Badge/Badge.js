import React from "react";
import "./Badge.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export default function Badge({ children, variant = "neutral", className, ...rest }) {
  /**
   * Small pill/badge component for status labeling.
   *
   * Props:
   *  - variant: "neutral" | "primary" | "secondary" | "success" | "error"
   *
   * Example usage:
   *  // <Badge variant="success">Passed</Badge>
   *  // <Badge variant="error">Failed</Badge>
   */
  return (
    <span className={cx("uiBadge", `uiBadge--${variant}`, className)} {...rest}>
      {children}
    </span>
  );
}
