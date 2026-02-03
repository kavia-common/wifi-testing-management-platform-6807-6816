import { apiDelete, apiGet, apiPost, apiPut, isMockModeEnabled } from "./client";
import {
  mockCreateResult,
  mockDeleteResult,
  mockGetResult,
  mockListResults,
  mockUpdateResult,
} from "./mocks/store";

const BASE_PATH = "/results";

// PUBLIC_INTERFACE
export const resultsApi = {
  /** Lists results. Returns Promise<Result[]> */
  list: async () => {
    if (isMockModeEnabled()) return mockListResults();
    return apiGet(BASE_PATH);
  },

  /** Gets a result by id. Returns Promise<Result> */
  get: async (id) => {
    if (isMockModeEnabled()) return mockGetResult(id);
    return apiGet(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },

  /** Creates a result. Returns Promise<Result> */
  create: async (payload) => {
    if (isMockModeEnabled()) return mockCreateResult(payload);
    return apiPost(BASE_PATH, payload);
  },

  /** Updates a result. Returns Promise<Result> */
  update: async (id, payload) => {
    if (isMockModeEnabled()) return mockUpdateResult(id, payload);
    return apiPut(`${BASE_PATH}/${encodeURIComponent(id)}`, payload);
  },

  /** Deletes a result. Returns Promise<{ok:true}|any> */
  delete: async (id) => {
    if (isMockModeEnabled()) return mockDeleteResult(id);
    return apiDelete(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },
};

