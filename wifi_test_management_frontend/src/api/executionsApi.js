import { apiDelete, apiGet, apiPost, apiPut, isMockModeEnabled } from "./client";
import {
  mockCreateExecution,
  mockDeleteExecution,
  mockGetExecution,
  mockListExecutions,
  mockUpdateExecution,
} from "./mocks/store";

const BASE_PATH = "/executions";

// PUBLIC_INTERFACE
export const executionsApi = {
  /** Lists executions. Returns Promise<Execution[]> */
  list: async () => {
    if (isMockModeEnabled()) return mockListExecutions();
    return apiGet(BASE_PATH);
  },

  /** Gets an execution by id. Returns Promise<Execution> */
  get: async (id) => {
    if (isMockModeEnabled()) return mockGetExecution(id);
    return apiGet(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },

  /** Creates an execution. Returns Promise<Execution> */
  create: async (payload) => {
    if (isMockModeEnabled()) return mockCreateExecution(payload);
    return apiPost(BASE_PATH, payload);
  },

  /** Updates an execution. Returns Promise<Execution> */
  update: async (id, payload) => {
    if (isMockModeEnabled()) return mockUpdateExecution(id, payload);
    return apiPut(`${BASE_PATH}/${encodeURIComponent(id)}`, payload);
  },

  /** Deletes an execution. Returns Promise<{ok:true}|any> */
  delete: async (id) => {
    if (isMockModeEnabled()) return mockDeleteExecution(id);
    return apiDelete(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },
};

