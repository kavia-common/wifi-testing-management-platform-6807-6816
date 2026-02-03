const STORAGE_KEY = "wifiTestMgmt.useMockImports.v1";

function normalizeBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

// PUBLIC_INTERFACE
export function isMockImportEnabled() {
  /** Returns whether TestPlan imports should be persisted/used in mock mode (localStorage-backed). */
  try {
    const raw = window?.localStorage?.getItem(STORAGE_KEY);
    if (raw == null) return true; // default on
    return normalizeBool(raw);
  } catch {
    return true;
  }
}

// PUBLIC_INTERFACE
export function setMockImportEnabled(enabled) {
  /** Persists the mock import toggle to localStorage so UI can enable/disable without rebuild. */
  try {
    window?.localStorage?.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // ignore
  }
}
