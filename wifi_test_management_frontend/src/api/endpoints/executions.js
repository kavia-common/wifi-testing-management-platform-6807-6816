/**
 * Executions API endpoints.
 *
 * All functions return:
 *  - { ok: true, data, status? }
 *  - { ok: false, status, message, details? }
 */

/**
 * @typedef {Object} Execution
 * @property {string} id
 * @property {string=} projectId
 * @property {string=} status
 * @property {string=} startedAt
 * @property {string=} finishedAt
 */

// PUBLIC_INTERFACE
export async function listExecutions(client, { projectId } = {}) {
  /** Fetch executions, optionally filtered by projectId. */
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return client.get(`/executions${qs}`);
}

// PUBLIC_INTERFACE
export async function getExecution(client, executionId) {
  /** Fetch a single execution by id. */
  return client.get(`/executions/${encodeURIComponent(executionId)}`);
}

// PUBLIC_INTERFACE
export async function createExecution(client, execution) {
  /** Create a new execution. */
  return client.post("/executions", execution);
}

// PUBLIC_INTERFACE
export async function updateExecution(client, executionId, patch) {
  /** Update an existing execution. */
  return client.put(`/executions/${encodeURIComponent(executionId)}`, patch);
}

// PUBLIC_INTERFACE
export async function deleteExecution(client, executionId) {
  /** Delete an execution. */
  return client.del(`/executions/${encodeURIComponent(executionId)}`);
}
