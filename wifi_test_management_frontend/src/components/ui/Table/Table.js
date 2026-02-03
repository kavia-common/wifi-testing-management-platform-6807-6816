import React from "react";
import "./Table.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export default function Table({
  columns,
  rows,
  getRowKey,
  emptyState,
  className,
  ariaLabel = "Data table",
}) {
  /**
   * Simple, composable table component.
   *
   * Props:
   *  - columns: [{ key, header, render?(row), width? }]
   *  - rows: array
   *  - getRowKey: (row, index) => string (optional)
   *  - emptyState: ReactNode shown when rows is empty
   *
   * Example usage:
   *  // <Table
   *  //   ariaLabel="Projects"
   *  //   columns={[
   *  //     { key: "name", header: "Name", render: (r) => r.name },
   *  //     { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
   *  //   ]}
   *  //   rows={projects}
   *  //   getRowKey={(r)=>r.id}
   *  //   emptyState={<EmptyState title="No projects" description="Create one to get started." />}
   *  // />
   */
  const hasRows = Array.isArray(rows) && rows.length > 0;

  return (
    <div className={cx("uiTableWrap", className)}>
      {hasRows ? (
        <div className="uiTableScroll">
          <table className="uiTable" aria-label={ariaLabel}>
            <thead className="uiTable__head">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="uiTable__th"
                    style={c.width ? { width: c.width } : undefined}
                    scope="col"
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="uiTable__body">
              {rows.map((row, idx) => {
                const key = getRowKey ? getRowKey(row, idx) : String(idx);
                return (
                  <tr className="uiTable__tr" key={key}>
                    {columns.map((c) => (
                      <td className="uiTable__td" key={c.key}>
                        {c.render ? c.render(row, idx) : row?.[c.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="uiTableEmpty">{emptyState}</div>
      )}
    </div>
  );
}
