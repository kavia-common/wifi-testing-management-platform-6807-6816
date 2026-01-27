import { useCallback, useState } from "react";

/**
 * Simple state helpers for loading + error handling.
 * These are UI-agnostic and can be reused across pages/components.
 */

// PUBLIC_INTERFACE
export function useAsyncState(initialData = null) {
  /** Provides { data, loading, error, setData, setError, setLoading }. */
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return { data, loading, error, setData, setError, setLoading };
}

// PUBLIC_INTERFACE
export function useAsyncCallback(asyncFn) {
  /**
   * Wrap an async function and expose { run, loading, error, data }.
   * Assumes asyncFn returns a standardized result object, but works with any promise.
   */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await asyncFn(...args);
        setData(res);
        return res;
      } catch (e) {
        const normalized = {
          ok: false,
          status: 0,
          message: e?.message || "Unexpected error",
        };
        setError(normalized);
        return normalized;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { run, loading, error, data };
}
