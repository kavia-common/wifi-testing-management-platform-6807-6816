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
  /** Creates an API client instance (mock or real) based on env + runtime flags. */
  const defaults = getDefaultApiConfig();
  const config = { ...defaults, ...overrides };

  if (config.useMock) {
    return createMockAdapter();
  }

  return createFetchClient({
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
  });
}
