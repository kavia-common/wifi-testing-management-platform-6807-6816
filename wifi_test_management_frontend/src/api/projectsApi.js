import { apiDelete, apiGet, apiPost, apiPut, isMockModeEnabled } from "./client";
import {
  mockCreateProject,
  mockDeleteProject,
  mockGetProject,
  mockListProjects,
  mockUpdateProject,
} from "./mocks/store";

const BASE_PATH = "/projects";

// PUBLIC_INTERFACE
export const projectsApi = {
  /** Lists projects. Returns Promise<Project[]> */
  list: async () => {
    if (isMockModeEnabled()) return mockListProjects();
    return apiGet(BASE_PATH);
  },

  /** Gets a project by id. Returns Promise<Project> */
  get: async (id) => {
    if (isMockModeEnabled()) return mockGetProject(id);
    return apiGet(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },

  /** Creates a project. Returns Promise<Project> */
  create: async (payload) => {
    if (isMockModeEnabled()) return mockCreateProject(payload);
    return apiPost(BASE_PATH, payload);
  },

  /** Updates a project. Returns Promise<Project> */
  update: async (id, payload) => {
    if (isMockModeEnabled()) return mockUpdateProject(id, payload);
    return apiPut(`${BASE_PATH}/${encodeURIComponent(id)}`, payload);
  },

  /** Deletes a project. Returns Promise<{ok:true}|any> */
  delete: async (id) => {
    if (isMockModeEnabled()) return mockDeleteProject(id);
    return apiDelete(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },
};

