"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Loader } from "@/components/ui/loader";

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  setLoadingState: (isLoading: boolean, text?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");

  const showLoading = (text = "Loading...") => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const setLoadingState = (loading: boolean, text = "Loading...") => {
    setIsLoading(loading);
    if (loading) {
      setLoadingText(text);
    }
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingText,
        showLoading,
        hideLoading,
        setLoadingState,
      }}
    >
      {children}
      {isLoading && <Loader variant="overlay" text={loadingText} size="lg" />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

// Custom hook for API calls with loading
export function useAsyncOperation() {
  const { showLoading, hideLoading } = useLoading();

  const executeWithLoading = async <T,>(
    operation: () => Promise<T>,
    loadingText = "Loading..."
  ): Promise<T> => {
    try {
      showLoading(loadingText);
      const result = await operation();
      return result;
    } finally {
      hideLoading();
    }
  };

  return { executeWithLoading };
}
