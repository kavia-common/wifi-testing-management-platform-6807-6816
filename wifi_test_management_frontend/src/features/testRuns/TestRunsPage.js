import React, { useMemo, useState } from "react";
import { PageHeader, Toolbar } from "../../app/components/PageHeader";
import { Button } from "../../app/components/Button";
import { Table } from "../../app/components/Table";
import { Badge } from "../../app/components/Badge";
import { Modal } from "../../app/components/Modal";
import { Select, Checkbox } from "../../app/components/form/Field";
import { ErrorBanner } from "../../app/components/States";
import { useToast } from "../../app/components/toast/ToastProvider";
import { useProjects } from "../../hooks/useProjects";
import { useTestCases } from "../../hooks/useTestCases";
import { useStartTestRun, useTestRuns } from "../../hooks/useTestRuns";

function runTone(status) {
  if (status === "Passed") return "success";
  if (status === "Failed") return "error";
  if (status === "Running") return "info";
  if (status === "Queued") return "warning";
  return "neutral";
}

// PUBLIC_INTERFACE
export default function TestRunsPage() {
  /** Test runs list and start-run workflow (mock-friendly). */
  const toast = useToast();
  const { data: runs, isLoading, error, refetch } = useTestRuns();
  const { data: projects } = useProjects();
  const { data: cases } = useTestCases();
  const startRun = useStartTestRun();

  const [projectId, setProjectId] = useState("All");
  const [status, setStatus] = useState("All");

  const [startOpen, setStartOpen] = useState(false);
  const [draftProjectId, setDraftProjectId] = useState("");
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);

  const filteredRuns = useMemo(() => {
    const items = runs || [];
    return items.filter((r) => {
      const matchProject = projectId === "All" ? true : r.projectId === projectId;
      const matchStatus = status === "All" ? true : r.status === status;
      return matchProject && matchStatus;
    });
  }, [runs, projectId, status]);

  const columns = useMemo(
    () => [
      { key: "id", header: "Run ID", accessor: (r) => r.id, sortable: true, width: 140 },
      { key: "projectName", header: "Project", accessor: (r) => r.projectName, sortable: true },
      {
        key: "status",
        header: "Status",
        accessor: (r) => r.status,
        sortable: true,
        width: 140,
        cell: (r) => <Badge tone={runTone(r.status)}>{r.status}</Badge>
      },
      { key: "startedAt", header: "Started At", accessor: (r) => r.startedAt, sortable: true, width: 220 },
      { key: "durationSec", header: "Duration", accessor: (r) => r.durationSec, sortable: true, width: 140, cell: (r) => `${r.durationSec}s` },
      {
        key: "actions",
        header: "Actions",
        accessor: () => "",
        sortable: false,
        width: 180,
        cell: () => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" disabled>
              View details
            </Button>
          </div>
        )
      }
    ],
    []
  );

  const eligibleCases = useMemo(() => {
    if (!draftProjectId) return [];
    return (cases || []).filter((tc) => tc.projectId === draftProjectId);
  }, [cases, draftProjectId]);

  async function onSubmitStart() {
    try {
      if (!draftProjectId) {
        toast.push({ tone: "error", title: "Validation", message: "Select a project." });
        return;
      }
      if (selectedCaseIds.length === 0) {
        toast.push({ tone: "error", title: "Validation", message: "Select at least one test case." });
        return;
      }
      await startRun.mutateAsync({ projectId: draftProjectId, testCaseIds: selectedCaseIds });
      toast.push({ tone: "success", title: "Run started", message: "A new test run has been queued." });
      setStartOpen(false);
      setDraftProjectId("");
      setSelectedCaseIds([]);
    } catch (e) {
      toast.push({ tone: "error", title: "Start failed", message: e?.message || "Unable to start run." });
    }
  }

  return (
    <div>
      <PageHeader
        title="Test Runs"
        description="Track execution runs across projects (queued, running, and final status)."
        breadcrumbs={["WiFi Test Management", "Test Runs"]}
        right={
          <Button
            onClick={() => {
              setStartOpen(true);
              const first = projects?.[0]?.id || "";
              setDraftProjectId(first);
              setSelectedCaseIds([]);
            }}
          >
            Start Run
          </Button>
        }
      />

      <Toolbar>
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
        <div style={{ width: 220 }}>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Queued">Queued</option>
            <option value="Running">Running</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
          </Select>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </Toolbar>

      {error ? <ErrorBanner title="Failed to load test runs" message={error.message} onRetry={() => refetch()} /> : null}

      <Table
        columns={columns}
        rows={filteredRuns}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={error}
        emptyTitle="No test runs found"
        emptyMessage="Start a run to see execution history."
      />

      <Modal
        title="Start Test Run"
        open={startOpen}
        onClose={() => {
          if (!startRun.isPending) setStartOpen(false);
        }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStartOpen(false)} disabled={startRun.isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmitStart} disabled={startRun.isPending}>
              {startRun.isPending ? "Starting…" : "Start"}
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Select label="Project" value={draftProjectId} onChange={(e) => setDraftProjectId(e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Select test cases</div>
            {eligibleCases.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>
                No test cases available for this project.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {eligibleCases.map((tc) => {
                  const checked = selectedCaseIds.includes(tc.id);
                  return (
                    <Checkbox
                      key={tc.id}
                      label={`${tc.id} — ${tc.title}`}
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setSelectedCaseIds((xs) => (next ? [...xs, tc.id] : xs.filter((id) => id !== tc.id)));
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
