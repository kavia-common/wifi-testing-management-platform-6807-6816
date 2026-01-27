/**
 * Test Cases API endpoints.
 *
 * All functions return:
 *  - { ok: true, data, status? }
 *  - { ok: false, status, message, details? }
 */

/**
 * @typedef {Object} TestCase
 * @property {string} id
 * @property {string} name
 * @property {string=} projectId
 * @property {string[]=} tags
 * @property {string=} createdAt
 * @property {string=} updatedAt
 */

// PUBLIC_INTERFACE
export async function listTestCases(client, { projectId } = {}) {
  /** Fetch test cases, optionally filtered by projectId. */
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return client.get(`/test-cases${qs}`);
}

// PUBLIC_INTERFACE
export async function getTestCase(client, testCaseId) {
  /** Fetch a single test case by id. */
  return client.get(`/test-cases/${encodeURIComponent(testCaseId)}`);
}

// PUBLIC_INTERFACE
export async function createTestCase(client, testCase) {
  /** Create a new test case. */
  return client.post("/test-cases", testCase);
}

// PUBLIC_INTERFACE
export async function updateTestCase(client, testCaseId, patch) {
  /** Update an existing test case. */
  return client.put(`/test-cases/${encodeURIComponent(testCaseId)}`, patch);
}

// PUBLIC_INTERFACE
export async function deleteTestCase(client, testCaseId) {
  /** Delete a test case. */
  return client.del(`/test-cases/${encodeURIComponent(testCaseId)}`);
}
