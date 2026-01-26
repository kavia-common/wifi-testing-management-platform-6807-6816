import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { EmptyState } from "./States";

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

// PUBLIC_INTERFACE
export function Table({
  columns,
  rows,
  rowKey,
  loading,
  error,
  emptyTitle,
  emptyMessage,
  pageSizeOptions
}) {
  /**
   * Reusable table with sorting + pagination + loading/empty states.
   * @param {Array<{key:string, header:string, accessor:(row:any)=>any, cell?:(row:any)=>React.ReactNode, sortable?:boolean, width?:string|number}>} columns
   */
  const [sort, setSort] = useState({ key: "", dir: "asc" });
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] || 10);
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!rows) return [];
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;

    const copy = [...rows];
    copy.sort((ra, rb) => {
      const va = col.accessor(ra);
      const vb = col.accessor(rb);
      const res = compare(va, vb);
      return sort.dir === "asc" ? res : -res;
    });
    return copy;
  }, [rows, sort, columns]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, clampedPage, pageSize]);

  const showEmpty = !loading && !error && total === 0;

  return (
    <div className="card" style={{ overflow: "hidden" }} data-testid="table-root">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: "var(--gradient-accent)" }}>
              {columns.map((c) => {
                const active = sort.key === c.key;
                const sortable = c.sortable !== false;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    style={{
                      textAlign: "left",
                      padding: "12px 12px",
                      fontSize: 12,
                      letterSpacing: 0.2,
                      color: "var(--color-text)",
                      borderBottom: "1px solid var(--color-border)",
                      width: c.width
                    }}
                  >
                    <button
                      type="button"
                      disabled={!sortable}
                      onClick={() => {
                        if (!sortable) return;
                        setPage(1);
                        setSort((prev) => {
                          if (prev.key !== c.key) return { key: c.key, dir: "asc" };
                          return { key: c.key, dir: prev.dir === "asc" ? "desc" : "asc" };
                        });
                      }}
                      style={{
                        all: "unset",
                        cursor: sortable ? "pointer" : "default",
                        fontWeight: 900,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8
                      }}
                      aria-label={`Sort by ${c.header}`}
                    >
                      {c.header}
                      {sortable ? (
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={`sk_${idx}`}>
                  {columns.map((c) => (
                    <td
                      key={`${c.key}_${idx}`}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid var(--color-border)"
                      }}
                    >
                      <div className="skeleton" style={{ height: 14, width: "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              pageRows.map((r) => (
                <tr key={rowKey(r)} style={{ background: "white" }}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: "12px", borderBottom: "1px solid var(--color-border)", fontSize: 13 }}>
                      {c.cell ? c.cell(r) : String(c.accessor(r) ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showEmpty ? (
        <div style={{ padding: 14 }}>
          <EmptyState title={emptyTitle} message={emptyMessage} />
        </div>
      ) : null}

      <div
        style={{
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div className="muted" style={{ fontSize: 12 }}>
          {loading ? "Loading…" : `${total} item${total === 1 ? "" : "s"}`}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            Page size
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                padding: "6px 8px",
                background: "white"
              }}
              aria-label="Page size"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={clampedPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              padding: "6px 10px",
              background: "white",
              cursor: clampedPage <= 1 ? "not-allowed" : "pointer"
            }}
            aria-label="Previous page"
          >
            Prev
          </button>

          <div style={{ fontSize: 12, fontWeight: 800 }}>
            {clampedPage} / {totalPages}
          </div>

          <button
            type="button"
            disabled={clampedPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              padding: "6px 10px",
              background: "white",
              cursor: clampedPage >= totalPages ? "not-allowed" : "pointer"
            }}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      accessor: PropTypes.func.isRequired,
      cell: PropTypes.func,
      sortable: PropTypes.bool,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  rows: PropTypes.array,
  rowKey: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.any,
  emptyTitle: PropTypes.string,
  emptyMessage: PropTypes.string,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number)
};

Table.defaultProps = {
  rows: [],
  loading: false,
  error: null,
  emptyTitle: "No data yet",
  emptyMessage: "Try adjusting your filters or create a new item.",
  pageSizeOptions: [10, 20, 50]
};
