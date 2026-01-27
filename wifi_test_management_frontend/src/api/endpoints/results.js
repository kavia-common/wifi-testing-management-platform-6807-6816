/**
 * Results API endpoints.
 *
 * All functions return:
 *  - { ok: true, data, status? }
 *  - { ok: false, status, message, details? }
 */

/**
 * @typedef {Object} Result
 * @property {string} id
 * @property {string=} executionId
 * @property {string=} verdict
 * @property {string=} label
 * @property {string=} createdAt
 * @property {string=} updatedAt
 */

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    const str = String(v);
    if (!str) return;
    sp.set(k, str);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

// PUBLIC_INTERFACE
export async function listResults(
  client,
  { executionId, projectId, testCaseId, status } = {}
) {
  /** Fetch results, optionally filtered by executionId/projectId/testCaseId/status. */
  const qs = buildQuery({
    executionId,
    projectId,
    testCaseId,
    status,
  });

  return client.get(`/results${qs}`);
}

// PUBLIC_INTERFACE
export async function getResult(client, resultId) {
  /** Fetch a single result by id. */
  return client.get(`/results/${encodeURIComponent(resultId)}`);
}

// PUBLIC_INTERFACE
export async function createResult(client, result) {
  /** Create a new result. */
  return client.post("/results", result);
}

// PUBLIC_INTERFACE
export async function updateResult(client, resultId, patch) {
  /** Update an existing result. */
  return client.put(`/results/${encodeURIComponent(resultId)}`, patch);
}

// PUBLIC_INTERFACE
export async function deleteResult(client, resultId) {
  /** Delete a result. */
  return client.del(`/results/${encodeURIComponent(resultId)}`);
}
