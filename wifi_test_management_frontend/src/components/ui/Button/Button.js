import React from "react";
import "./Button.css";

/**
 * Minimal classnames helper (avoid extra deps).
 */
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * A small spinner used inside buttons when loading.
 */
function InlineSpinner({ label = "Loading" }) {
  return (
    <span className="uiSpinner uiSpinner--inline" aria-label={label} role="img">
      <span className="uiSpinner__dot uiSpinner__dot--a" />
      <span className="uiSpinner__dot uiSpinner__dot--b" />
      <span className="uiSpinner__dot uiSpinner__dot--c" />
    </span>
  );
}

// PUBLIC_INTERFACE
export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  ariaLabel,
  className,
  onClick,
  ...rest
}) {
  /**
   * Shared button component aligned with Ocean Professional theme.
   *
   * Props:
   *  - variant: "primary" | "secondary" | "success" | "error" | "ghost"
   *  - size: "sm" | "md" | "lg"
   *  - loading: disables button and shows inline spinner
   *  - fullWidth: makes button take full container width
   *
   * Accessibility:
   *  - Provide ariaLabel when the button has no text content (icon-only).
   *
   * Example usage:
   *  // <Button variant="primary" onClick={save}>Save</Button>
   *  // <Button variant="secondary" size="sm">Cancel</Button>
   *  // <Button variant="success" loading>Deploy</Button>
   */
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cx(
        "uiButton",
        `uiButton--${variant}`,
        `uiButton--${size}`,
        fullWidth && "uiButton--fullWidth",
        loading && "uiButton--loading",
        className
      )}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading ? "true" : "false"}
      onClick={onClick}
      {...rest}
    >
      {leftIcon ? <span className="uiButton__icon">{leftIcon}</span> : null}
      <span className="uiButton__label">{children}</span>
      {loading ? <InlineSpinner /> : null}
      {rightIcon ? <span className="uiButton__icon">{rightIcon}</span> : null}
    </button>
  );
}
