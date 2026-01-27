import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  executionsApi,
  notifyApiError,
  projectsApi,
  testCasesApi,
  useApiClient,
  useToast,
} from "../../api";

/**
 * UI conventions:
 * - Keep structure consistent with existing CreateTestCase / CreateProject pages (cards + classic layout).
 * - We support creating an execution and optionally starting it immediately.
 */

// PUBLIC_INTERFACE
export default function CreateExecution() {
  /** Create/start Execution flow with optional project + test case association. */

  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialProjectId = searchParams.get("projectId") || "";
  const initialTestCaseId = searchParams.get("testCaseId") || "";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [testCaseId, setTestCaseId] = useState(initialTestCaseId);
  const [label, setLabel] = useState("");
  const [startNow, setStartNow] = useState(true);

  const [projects, setProjects] = useState([]);
  const [testCases, setTestCases] = useState([]);

  const [loadingRefs, setLoadingRefs] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) || null,
    [projects, projectId]
  );

  useEffect(() => {
    let mounted = true;

    async function loadRefs() {
      setLoadingRefs(true);

      // Projects list (non-fatal if fails; we can still accept manual IDs).
      const pRes = await projectsApi.listProjects(client);
      if (mounted && pRes.ok) setProjects(Array.isArray(pRes.data) ? pRes.data : []);

      // Test cases list: if projectId is known, filter; else load all.
      const tcRes = await testCasesApi.listTestCases(client, {
        projectId: projectId || undefined,
      });
      if (mounted && tcRes.ok)
        setTestCases(Array.isArray(tcRes.data) ? tcRes.data : []);

      setLoadingRefs(false);
    }

    loadRefs();
    return () => {
      mounted = false;
    };
  }, [client, projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    const payload = {
      // server/mock will accept extra fields; execution endpoints are minimal.
      projectId: projectId || undefined,
      testCaseId: testCaseId || undefined,
      label: label || undefined,
      status: startNow ? "Running" : "Queued",
      startedAt: startNow ? new Date().toISOString() : undefined,
      finishedAt: undefined,
    };

    setSaving(true);

    const createRes = await executionsApi.createExecution(client, payload);
    if (!createRes.ok) {
      notifyApiError(toast, createRes, "Failed to create execution");
      setSaving(false);
      return;
    }

    const created = createRes.data || null;
    const createdId = created?.id;

    toast.push({
      level: "success",
      title: "Execution created",
      message: createdId ? `Created execution ${createdId}.` : "Created execution.",
    });

    // If "Start now" but backend created it queued, force start via update (safe for both mock+real).
    if (startNow && createdId && created?.status !== "Running") {
      const startRes = await executionsApi.updateExecution(client, createdId, {
        status: "Running",
        startedAt: created?.startedAt || new Date().toISOString(),
        finishedAt: null,
      });

      if (!startRes.ok) {
        notifyApiError(toast, startRes, "Execution created, but failed to start");
        setSaving(false);
        if (createdId) navigate(`/executions/${encodeURIComponent(createdId)}`);
        return;
      }

      toast.push({
        level: "success",
        title: "Execution started",
        message: `Execution ${createdId} is now running.`,
      });
    }

    setSaving(false);

    if (createdId) {
      navigate(`/executions/${encodeURIComponent(createdId)}`);
    } else {
      navigate("/executions");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">New Execution</h1>
          <p className="muted">
            Create a new execution and optionally start it immediately.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn btn--secondary" to="/executions">
            Back to Executions
          </Link>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__title">Execution setup</div>
          <div className="card__body">
            <form onSubmit={handleSubmit}>
              <div className="form">
                <label className="field">
                  <div className="field__label">Project</div>
                  <select
                    className="input"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={loadingRefs || saving}
                  >
                    <option value="">— Optional —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name ? `${p.name} (${p.id})` : p.id}
                      </option>
                    ))}
                  </select>
                  <div className="field__help muted">
                    Used for filtering and navigation. You can still create an
                    execution without selecting a project.
                  </div>
                </label>

                <label className="field">
                  <div className="field__label">Test Case</div>
                  <select
                    className="input"
                    value={testCaseId}
                    onChange={(e) => setTestCaseId(e.target.value)}
                    disabled={loadingRefs || saving}
                  >
                    <option value="">— Optional —</option>
                    {testCases.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name ? `${tc.name} (${tc.id})` : tc.id}
                      </option>
                    ))}
                  </select>
                  <div className="field__help muted">
                    Optional association for traceability. If a project is
                    selected, the list is filtered.
                  </div>
                </label>

                <label className="field">
                  <div className="field__label">Label</div>
                  <input
                    className="input"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., Nightly regression"
                    disabled={saving}
                  />
                </label>

                <label className="field" style={{ display: "flex", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={startNow}
                    onChange={(e) => setStartNow(e.target.checked)}
                    disabled={saving}
                  />
                  <div>
                    <div className="field__label" style={{ margin: 0 }}>
                      Start immediately
                    </div>
                    <div className="field__help muted">
                      Creates the execution with status Running and sets started
                      time.
                    </div>
                  </div>
                </label>

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button type="submit" className="btn" disabled={saving}>
                    {saving ? "Creating…" : startNow ? "Create & Start" : "Create"}
                  </button>
                  {projectId ? (
                    <Link
                      className="btn btn--secondary"
                      to={`/projects/${encodeURIComponent(projectId)}`}
                    >
                      View Project
                    </Link>
                  ) : null}
                </div>
              </div>
            </form>

            {selectedProject ? (
              <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                Selected project: <strong>{selectedProject.name || projectId}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card">
          <div className="card__title">Notes</div>
          <div className="card__body">
            <div className="muted" style={{ lineHeight: 1.6 }}>
              Use the Execution Detail page after creation to:
              <ul style={{ marginTop: 8 }}>
                <li>Start/stop the run</li>
                <li>Track status and timestamps</li>
                <li>Navigate to results for the execution</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
