import React, { useMemo, useState } from "react";
import { Badge, Button, EmptyState, Modal, Table, TextInput } from "../components/ui";

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard route placeholder + small UI kit demo. */
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => [
      { id: "p-1", name: "Office WiFi Regression", status: "Active" },
      { id: "p-2", name: "Mesh Throughput Suite", status: "Paused" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const columns = useMemo(
    () => [
      { key: "name", header: "Project", render: (r) => r.name },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <Badge variant={r.status === "Active" ? "success" : "secondary"}>
            {r.status}
          </Badge>
        ),
        width: 160,
      },
    ],
    []
  );

  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Dashboard</h1>
            <p className="page__subtitle">
              Overview of projects, recent executions, and platform health.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Open Modal
            </Button>
            <Button variant="primary" onClick={() => setOpen(true)}>
              New Project
            </Button>
          </div>
        </div>

        <div className="grid2">
          <div className="statCard">
            <div className="statCard__label">Active Projects</div>
            <div className="statCard__value">—</div>
          </div>
          <div className="statCard">
            <div className="statCard__label">Executions Today</div>
            <div className="statCard__value">—</div>
          </div>
          <div className="statCard">
            <div className="statCard__label">Pass Rate</div>
            <div className="statCard__value">—</div>
          </div>
          <div className="statCard">
            <div className="statCard__label">Alerts</div>
            <div className="statCard__value">—</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <TextInput
            label="Quick search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            ariaLabel="Search projects"
            helperText="Demo: shared TextInput + Table + Badge components."
          />

          <Table
            ariaLabel="Recent projects"
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.id}
            emptyState={
              <EmptyState
                title="No matching projects"
                description="Try clearing the search or create a new project."
                action={
                  <Button variant="primary" onClick={() => setOpen(true)}>
                    Create Project
                  </Button>
                }
              />
            }
          />
        </div>

        <Modal
          open={open}
          title="New Project (demo modal)"
          description="This is a shared Modal component with footer actions."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Save
              </Button>
            </>
          }
        >
          <div style={{ display: "grid", gap: 12 }}>
            <TextInput
              label="Project name"
              value=""
              onChange={() => {}}
              placeholder="e.g., Office WiFi Regression"
              ariaLabel="Project name"
            />
            <TextInput
              label="Owner"
              value=""
              onChange={() => {}}
              placeholder="e.g., QA Team"
              ariaLabel="Project owner"
              helperText="Demo: these fields are non-functional placeholders."
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
