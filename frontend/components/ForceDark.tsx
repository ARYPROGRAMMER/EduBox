"use client";

import { useEffect } from "react";

interface ForceDarkProps {
  children: React.ReactNode;
}

export default function ForceDark({ children }: ForceDarkProps) {
  useEffect(() => {
    const el = document.documentElement;

    // Save previous state to restore on unmount
    const prevClass = el.className;
    const prevColorScheme = el.style.colorScheme || "";
    const body = document.body;
    const prevBodyOverflowX = body.style.overflowX || "";

    // Ensure dark class present and light removed
    if (!el.classList.contains("dark")) el.classList.add("dark");
    el.classList.remove("light");
    el.style.colorScheme = "dark";

    // Hide horizontal overflow while landing page is mounted to avoid horizontal scroll
    body.style.overflowX = "hidden";

    // Watch for any attempts to re-add `light` and remove it immediately
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          if (el.classList.contains("light")) {
            el.classList.remove("light");
            if (!el.classList.contains("dark")) el.classList.add("dark");
            el.style.colorScheme = "dark";
          }
        }
      }
    });

    obs.observe(el, { attributes: true, attributeFilter: ["class"] });

    return () => {
      obs.disconnect();
      // Restore previous values
      el.className = prevClass;
      el.style.colorScheme = prevColorScheme;
      body.style.overflowX = prevBodyOverflowX;
    };
  }, []);

  return <>{children}</>;
}
