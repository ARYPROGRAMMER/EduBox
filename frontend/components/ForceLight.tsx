"use client";

import { useEffect } from "react";

interface ForceLightProps {
  children: React.ReactNode;
}

export default function ForceLight({ children }: ForceLightProps) {
  useEffect(() => {
    const el = document.documentElement;

    // Save previous state to restore on unmount
    const prevClass = el.className;
    const prevColorScheme = el.style.colorScheme || "";

    // Ensure light class present and dark removed
    el.classList.remove("dark");
    if (!el.classList.contains("light")) el.classList.add("light");
    el.style.colorScheme = "light";

    // Watch for any attempts to re-add `dark` and remove it immediately
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          if (el.classList.contains("dark")) {
            el.classList.remove("dark");
            if (!el.classList.contains("light")) el.classList.add("light");
            el.style.colorScheme = "light";
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
    };
  }, []);

  return <>{children}</>;
}
