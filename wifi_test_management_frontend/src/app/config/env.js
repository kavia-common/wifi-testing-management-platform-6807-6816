/**
 * Central environment/config access.
 * Only reads the env vars listed in the user instructions.
 */

// PUBLIC_INTERFACE
export function getEnvConfig() {
  /** Returns parsed frontend config from REACT_APP_* environment variables. */
  const rawFeatureFlags = process.env.REACT_APP_FEATURE_FLAGS || "";
  const featureFlags = rawFeatureFlags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Prefer REACT_APP_API_BASE if defined; fall back to REACT_APP_BACKEND_URL.
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";

  return {
    apiBase,
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || "",
    wsUrl: process.env.REACT_APP_WS_URL || "",
    nodeEnv: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development",
    logLevel: process.env.REACT_APP_LOG_LEVEL || "info",
    healthcheckPath: process.env.REACT_APP_HEALTHCHECK_PATH || "",
    enableSourceMaps: process.env.REACT_APP_ENABLE_SOURCE_MAPS,
    port: process.env.REACT_APP_PORT,
    trustProxy: process.env.REACT_APP_TRUST_PROXY,
    experimentsEnabled: process.env.REACT_APP_EXPERIMENTS_ENABLED === "true",
    nextTelemetryDisabled: process.env.REACT_APP_NEXT_TELEMETRY_DISABLED === "1",
    featureFlags,
    mockApiEnabled: featureFlags.includes("mockApi")
  };
}
