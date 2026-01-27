export const theme = {
  name: "Ocean Professional",
  colors: {
    primary: "#1E3A8A",
    secondary: "#F59E0B",
    success: "#059669",
    error: "#DC2626",
    background: "#F3F4F6",
    surface: "#FFFFFF",
    text: "#111827",
    // Subtle background gradient (interpreting "from-blue-900/10 to-amber-600/10")
    gradientFrom: "rgba(30, 58, 138, 0.10)",
    gradientTo: "rgba(245, 158, 11, 0.10)",
  },
  typography: {
    fontFamily:
      "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    monoFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    baseFontSize: "14px",
    lineHeight: 1.4,
  },
  spacing: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "24px",
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
  shadows: {
    sm: "0 1px 2px rgba(17, 24, 39, 0.06)",
    md: "0 6px 16px rgba(17, 24, 39, 0.10)",
  },
};
