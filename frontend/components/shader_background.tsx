"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";

const MeshGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.MeshGradient),
  { ssr: false, loading: () => null }
);

interface ShaderBackgroundProps {
  children: React.ReactNode;

  disableOnLowPower?: boolean;
}

function ShaderBackground({
  children,
  disableOnLowPower = true,
}: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mm) setPrefersReducedMotion(mm.matches);
    const handle = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    try {
      mm?.addEventListener?.("change", handle);
    } catch (e) {
      mm?.addListener?.(handle as any);
    }
    return () => {
      try {
        mm?.removeEventListener?.("change", handle);
      } catch (e) {
        mm?.removeListener?.(handle as any);
      }
    };
  }, []);

  const isLowEndDevice = useMemo(() => {
    try {
      const deviceMemory = (navigator as any).deviceMemory ?? 4;
      const hw = navigator.hardwareConcurrency ?? 4;
      return deviceMemory <= 1 || hw <= 1;
    } catch (e) {
      return false;
    }
  }, []);

  const shouldRenderShaders = useMemo(() => {
    if (prefersReducedMotion) return false;
    if (disableOnLowPower && isLowEndDevice) return false;

    return typeof window !== "undefined";
  }, [prefersReducedMotion, disableOnLowPower, isLowEndDevice]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-transparent relative overflow-hidden"
    >
      {/* SVG Filters (defs only, inexpensive as long as not applied repeatedly) */}
      <svg className="absolute inset-0 w-0 h-0" aria-hidden>
        <defs>
          <filter
            id="glass-effect"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter
            id="gooey-filter"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Background Shaders - only render when it's reasonable to do so */}
      {shouldRenderShaders ? (
        <>
          <MeshGradient
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ willChange: "opacity, transform" }}
            colors={["#000000", "#8b5cf6", "#ffffff", "#1e1b4b", "#4c1d95"]}
            speed={0.18}
          />

          {/* Render the secondary/overlay shader only when user is interacting to
              reduce continuous GPU work. */}
          {/* {isActive && (
            <MeshGradient
              className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
              style={{ willChange: "opacity" }}
              colors={["#000000", "#ffffff", "#8b5cf6", "#000000"]}
              speed={0.12}
            />
          )} */}
        </>
      ) : null}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

const Memoized = React.memo(ShaderBackground);
Memoized.displayName = "ShaderBackground";
export default Memoized;
