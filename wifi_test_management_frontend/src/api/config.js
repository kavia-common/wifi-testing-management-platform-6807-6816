/**
 * API configuration helpers.
 *
 * IMPORTANT:
 * - No hard-coded backend URLs: base URL is read from env.
 * - Preference order: REACT_APP_API_BASE then REACT_APP_BACKEND_URL then "".
 */

// PUBLIC_INTERFACE
export function getDefaultApiConfig() {
  /** Returns default API configuration derived from environment and runtime flags. */
  const baseUrl =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "")
      .toString()
      .trim();

  const mockFlag =
    typeof window !== "undefined" && window.__USE_MOCK_API__ === true;

  // If no base URL is configured, default to mock mode for a usable UI.
  const useMock = mockFlag || !baseUrl;

  return {
    baseUrl,
    useMock,
    // Default request timeout. Keep conservative to avoid hanging UI.
    timeoutMs: 12_000,
  };
}
