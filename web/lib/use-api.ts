"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "./api";

export interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * Tiny fetch-on-mount helper. Pass a memoised fetcher (useCallback) so the
 * request is not repeated on every render.
 *
 *   const load = useCallback(() => Promise.all([fetchStats(), fetchAllTickets()]), []);
 *   const { data, error, loading, refetch } = useApi(load);
 */
export function useApi<T>(fetcher: () => Promise<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetcherRef = useRef(fetcher);
  const requestId = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const run = useCallback(async () => {
    const id = requestId.current + 1;
    requestId.current = id;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      if (requestId.current === id) setData(result);
    } catch (reason: unknown) {
      if (requestId.current === id) setError(getApiErrorMessage(reason));
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run();
    return () => {
      requestId.current += 1;
    };
  }, [run]);

  return { data, error, loading, refetch: () => void run() };
}
