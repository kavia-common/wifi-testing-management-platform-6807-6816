import { apiDelete, apiGet, apiPost, apiPut, isMockModeEnabled } from "./client";
import {
  mockCreateTestCase,
  mockDeleteTestCase,
  mockGetTestCase,
  mockListTestCases,
  mockUpdateTestCase,
} from "./mocks/store";

const BASE_PATH = "/test-cases";

// PUBLIC_INTERFACE
export const testCasesApi = {
  /** Lists test cases. Returns Promise<TestCase[]> */
  list: async () => {
    if (isMockModeEnabled()) return mockListTestCases();
    return apiGet(BASE_PATH);
  },

  /** Gets a test case by id. Returns Promise<TestCase> */
  get: async (id) => {
    if (isMockModeEnabled()) return mockGetTestCase(id);
    return apiGet(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },

  /** Creates a test case. Returns Promise<TestCase> */
  create: async (payload) => {
    if (isMockModeEnabled()) return mockCreateTestCase(payload);
    return apiPost(BASE_PATH, payload);
  },

  /** Updates a test case. Returns Promise<TestCase> */
  update: async (id, payload) => {
    if (isMockModeEnabled()) return mockUpdateTestCase(id, payload);
    return apiPut(`${BASE_PATH}/${encodeURIComponent(id)}`, payload);
  },

  /** Deletes a test case. Returns Promise<{ok:true}|any> */
  delete: async (id) => {
    if (isMockModeEnabled()) return mockDeleteTestCase(id);
    return apiDelete(`${BASE_PATH}/${encodeURIComponent(id)}`);
  },
};

