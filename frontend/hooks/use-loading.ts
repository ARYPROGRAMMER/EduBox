"use client";

import { useState, useCallback } from "react";

interface UseLoadingOptions {
  initialState?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useLoadingState(options: UseLoadingOptions = {}) {
  const { initialState = false, onStart, onComplete, onError } = options;
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    onStart?.();
  }, [onStart]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    onComplete?.();
  }, [onComplete]);

  const setLoadingError = useCallback(
    (err: Error) => {
      setIsLoading(false);
      setError(err);
      onError?.(err);
    },
    [onError]
  );

  const executeAsync = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        startLoading();
        const result = await asyncFn();
        stopLoading();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setLoadingError(error);
        return null;
      }
    },
    [startLoading, stopLoading, setLoadingError]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    executeAsync,
    reset,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates,
  };
}

// Hook for debounced loading states (useful for search, etc.)
export function useDebouncedLoading(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);

  const setLoading = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);

      if (loading) {
        setDebouncedLoading(true);
      } else {
        setTimeout(() => {
          setDebouncedLoading(false);
        }, delay);
      }
    },
    [delay]
  );

  return {
    isLoading,
    debouncedLoading,
    setLoading,
  };
}
