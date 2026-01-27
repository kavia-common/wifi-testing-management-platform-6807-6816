/**
 * Projects API endpoints.
 *
 * All functions return:
 *  - { ok: true, data, status? }
 *  - { ok: false, status, message, details? }
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string=} description
 * @property {string=} status
 * @property {string=} createdAt
 * @property {string=} updatedAt
 */

// PUBLIC_INTERFACE
export async function listProjects(client) {
  /** Fetch all projects. */
  return client.get("/projects");
}

// PUBLIC_INTERFACE
export async function getProject(client, projectId) {
  /** Fetch a single project by id. */
  return client.get(`/projects/${encodeURIComponent(projectId)}`);
}

// PUBLIC_INTERFACE
export async function createProject(client, project) {
  /** Create a new project. */
  return client.post("/projects", project);
}

// PUBLIC_INTERFACE
export async function updateProject(client, projectId, patch) {
  /** Update an existing project. */
  return client.put(`/projects/${encodeURIComponent(projectId)}`, patch);
}

// PUBLIC_INTERFACE
export async function deleteProject(client, projectId) {
  /** Delete a project. */
  return client.del(`/projects/${encodeURIComponent(projectId)}`);
}
