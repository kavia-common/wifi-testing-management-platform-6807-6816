import React from "react";

/**
 * Lightweight, theme-friendly table primitive.
 * - Supports loading/error/empty states (so pages can stay thin)
 * - Keeps layout consistent with Ocean Professional (cards + subtle borders)
 */

// PUBLIC_INTERFACE
export default function Table({
  columns = [],
  rows = [],
  rowKey = (row) => row.id,
  renderRow,
  loading = false,
  error = null,
  emptyTitle = "No data",
  emptyDescription = "There is nothing to show yet.",
  actions,
  footer,
  "aria-label": ariaLabel = "Table",
}) {
  /** Reusable table component used by module list pages. */

  const hasRows = Array.isArray(rows) && rows.length > 0;
  const colCount = Math.max(1, columns.length);

  return (
    <div className="table" role="region" aria-label={ariaLabel}>
      {actions ? <div className="table__actions">{actions}</div> : null}

      <div className="table__frame" role="table" aria-label={ariaLabel}>
        <div className="table__header" role="rowgroup">
          <div className="table__row table__row--header" role="row">
            {columns.map((c) => (
              <div
                key={c.key}
                className={`table__cell table__cell--header ${
                  c.align ? `table__cell--${c.align}` : ""
                }`}
                role="columnheader"
              >
                {c.header}
              </div>
            ))}
          </div>
        </div>

        <div className="table__body" role="rowgroup">
          {loading ? (
            <div className="table__state" role="row">
              <div
                className="table__state-inner"
                role="cell"
                style={{ gridColumn: `1 / span ${colCount}` }}
              >
                <div className="table__state-title">Loading…</div>
                <div className="table__state-text">
                  Fetching the latest data from the API.
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="table__state" role="row">
              <div
                className="table__state-inner"
                role="cell"
                style={{ gridColumn: `1 / span ${colCount}` }}
              >
                <div className="table__state-title">Something went wrong</div>
                <div className="table__state-text">
                  {error.message || "Request failed."}
                  {error.status ? ` (HTTP ${error.status})` : ""}
                </div>
              </div>
            </div>
          ) : !hasRows ? (
            <div className="table__state" role="row">
              <div
                className="table__state-inner"
                role="cell"
                style={{ gridColumn: `1 / span ${colCount}` }}
              >
                <div className="table__state-title">{emptyTitle}</div>
                <div className="table__state-text">{emptyDescription}</div>
              </div>
            </div>
          ) : (
            rows.map((row) => (
              <div className="table__row" role="row" key={rowKey(row)}>
                {renderRow ? (
                  renderRow(row)
                ) : (
                  <>
                    {columns.map((c) => (
                      <div
                        key={c.key}
                        className={`table__cell ${
                          c.align ? `table__cell--${c.align}` : ""
                        }`}
                        role="cell"
                      >
                        {typeof c.render === "function"
                          ? c.render(row)
                          : row?.[c.key]}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {footer ? <div className="table__footer">{footer}</div> : null}
    </div>
  );
}
