import React, { createContext, useContext, useMemo } from "react";
import { createApiClient } from "../createApiClient";
import { getDefaultApiConfig } from "../config";

const ApiClientContext = createContext(null);

// PUBLIC_INTERFACE
export function ApiClientProvider({ children, config }) {
  /** Provides a singleton API client instance (mock or real) to the React tree. */
  const merged = useMemo(() => ({ ...getDefaultApiConfig(), ...(config || {}) }), [config]);

  const client = useMemo(() => createApiClient(merged), [merged]);

  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useApiClient() {
  /** Hook to access the configured API client. */
  const client = useContext(ApiClientContext);
  if (!client) {
    // Safe fallback: create a default client (mock if no base URL).
    return createApiClient();
  }
  return client;
}
