import React from "react";
import PropTypes from "prop-types";

const styles = {
  base: {
    border: "1px solid transparent",
    borderRadius: "10px",
    padding: "10px 12px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    transition: "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
    fontFamily: "var(--font-sans)"
  },
  primary: {
    background: "var(--color-primary)",
    color: "white"
  },
  secondary: {
    background: "white",
    color: "var(--color-text)",
    borderColor: "var(--color-border)"
  },
  danger: {
    background: "var(--color-error)",
    color: "white"
  },
  subtle: {
    background: "transparent",
    color: "var(--color-text)",
    borderColor: "var(--color-border)",
    boxShadow: "none"
  }
};

// PUBLIC_INTERFACE
export function Button({ variant, children, disabled, style, ...props }) {
  /** Styled button with Ocean Professional variants. */
  const variantStyle = styles[variant] || styles.primary;
  const merged = { ...styles.base, ...variantStyle, ...style };

  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...merged,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
      onMouseDown={(e) => {
        // minor press feel without heavy styling
        if (!disabled) e.currentTarget.style.transform = "translateY(1px)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
      }}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "subtle"]),
  children: PropTypes.node,
  disabled: PropTypes.bool,
  style: PropTypes.object
};

Button.defaultProps = {
  variant: "primary",
  disabled: false,
  style: {}
};
