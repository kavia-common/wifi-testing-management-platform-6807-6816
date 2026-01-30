import { getDefaultApiConfig } from "./config";
import { createFetchClient } from "./http/fetchClient";
import { createMockAdapter } from "./mock/mockAdapter";

/**
 * API client factory.
 * - Picks mock adapter when enabled (window.__USE_MOCK_API__) or no base URL is configured.
 * - Otherwise uses fetch client pointing at baseUrl.
 */

// PUBLIC_INTERFACE
export function createApiClient(overrides = {}) {
  const defaults = getDefaultApiConfig();
  const config = { ...defaults, ...overrides };

  // ✅ mock 開關：mockApiEnabled 或 useMock 任一成立就走 mock
  if (config.mockApiEnabled === true || config.useMock === true) {
    return createMockAdapter();
  }

  return createFetchClient({
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
  });
}
