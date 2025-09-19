"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface ForceLightProps {
  children: React.ReactNode;
}

export default function ForceLight({ children }: ForceLightProps) {
  const { setTheme } = useTheme();
  const previousThemeRef = useRef<string | null>(null);

  useEffect(() => {
    // Get the current theme before forcing light
    const currentTheme = localStorage.getItem("edubox-theme") || "system";
    previousThemeRef.current = currentTheme;

    // Force light theme
    setTheme("light");

    return () => {
      // Restore previous theme on unmount
      if (previousThemeRef.current) {
        setTheme(previousThemeRef.current);
      }
    };
  }, [setTheme]);

  return <>{children}</>;
}
