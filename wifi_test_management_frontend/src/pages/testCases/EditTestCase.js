import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TestCaseForm from "./TestCaseForm";
import {
  notifyApiError,
  projectsApi,
  testCasesApi,
  useApiClient,
  useToast,
} from "../../api";

// PUBLIC_INTERFACE
export default function EditTestCase() {
  /** Edit test case page using shared API endpoints and toasts. */

  const { testCaseId } = useParams();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [testCase, setTestCase] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!testCaseId) return;

      setLoading(true);
      setError(null);

      // Load both: projects (for select) and the test case itself.
      const [pRes, tcRes] = await Promise.all([
        projectsApi.listProjects(client),
        testCasesApi.getTestCase(client, testCaseId),
      ]);

      if (!mounted) return;

      if (!pRes.ok) {
        // Not fatal for editing if projectId is already present; but show toast.
        notifyApiError(toast, pRes, "Failed to load projects");
        setProjects([]);
      } else {
        setProjects(Array.isArray(pRes.data) ? pRes.data : []);
      }

      if (!tcRes.ok) {
        setError(tcRes);
        notifyApiError(toast, tcRes, "Failed to load test case");
        setTestCase(null);
        setLoading(false);
        return;
      }

      setTestCase(tcRes.data || null);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [client, testCaseId, toast]);

  async function handleUpdate(payload) {
    if (!testCaseId) return;

    setSaving(true);

    const res = await testCasesApi.updateTestCase(client, testCaseId, payload);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to update test case");
      setSaving(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Test case updated",
      message: `Updated "${res.data?.name || payload.name}".`,
    });

    setSaving(false);
    navigate(`/test-cases/${testCaseId}`);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Edit Test Case</h1>
          <p className="muted">
            {testCaseId ? (
              <>
                Editing test case <strong>{testCaseId}</strong>.
              </>
            ) : (
              "Missing test case id."
            )}
          </p>
        </div>

        <Link
          className="btn btn--secondary"
          to={testCaseId ? `/test-cases/${testCaseId}` : "/test-cases"}
        >
          Cancel
        </Link>
      </div>

      <div className="grid">
        <section className="card">
          {loading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">Fetching test case data from the API.</div>
            </>
          ) : error ? (
            <>
              <div className="card__title">Failed to load</div>
              <div className="card__body">
                {error.message || "Request failed."}
                {error.status ? ` (HTTP ${error.status})` : ""}
              </div>
            </>
          ) : !testCase ? (
            <>
              <div className="card__title">Not found</div>
              <div className="card__body">
                This test case doesn’t exist (or isn’t visible in the current API
                mode).
              </div>
            </>
          ) : (
            <>
              <div className="card__title">Test case details</div>
              <div className="card__body" style={{ marginBottom: 12 }}>
                Update the test case name, project association, and tags.
              </div>

              <TestCaseForm
                initialValues={testCase}
                projects={projects}
                submitLabel="Update"
                submitting={saving}
                onCancel={() => navigate(`/test-cases/${testCaseId}`)}
                onSubmit={handleUpdate}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
