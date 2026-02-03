import { useCallback, useEffect, useRef, useState } from "react";

// PUBLIC_INTERFACE
export function useApiRequest(asyncFn, deps = [], { immediate = true, initialData = null } = {}) {
  /**
   * Small utility hook to standardize loading/error/data state for an async API call.
   *
   * Usage:
   *  const { data, loading, error, run, reset } = useApiRequest(() => projectsApi.list(), [], { immediate: true });
   */
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      if (!mountedRef.current) return result;
      setData(result);
      return result;
    } catch (e) {
      if (!mountedRef.current) throw e;
      setError(e);
      throw e;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  useEffect(() => {
    if (!immediate) return;
    run().catch(() => {
      // Error is already stored in state; suppress unhandled promise.
    });
  }, [immediate, run]);

  return { data, loading, error, run, reset, setData };
}

