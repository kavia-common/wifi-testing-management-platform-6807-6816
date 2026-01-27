/**
 * Runtime API mode selection.
 *
 * Supported sources (highest precedence first):
 *  1) URL query param: ?api=mock | ?api=real (also accepts "1/0", "true/false")
 *     - If present, it is persisted into localStorage for subsequent reloads.
 *  2) localStorage: "wifi_tm_api_mode" = "mock" | "real"
 *  3) window global: window.__USE_MOCK_API__ === true
 *  4) Default decision in getDefaultApiConfig() (e.g., mock if no baseUrl)
 */

const STORAGE_KEY = "wifi_tm_api_mode";

function normalizeMode(value) {
  const v = (value ?? "").toString().trim().toLowerCase();
  if (!v) return null;

  if (v === "mock" || v === "m" || v === "1" || v === "true") return "mock";
  if (v === "real" || v === "backend" || v === "0" || v === "false")
    return "real";

  return null;
}

function readQueryMode() {
  try {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search || "");
    return normalizeMode(params.get("api"));
  } catch {
    return null;
  }
}

function readStoredMode() {
  try {
    if (typeof window === "undefined") return null;
    return normalizeMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredMode(mode) {
  try {
    if (typeof window === "undefined") return;
    if (!mode) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function getRuntimeApiMode() {
  /** Returns "mock" | "real" | null based on query/localStorage/window flags. */
  const queryMode = readQueryMode();
  if (queryMode) {
    // Persist the user's intent when the query param is used.
    writeStoredMode(queryMode);
    return queryMode;
  }

  const stored = readStoredMode();
  if (stored) return stored;

  // Backward compatibility with earlier docs.
  const legacy =
    typeof window !== "undefined" && window.__USE_MOCK_API__ === true
      ? "mock"
      : null;

  return legacy;
}

// PUBLIC_INTERFACE
export function setRuntimeApiMode(mode) {
  /** Sets the runtime mode in localStorage ("mock" | "real") and returns the stored mode. */
  const normalized = normalizeMode(mode);
  if (!normalized) {
    writeStoredMode(null);
    return null;
  }
  writeStoredMode(normalized);
  return normalized;
}

// PUBLIC_INTERFACE
export function clearRuntimeApiMode() {
  /** Clears the stored runtime mode override. */
  writeStoredMode(null);
}
