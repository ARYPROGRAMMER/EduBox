"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface DotPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
  [key: string]: any;
}

export function DotPattern({
  // increase density by reducing default spacing
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 0.9,
  className,
  ...props
}: DotPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          {/* subtle dot with currentColor so the caller can tune fill via className */}
          <circle
            id="pattern-circle"
            cx={cx}
            cy={cy}
            r={cr}
            fill="currentColor"
          />
        </pattern>
      </defs>
      {/* Use a very low-opacity default so it doesn't overpower hero content; className can override */}
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}
