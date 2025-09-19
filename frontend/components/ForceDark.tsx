"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface ForceDarkProps {
  children: React.ReactNode;
}

export default function ForceDark({ children }: ForceDarkProps) {
  const { setTheme } = useTheme();
  const previousThemeRef = useRef<string | null>(null);

  useEffect(() => {
    // Get the current theme before forcing dark
    const currentTheme = localStorage.getItem("edubox-theme") || "system";
    previousThemeRef.current = currentTheme;

    // Force dark theme for landing page
    setTheme("dark");

    // Hide horizontal overflow while landing page is mounted
    document.body.style.overflowX = "hidden";

    return () => {
      // Restore previous theme on unmount
      if (previousThemeRef.current) {
        setTheme(previousThemeRef.current);
      }
      // Clean up overflow setting on unmount
      document.body.style.overflowX = "";
    };
  }, [setTheme]);

  return <>{children}</>;
}
