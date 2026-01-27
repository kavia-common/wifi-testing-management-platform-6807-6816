import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import TestCaseForm from "./TestCaseForm";
import {
  notifyApiError,
  projectsApi,
  testCasesApi,
  useApiClient,
  useToast,
} from "../../api";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search || ""), [search]);
}

// PUBLIC_INTERFACE
export default function CreateTestCase() {
  /** Create test case page using shared API endpoints and toasts. */

  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const params = useQueryParams();

  const lockedProjectId = routeProjectId || params.get("projectId") || "";

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      setProjectsLoading(true);
      const res = await projectsApi.listProjects(client);
      if (!mounted) return;

      if (!res.ok) {
        notifyApiError(toast, res, "Failed to load projects");
        setProjects([]);
        setProjectsLoading(false);
        return;
      }

      setProjects(Array.isArray(res.data) ? res.data : []);
      setProjectsLoading(false);
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [client, toast]);

  async function handleCreate(payload) {
    setSaving(true);

    const res = await testCasesApi.createTestCase(client, payload);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to create test case");
      setSaving(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Test case created",
      message: `Created "${res.data?.name || payload.name}".`,
    });

    setSaving(false);

    const id = res.data?.id;
    if (id) navigate(`/test-cases/${id}`);
    else navigate(`/test-cases${lockedProjectId ? `?projectId=${encodeURIComponent(lockedProjectId)}` : ""}`);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Create Test Case</h1>
          <p className="muted">
            Define a new test case and associate it with a project.
          </p>
        </div>

        <Link
          className="btn btn--secondary"
          to={
            lockedProjectId
              ? `/test-cases?projectId=${encodeURIComponent(lockedProjectId)}`
              : "/test-cases"
          }
        >
          Back to Test Cases
        </Link>
      </div>

      <div className="grid">
        <section className="card">
          {projectsLoading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">Fetching projects for selection.</div>
            </>
          ) : (
            <>
              <div className="card__title">Test case details</div>
              <div className="card__body" style={{ marginBottom: 12 }}>
                Provide a name, select a project, and optionally add tags.
              </div>

              <TestCaseForm
                projects={projects}
                lockedProjectId={lockedProjectId || null}
                submitLabel="Create"
                submitting={saving}
                onCancel={() =>
                  navigate(
                    lockedProjectId
                      ? `/test-cases?projectId=${encodeURIComponent(lockedProjectId)}`
                      : "/test-cases"
                  )
                }
                onSubmit={handleCreate}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
