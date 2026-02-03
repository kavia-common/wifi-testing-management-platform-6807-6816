const STORAGE_KEY = "wifiTestMgmt.useMockImports.v1";

// Legacy/alternate keys that other builds or older versions may have used.
const LEGACY_STORAGE_KEYS = [
  "wifi.mockImportEnabled",
  "wifi.useMocks",
  // NOTE: "useMocks" is reserved for *API mock mode* (see api/client.js). We do NOT treat it
  // as a mock-import flag here. TestCasesPage separately checks isMockModeEnabled().
];

/**
 * Normalize various truthy string representations.
 * @param {any} v
 * @returns {boolean}
 */
function normalizeBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

/**
 * Reads the first present value among known keys, else returns null.
 * @returns {string|null}
 */
function readFirstKnownRawValue() {
  try {
    const primary = window?.localStorage?.getItem(STORAGE_KEY);
    if (primary != null) return primary;

    for (const k of LEGACY_STORAGE_KEYS) {
      const v = window?.localStorage?.getItem(k);
      if (v != null) return v;
    }
  } catch {
    // ignore
  }
  return null;
}

// PUBLIC_INTERFACE
export function isMockImportEnabled() {
  /** Returns whether TestPlan imports should be allowed (localStorage/env backed). */
  try {
    const raw = readFirstKnownRawValue();

    // Env fallback requested: if REACT_APP_USE_MOCKS === "true", treat mock-import as enabled.
    // (This is intentionally generous; localStorage can still explicitly disable it.)
    const envEnabled = normalizeBool(process.env.REACT_APP_USE_MOCKS);

    // Default behavior: enabled (so template works out-of-box) unless explicitly disabled.
    // If env enables it, it is also enabled.
    if (raw == null) return envEnabled || true;

    return (raw != null ? normalizeBool(raw) : true) || envEnabled;
  } catch {
    // If localStorage access is blocked, fall back to env; else default to enabled.
    return normalizeBool(process.env.REACT_APP_USE_MOCKS) || true;
  }
}

/**
 * Broadcast a local “settings changed” event so same-tab pages update immediately
 * (the native "storage" event only fires across tabs).
 */
function broadcastMockImportChange() {
  try {
    window?.dispatchEvent(new CustomEvent("wifiTestMgmt:mockImportChanged"));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function setMockImportEnabled(enabled) {
  /** Persists the mock import toggle to localStorage so UI can enable/disable without rebuild. */
  try {
    const value = enabled ? "true" : "false";

    // Write the canonical key.
    window?.localStorage?.setItem(STORAGE_KEY, value);

    // Also write legacy keys so older code paths (or external tooling) stay in sync.
    // This directly addresses issues where some pages read wifi.mockImportEnabled or wifi.useMocks.
    window?.localStorage?.setItem("wifi.mockImportEnabled", value);
    window?.localStorage?.setItem("wifi.useMocks", value);

    broadcastMockImportChange();
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function subscribeToMockImportChanges(callback) {
  /**
   * Subscribes to mock-import flag changes (both cross-tab storage updates and same-tab toggles).
   * Returns an unsubscribe function.
   */
  if (typeof callback !== "function") return () => {};

  const handler = (e) => {
    // If it's a storage event, only react to relevant keys.
    if (e?.type === "storage") {
      const k = e?.key;
      const relevant = k === STORAGE_KEY || LEGACY_STORAGE_KEYS.includes(k) || k === "wifi.mockImportEnabled";
      if (!relevant) return;
    }
    callback();
  };

  try {
    window?.addEventListener("storage", handler);
    window?.addEventListener("wifiTestMgmt:mockImportChanged", handler);
  } catch {
    // ignore
  }

  return () => {
    try {
      window?.removeEventListener("storage", handler);
      window?.removeEventListener("wifiTestMgmt:mockImportChanged", handler);
    } catch {
      // ignore
    }
  };
}

// PUBLIC_INTERFACE
export function getMockImportDebugInfo() {
  /**
   * Returns a small debug payload for UI status indicators.
   * Useful for showing *why* imports are enabled/disabled.
   */
  let primary = null;
  let legacyWifiMockImportEnabled = null;
  let legacyWifiUseMocks = null;
  let canonical = null;

  try {
    canonical = window?.localStorage?.getItem(STORAGE_KEY);
    legacyWifiMockImportEnabled = window?.localStorage?.getItem("wifi.mockImportEnabled");
    legacyWifiUseMocks = window?.localStorage?.getItem("wifi.useMocks");
    primary = readFirstKnownRawValue();
  } catch {
    // ignore
  }

  return {
    enabled: isMockImportEnabled(),
    envReactAppUseMocks: String(process.env.REACT_APP_USE_MOCKS ?? ""),
    keys: {
      [STORAGE_KEY]: canonical,
      "wifi.mockImportEnabled": legacyWifiMockImportEnabled,
      "wifi.useMocks": legacyWifiUseMocks,
    },
    primaryRawValue: primary,
  };
}
