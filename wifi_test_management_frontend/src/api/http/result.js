/**
 * Standard result format for API calls.
 *
 * We avoid throwing for HTTP errors so the UI can render consistent errors.
 */

// PUBLIC_INTERFACE
export function ok(data, meta = {}) {
  /** Build an ok result object. */
  return { ok: true, data, ...meta };
}

// PUBLIC_INTERFACE
export function err({ status = 0, message = "Request failed", details } = {}) {
  /** Build an error result object. */
  return { ok: false, status, message, ...(details ? { details } : {}) };
}
