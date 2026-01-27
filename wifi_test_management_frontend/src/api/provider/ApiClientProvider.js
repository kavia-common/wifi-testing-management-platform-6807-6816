import React, { createContext, useContext, useMemo } from "react";
import { createApiClient } from "../createApiClient";
import { getDefaultApiConfig } from "../config";

const ApiClientContext = createContext(null);

/**
 * Context value shape:
 * {
 *   client: { get, post, put, del },
 *   config: { baseUrl, useMock, modeLabel, timeoutMs }
 * }
 */

// PUBLIC_INTERFACE
export function ApiClientProvider({ children, config }) {
  /** Provides a singleton API client instance (mock or real) to the React tree. */
  const merged = useMemo(
    () => ({ ...getDefaultApiConfig(), ...(config || {}) }),
    [config]
  );

  const client = useMemo(() => createApiClient(merged), [merged]);

  const value = useMemo(() => ({ client, config: merged }), [client, merged]);

  return (
    <ApiClientContext.Provider value={value}>{children}</ApiClientContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useApiClient() {
  /** Hook to access the configured API client. (Back-compat: returns only the client.) */
  const ctx = useContext(ApiClientContext);
  if (!ctx || !ctx.client) {
    // Safe fallback: create a default client (mock if no base URL).
    return createApiClient();
  }
  return ctx.client;
}

// PUBLIC_INTERFACE
export function useApi() {
  /** Hook to access { client, config } from ApiClientProvider. */
  const ctx = useContext(ApiClientContext);
  if (!ctx) {
    const fallbackConfig = getDefaultApiConfig();
    return { client: createApiClient(fallbackConfig), config: fallbackConfig };
  }
  return ctx;
}
