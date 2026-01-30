/**
 * API configuration helpers.
 *
 * IMPORTANT:
 * - No hard-coded backend URLs: base URL is read from env.
 * - Preference order: REACT_APP_API_BASE_URL -> REACT_APP_API_BASE -> REACT_APP_BACKEND_URL -> "".
 * - Mock decision can be forced by REACT_APP_FEATURE_FLAGS including "mockApi".
 */

import { getRuntimeApiMode } from "./runtimeMode";

function parseFeatureFlags(raw) {
  const v = (raw ?? "").toString().trim();
  if (!v) return [];
  // support: "mockApi" or "a,b,c" or "a b c"
  return v
    .split(/[,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

// PUBLIC_INTERFACE
export function getDefaultApiConfig() {
  /** Returns default API configuration derived from environment and runtime flags. */

  // ✅ No fallback to localhost here (otherwise !baseUrl is never true).
  const baseUrl =
    (process.env.REACT_APP_API_BASE_URL ||
      process.env.REACT_APP_API_BASE ||
      process.env.REACT_APP_BACKEND_URL ||
      "")
      .toString()
      .trim();

  const featureFlags = parseFeatureFlags(process.env.REACT_APP_FEATURE_FLAGS);
  const flagForcesMock = featureFlags.includes("mockApi");

  // Runtime override: query param / localStorage / legacy window flag.
  const runtimeMode = getRuntimeApiMode(); // "mock" | "real" | null

  // ✅ Decide mock:
  // 1) feature flag mockApi always wins
  // 2) runtimeMode=mock forces mock
  // 3) runtimeMode=real forces real only if baseUrl is present
  // 4) default: mock when baseUrl is empty; real when baseUrl exists
  const useMock =
    flagForcesMock
      ? true
      : runtimeMode === "mock"
        ? true
        : runtimeMode === "real"
          ? !baseUrl // if user insists real but no baseUrl, we must use mock
          : !baseUrl;

  const modeLabel = useMock ? "mock" : "real";

  return {
    baseUrl,
    useMock,
    modeLabel,
    timeoutMs: 12_000,
  };
}

