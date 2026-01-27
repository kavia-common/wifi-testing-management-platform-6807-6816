import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  notifyApiError,
  projectsApi,
  testCasesApi,
  useApiClient,
  useToast,
} from "../../api";

// PUBLIC_INTERFACE
export default function TestCaseDetail() {
  /** Test case detail page with API integration (mock/real via ApiClientProvider). */

  const { testCaseId } = useParams();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const [testCase, setTestCase] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!testCaseId) return;

      setLoading(true);
      setError(null);
      setProject(null);

      const res = await testCasesApi.getTestCase(client, testCaseId);
      if (!mounted) return;

      if (!res.ok) {
        setError(res);
        notifyApiError(toast, res, "Failed to load test case");
        setTestCase(null);
        setLoading(false);
        return;
      }

      const tc = res.data || null;
      setTestCase(tc);

      // Load project label if available (non-fatal).
      if (tc?.projectId) {
        const pRes = await projectsApi.getProject(client, tc.projectId);
        if (mounted && pRes.ok) setProject(pRes.data || null);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [client, testCaseId, toast]);

  const tags = useMemo(
    () => (Array.isArray(testCase?.tags) ? testCase.tags : []),
    [testCase]
  );

  async function handleDelete() {
    if (!testCaseId) return;
    if (deleting) return;

    const label = testCase?.name || testCaseId;
    const confirmed = window.confirm(
      `Delete test case "${label}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);

    const res = await testCasesApi.deleteTestCase(client, testCaseId);
    if (!res.ok) {
      notifyApiError(toast, res, "Failed to delete test case");
      setDeleting(false);
      return;
    }

    toast.push({
      level: "success",
      title: "Test case deleted",
      message: `Deleted "${label}".`,
    });

    const backTo =
      testCase?.projectId
        ? `/test-cases?projectId=${encodeURIComponent(testCase.projectId)}`
        : "/test-cases";

    navigate(backTo);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Test Case Detail</h1>
          <p className="muted">
            {testCaseId ? (
              <>
                Test case <strong>{testCaseId}</strong>
              </>
            ) : (
              "Missing test case id."
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn btn--secondary" to="/test-cases">
            Back to Test Cases
          </Link>

          <Link
            className="btn btn--secondary"
            to={testCaseId ? `/test-cases/${testCaseId}/edit` : "/test-cases"}
          >
            Edit
          </Link>

          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          {loading ? (
            <>
              <div className="card__title">Loading…</div>
              <div className="card__body">Fetching test case data.</div>
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
                The test case doesn’t exist (or isn’t visible in the current API
                mode).
              </div>
            </>
          ) : (
            <>
              <div className="card__title">Definition</div>
              <div className="card__body">
                <div className="kv">
                  <div className="kv__row">
                    <div className="kv__key">Name</div>
                    <div className="kv__value">{testCase.name || "—"}</div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Project</div>
                    <div className="kv__value">
                      {testCase.projectId ? (
                        <Link className="table__link" to={`/projects/${testCase.projectId}`}>
                          {project?.name || testCase.projectId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Tags</div>
                    <div className="kv__value">
                      {tags.length ? tags.join(", ") : "—"}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Created</div>
                    <div className="kv__value">
                      {testCase.createdAt
                        ? new Date(testCase.createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>

                  <div className="kv__row">
                    <div className="kv__key">Updated</div>
                    <div className="kv__value">
                      {testCase.updatedAt
                        ? new Date(testCase.updatedAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card__title">Actions</div>
          <div className="card__body">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {testCase?.projectId ? (
                <Link
                  className="btn btn--secondary"
                  to={`/test-cases?projectId=${encodeURIComponent(testCase.projectId)}`}
                >
                  View all test cases in this project
                </Link>
              ) : null}

              {testCase?.projectId ? (
                <Link
                  className="btn"
                  to={`/projects/${encodeURIComponent(testCase.projectId)}/test-cases/new`}
                >
                  Create another in this project
                </Link>
              ) : (
                <Link className="btn" to="/test-cases/new">
                  Create a new test case
                </Link>
              )}
            </div>

            <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              Next: attach steps/parameters and link executions/results.
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
