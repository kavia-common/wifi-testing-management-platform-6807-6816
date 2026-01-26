import React, { useMemo, useState } from "react";
import { PageHeader, Toolbar } from "../../app/components/PageHeader";
import { Button } from "../../app/components/Button";
import { Table } from "../../app/components/Table";
import { Badge } from "../../app/components/Badge";
import { Modal } from "../../app/components/Modal";
import { Input, Select } from "../../app/components/form/Field";
import { ErrorBanner } from "../../app/components/States";
import { useToast } from "../../app/components/toast/ToastProvider";
import { useCreateTestCase, useTestCases } from "../../hooks/useTestCases";
import { useProjects } from "../../hooks/useProjects";

function priorityTone(p) {
  if (p === "High") return "error";
  if (p === "Medium") return "warning";
  return "info";
}

// PUBLIC_INTERFACE
export default function TestCasesPage() {
  /** Test cases list with project/priority filters and create modal. */
  const toast = useToast();
  const { data: cases, isLoading, error, refetch } = useTestCases();
  const { data: projects } = useProjects();
  const create = useCreateTestCase();

  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState("All");
  const [priority, setPriority] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", projectId: "", priority: "Medium" });

  const rows = useMemo(() => {
    const items = cases || [];
    return items.filter((tc) => {
      const matchQ = !q || tc.title.toLowerCase().includes(q.toLowerCase()) || tc.id.toLowerCase().includes(q.toLowerCase());
      const matchProject = projectId === "All" ? true : tc.projectId === projectId;
      const matchPriority = priority === "All" ? true : tc.priority === priority;
      return matchQ && matchProject && matchPriority;
    });
  }, [cases, q, projectId, priority]);

  const columns = useMemo(
    () => [
      { key: "id", header: "ID", accessor: (r) => r.id, sortable: true, width: 120 },
      { key: "title", header: "Title", accessor: (r) => r.title, sortable: true },
      { key: "projectName", header: "Project", accessor: (r) => r.projectName, sortable: true, width: 260 },
      {
        key: "priority",
        header: "Priority",
        accessor: (r) => r.priority,
        sortable: true,
        width: 140,
        cell: (r) => <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
      },
      { key: "updatedAt", header: "Last Updated", accessor: (r) => r.updatedAt, sortable: true, width: 220 },
      {
        key: "actions",
        header: "Actions",
        accessor: () => "",
        sortable: false,
        width: 160,
        cell: () => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" disabled>
              Edit
            </Button>
          </div>
        )
      }
    ],
    []
  );

  async function onSubmitCreate() {
    try {
      if (!draft.title.trim() || !draft.projectId) {
        toast.push({ tone: "error", title: "Validation", message: "Title and Project are required." });
        return;
      }
      await create.mutateAsync({ title: draft.title.trim(), projectId: draft.projectId, priority: draft.priority });
      toast.push({ tone: "success", title: "Test case created", message: `Created “${draft.title.trim()}”.` });
      setCreateOpen(false);
      setDraft({ title: "", projectId: "", priority: "Medium" });
    } catch (e) {
      toast.push({ tone: "error", title: "Create failed", message: e?.message || "Unable to create test case." });
    }
  }

  return (
    <div>
      <PageHeader
        title="Test Cases"
        description="Define and prioritize WiFi test cases under each project."
        breadcrumbs={["WiFi Test Management", "Test Cases"]}
        right={
          <Button
            onClick={() => {
              setCreateOpen(true);
              setDraft((d) => ({ ...d, projectId: projects?.[0]?.id || "" }));
            }}
          >
            Create
          </Button>
        }
      />

      <Toolbar>
        <div style={{ minWidth: 260, flex: "1 1 280px" }}>
          <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID or title…" />
        </div>
        <div style={{ width: 240 }}>
          <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="All">All</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ width: 200 }}>
          <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </Toolbar>

      {error ? <ErrorBanner title="Failed to load test cases" message={error.message} onRetry={() => refetch()} /> : null}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={error}
        emptyTitle="No test cases found"
        emptyMessage="Create a test case or adjust filters."
      />

      <Modal
        title="Create Test Case"
        open={createOpen}
        onClose={() => {
          if (!create.isPending) setCreateOpen(false);
        }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmitCreate} disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="Title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g., WPA2 Enterprise Auth" />
          <Select label="Project" value={draft.projectId} onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}>
            <option value="" disabled>
              Select…
            </option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Priority" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
