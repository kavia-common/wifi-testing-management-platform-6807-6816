import { err, ok } from "./result";

/**
 * Low-level HTTP client built on fetch.
 * - Handles JSON request/response
 * - Supports timeouts via AbortController
 * - Returns standardized result objects (never throws for HTTP errors)
 */

// PUBLIC_INTERFACE
export function createFetchClient({ baseUrl = "", timeoutMs = 12000 } = {}) {
  /** Creates a fetch-based client implementing get/post/put/del methods. */

  const normalizedBase = (baseUrl || "").toString().replace(/\/+$/, "");

  async function request(method, path, { body, headers, signal } = {}) {
    const url =
      path.startsWith("http://") || path.startsWith("https://")
        ? path
        : `${normalizedBase}${path.startsWith("/") ? "" : "/"}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // If caller supplies a signal, abort our request when theirs aborts too.
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }

    const hasBody = body !== undefined && body !== null;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
          ...(headers || {}),
        },
        body: hasBody ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const isJson = contentType.includes("application/json");

      let payload;
      try {
        payload = isJson ? await res.json() : await res.text();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        // Standardize 4xx/5xx into { ok:false, status, message }
        const message =
          (payload &&
            typeof payload === "object" &&
            (payload.message || payload.error)) ||
          (typeof payload === "string" && payload) ||
          res.statusText ||
          `HTTP ${res.status}`;

        return err({
          status: res.status,
          message,
          details: payload,
        });
      }

      return ok(payload, { status: res.status });
    } catch (e) {
      const isAbort = e && (e.name === "AbortError" || e.code === "ABORT_ERR");
      return err({
        status: 0,
        message: isAbort ? "Request timed out" : e?.message || "Network error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    // PUBLIC_INTERFACE
    async get(path, options) {
      /** HTTP GET returning a standardized result object. */
      return request("GET", path, options);
    },

    // PUBLIC_INTERFACE
    async post(path, body, options = {}) {
      /** HTTP POST returning a standardized result object. */
      return request("POST", path, { ...options, body });
    },

    // PUBLIC_INTERFACE
    async put(path, body, options = {}) {
      /** HTTP PUT returning a standardized result object. */
      return request("PUT", path, { ...options, body });
    },

    // PUBLIC_INTERFACE
    async del(path, options) {
      /** HTTP DELETE returning a standardized result object. */
      return request("DELETE", path, options);
    },
  };
}
