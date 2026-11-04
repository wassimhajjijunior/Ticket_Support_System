"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentUser, getApiErrorMessage } from "./api";
import type { UserDto } from "./types";

interface CurrentUserValue {
  user: UserDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CurrentUserContext = createContext<CurrentUserValue>({
  user: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = requestId.current + 1;
    requestId.current = id;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCurrentUser();
      if (requestId.current === id) setUser(result);
    } catch (reason: unknown) {
      if (requestId.current === id) {
        setUser(null);
        setError(getApiErrorMessage(reason, "We couldn't load your profile."));
      }
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const value = useMemo(
    () => ({ user, loading, error, refresh: () => void load() }),
    [user, loading, error, load]
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserValue {
  return useContext(CurrentUserContext);
}
