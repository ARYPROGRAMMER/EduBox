"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: BackgroundGradientProps) {
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500 will-change-transform",
          animate && "animate-tilt"
        )}
        style={{
          background:
            "linear-gradient(126deg, #a855f7, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)",
        }}
      />
      <div
        className={cn("relative bg-background z-[1] rounded-3xl", className)}
      >
        {children}
      </div>
    </div>
  );
}
