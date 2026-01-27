/**
 * Central helper to surface API errors consistently to the UI.
 */

// PUBLIC_INTERFACE
export function notifyApiError(toast, result, fallbackTitle = "Request failed") {
  /** Pushes an error toast if the result is not ok. */
  if (!result || result.ok) return;

  toast.push({
    level: "error",
    title: fallbackTitle,
    message: result.message || `HTTP ${result.status || 0}`,
  });
}
