/**
 * API configuration helpers.
 *
 * IMPORTANT:
 * - No hard-coded backend URLs: base URL is read from env.
 * - Preference order: REACT_APP_API_BASE then REACT_APP_BACKEND_URL then "".
 */

import { getRuntimeApiMode } from "./runtimeMode";

// PUBLIC_INTERFACE
export function getDefaultApiConfig() {
  /** Returns default API configuration derived from environment and runtime flags. */
  const baseUrl =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "")
      .toString()
      .trim();

  // Runtime override: query param / localStorage / legacy window flag.
  const runtimeMode = getRuntimeApiMode(); // "mock" | "real" | null

  // If no base URL is configured, default to mock mode for a usable UI.
  // If runtimeMode is "real" but baseUrl is empty, we still must use mock.
  const useMock =
    runtimeMode === "mock" ? true : runtimeMode === "real" ? !baseUrl : !baseUrl;

  const modeLabel = useMock ? "mock" : "real";

  return {
    baseUrl,
    useMock,
    modeLabel,
    // Default request timeout. Keep conservative to avoid hanging UI.
    timeoutMs: 12_000,
  };
}
