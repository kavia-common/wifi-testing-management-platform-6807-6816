const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * A standardized error object returned by the API client helpers.
 *
 * Shape:
 *  - type: "http" | "network" | "timeout" | "parse" | "mock" | "unknown"
 *  - status?: number
 *  - message: string
 *  - details?: any
 *  - url?: string
 *  - method?: string
 *  - requestId?: string
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /**
   * Returns the base URL for backend API calls.
   * Uses REACT_APP_API_BASE first, then REACT_APP_BACKEND_URL, else empty string (relative).
   */
  const base =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim();

  // Normalize: remove trailing slashes so path joining is consistent.
  return base.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export function isMockModeEnabled() {
  /**
   * Determines whether API calls should use local mocks.
   *
   * Priority:
   *  1) localStorage "useMocks" if present (useful for toggling without rebuild)
   *  2) env var REACT_APP_USE_MOCKS (true/1/yes/on)
   */
  try {
    const ls = window?.localStorage?.getItem("useMocks");
    if (ls != null) return normalizeBool(ls);
  } catch {
    // ignore
  }

  return normalizeBool(process.env.REACT_APP_USE_MOCKS);
}

// PUBLIC_INTERFACE
export function setMockModeEnabled(enabled) {
  /**
   * Persists mock mode to localStorage so the app can be toggled without rebuild.
   */
  try {
    window?.localStorage?.setItem("useMocks", enabled ? "true" : "false");
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function clearMockModeOverride() {
  /** Clears the localStorage override so env-based behavior applies again. */
  try {
    window?.localStorage?.removeItem("useMocks");
  } catch {
    // ignore
  }
}

function normalizeBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function joinUrl(base, path) {
  if (!base) return path || "";
  const p = String(path || "");
  if (!p) return base;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  if (p.startsWith("/")) return `${base}${p}`;
  return `${base}/${p}`;
}

function toStandardError({ type, message, status, details, url, method, requestId }) {
  return {
    type: type || "unknown",
    status,
    message: message || "Request failed",
    details,
    url,
    method,
    requestId,
  };
}

async function parseJsonOrText(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  // For robustness, try JSON anyway if server forgot header.
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(method, path, { body, headers, query, timeoutMs } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = new URL(joinUrl(baseUrl, path), window.location.origin);

  // If we used a relative URL (baseUrl empty), URL() will have origin already.
  // If baseUrl is absolute, URL() resolves correctly too.

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v == null) return;
      url.searchParams.set(k, String(v));
    });
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);

  // Placeholder: add auth header when auth is implemented.
  const authToken = null; // e.g., from localStorage/session or context

  const finalHeaders = {
    Accept: "application/json",
    ...(body != null ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers || {}),
  };

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: finalHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "include", // safe default for future auth; can be changed per backend needs
    });

    const requestId =
      res.headers.get("x-request-id") ||
      res.headers.get("x-correlation-id") ||
      undefined;

    if (!res.ok) {
      let parsed = null;
      try {
        parsed = await parseJsonOrText(res);
      } catch (e) {
        throw toStandardError({
          type: "parse",
          status: res.status,
          message: `Failed to parse error response (${res.status})`,
          details: { error: String(e) },
          url: url.toString(),
          method,
          requestId,
        });
      }

      throw toStandardError({
        type: "http",
        status: res.status,
        message:
          (parsed && typeof parsed === "object" && parsed.message) ||
          res.statusText ||
          `HTTP ${res.status}`,
        details: parsed,
        url: url.toString(),
        method,
        requestId,
      });
    }

    // Some endpoints return 204 No Content
    if (res.status === 204) return null;

    return await parseJsonOrText(res);
  } catch (err) {
    if (err && typeof err === "object" && err.type) {
      // Already standardized (thrown above)
      throw err;
    }

    if (err?.name === "AbortError") {
      throw toStandardError({
        type: "timeout",
        message: "Request timed out",
        url: url.toString(),
        method,
      });
    }

    throw toStandardError({
      type: "network",
      message: "Network error",
      details: { error: String(err) },
      url: url.toString(),
      method,
    });
  } finally {
    clearTimeout(t);
  }
}

// PUBLIC_INTERFACE
export function apiGet(path, options) {
  /** Performs a GET request and returns parsed JSON (or text). */
  return request("GET", path, options);
}

// PUBLIC_INTERFACE
export function apiPost(path, body, options) {
  /** Performs a POST request with a JSON body and returns parsed JSON (or text). */
  return request("POST", path, { ...(options || {}), body });
}

// PUBLIC_INTERFACE
export function apiPut(path, body, options) {
  /** Performs a PUT request with a JSON body and returns parsed JSON (or text). */
  return request("PUT", path, { ...(options || {}), body });
}

// PUBLIC_INTERFACE
export function apiDelete(path, options) {
  /** Performs a DELETE request and returns parsed JSON (or null on 204). */
  return request("DELETE", path, options);
}

