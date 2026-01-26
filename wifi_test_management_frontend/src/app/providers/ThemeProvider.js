import React from "react";
import PropTypes from "prop-types";

/**
 * Minimal ThemeProvider. Theme is applied via CSS variables (theme.css).
 * This provider exists as a central extension point for future theme switching.
 */
// PUBLIC_INTERFACE
export function ThemeProvider({ children }) {
  /** Provides a theme context boundary (currently CSS-variable driven). */
  return <div data-theme="ocean-professional">{children}</div>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node
};
