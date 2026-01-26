import React, { useMemo, useState } from "react";
import { PageHeader, Toolbar } from "../../app/components/PageHeader";
import { Button } from "../../app/components/Button";
import { Table } from "../../app/components/Table";
import { Badge } from "../../app/components/Badge";
import { Modal } from "../../app/components/Modal";
import { Input, Select } from "../../app/components/form/Field";
import { ErrorBanner } from "../../app/components/States";
import { useToast } from "../../app/components/toast/ToastProvider";
import { useCreateProject, useProjects } from "../../hooks/useProjects";

function statusTone(status) {
  if (status === "Active") return "success";
  if (status === "Archived") return "neutral";
  return "info";
}

// PUBLIC_INTERFACE
export default function ProjectsPage() {
  /** Projects list with search/filter and create project modal. */
  const toast = useToast();
  const { data, isLoading, error, refetch } = useProjects();
  const createProject = useCreateProject();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", owner: "" });

  const rows = useMemo(() => {
    const items = data || [];
    return items.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.owner.toLowerCase().includes(q.toLowerCase());
      const matchStatus = status === "All" ? true : p.status === status;
      return matchQ && matchStatus;
    });
  }, [data, q, status]);

  const columns = useMemo(
    () => [
      { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
      { key: "owner", header: "Owner", accessor: (r) => r.owner, sortable: true },
      {
        key: "status",
        header: "Status",
        accessor: (r) => r.status,
        cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
        sortable: true,
        width: 140
      },
      { key: "updatedAt", header: "Updated At", accessor: (r) => r.updatedAt, sortable: true, width: 220 },
      {
        key: "actions",
        header: "Actions",
        accessor: () => "",
        sortable: false,
        width: 280,
        cell: (r) => (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" disabled>
              View
            </Button>
            <Button variant="secondary" disabled={r.status === "Archived"}>
              Edit
            </Button>
            <Button variant="danger" disabled={r.status === "Archived"}>
              Archive
            </Button>
          </div>
        )
      }
    ],
    []
  );

  async function onSubmitCreate() {
    try {
      if (!draft.name.trim() || !draft.owner.trim()) {
        toast.push({ tone: "error", title: "Validation", message: "Name and Owner are required." });
        return;
      }
      await createProject.mutateAsync({ name: draft.name.trim(), owner: draft.owner.trim() });
      toast.push({ tone: "success", title: "Project created", message: `Created “${draft.name.trim()}”.` });
      setCreateOpen(false);
      setDraft({ name: "", owner: "" });
    } catch (e) {
      toast.push({ tone: "error", title: "Create failed", message: e?.message || "Unable to create project." });
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage WiFi test projects, ownership, and lifecycle status."
        breadcrumbs={["WiFi Test Management", "Projects"]}
        right={
          <Button onClick={() => setCreateOpen(true)} aria-label="Create project">
            Create Project
          </Button>
        }
      />

      <Toolbar>
        <div style={{ minWidth: 260, flex: "1 1 280px" }}>
          <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or owner…" />
        </div>
        <div style={{ width: 220 }}>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </Select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </Toolbar>

      {error ? <ErrorBanner title="Failed to load projects" message={error.message} onRetry={() => refetch()} /> : null}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={error}
        emptyTitle="No projects found"
        emptyMessage="Create a project or clear filters to see results."
      />

      <Modal
        title="Create Project"
        open={createOpen}
        onClose={() => {
          if (!createProject.isPending) setCreateOpen(false);
        }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createProject.isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmitCreate} disabled={createProject.isPending}>
              {createProject.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="Project Name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g., Campus WiFi Rollout" />
          <Input label="Owner" value={draft.owner} onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))} placeholder="e.g., Alex Chen" />
          <div className="muted" style={{ fontSize: 12 }}>
            Status starts as <strong>Active</strong>.
          </div>
        </div>
      </Modal>
    </div>
  );
}
