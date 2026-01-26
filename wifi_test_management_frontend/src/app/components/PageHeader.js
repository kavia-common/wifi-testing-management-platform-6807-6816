import React from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
export function Breadcrumbs({ items }) {
  /** Breadcrumb trail for page context. */
  return (
    <nav aria-label="Breadcrumbs" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
      {items.map((it, idx) => (
        <span key={`${it}-${idx}`}>
          {it}
          {idx < items.length - 1 ? <span style={{ margin: "0 8px" }}>/</span> : null}
        </span>
      ))}
    </nav>
  );
}

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string)
};

Breadcrumbs.defaultProps = {
  items: []
};

// PUBLIC_INTERFACE
export function PageHeader({ title, description, breadcrumbs, right }) {
  /** Standard page header with title, description, breadcrumbs, and right-side actions. */
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 14
      }}
    >
      <div>
        {breadcrumbs && breadcrumbs.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{title}</div>
        {description ? <div style={{ marginTop: 6, color: "var(--color-text-muted)", fontSize: 13 }}>{description}</div> : null}
      </div>
      {right ? <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{right}</div> : null}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(PropTypes.string),
  right: PropTypes.node
};

PageHeader.defaultProps = {
  description: "",
  breadcrumbs: [],
  right: null
};

// PUBLIC_INTERFACE
export function Toolbar({ children }) {
  /** Toolbar container, typically used for search and filters above tables. */
  return (
    <div
      className="card"
      style={{
        padding: 14,
        marginBottom: 12,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end"
      }}
    >
      {children}
    </div>
  );
}

Toolbar.propTypes = {
  children: PropTypes.node
};

Toolbar.defaultProps = {
  children: null
};
