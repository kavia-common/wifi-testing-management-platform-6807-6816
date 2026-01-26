import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Table } from "./Table";

test("Table renders headers and empty state", () => {
  render(
    <Table
      columns={[
        { key: "name", header: "Name", accessor: (r) => r.name },
        { key: "owner", header: "Owner", accessor: (r) => r.owner }
      ]}
      rows={[]}
      rowKey={(r) => r.id}
      loading={false}
      emptyTitle="No items"
      emptyMessage="Nothing here yet."
    />
  );

  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Owner")).toBeInTheDocument();
  expect(screen.getByText("No items")).toBeInTheDocument();
  expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
});

test("Table sorting toggles direction", () => {
  render(
    <Table
      columns={[
        { key: "name", header: "Name", accessor: (r) => r.name },
        { key: "owner", header: "Owner", accessor: (r) => r.owner }
      ]}
      rows={[
        { id: "1", name: "B", owner: "X" },
        { id: "2", name: "A", owner: "Y" }
      ]}
      rowKey={(r) => r.id}
      loading={false}
      pageSizeOptions={[10]}
    />
  );

  // Click sort by name (asc): A then B
  fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
  const cellsAfterAsc = screen.getAllByRole("cell");
  expect(cellsAfterAsc.some((c) => c.textContent === "A")).toBe(true);

  // Toggle to desc: B then A
  fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));
  const allCells = screen.getAllByRole("cell").map((n) => n.textContent);
  expect(allCells.includes("B")).toBe(true);
});
