"use client";

import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: "blue-purple" | "green-blue" | "orange-red" | "purple-pink";
}

export function GradientText({
  children,
  className,
  gradient = "blue-purple",
}: GradientTextProps) {
  const gradients = {
    "blue-purple":
      "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600",
    "green-blue": "bg-gradient-to-r from-green-500 via-teal-500 to-blue-500",
    "orange-red": "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500",
    "purple-pink": "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500",
  };

  return (
    <span
      className={cn(
        "bg-clip-text text-transparent animate-gradient-shift",
        gradients[gradient],
        className
      )}
    >
      {children}
    </span>
  );
}
