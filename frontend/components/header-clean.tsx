"use client";

// This component is deprecated in favor of LandingHeader and DashboardHeader
// Keeping only for backward compatibility

import { LandingHeader } from "./landing-header";

interface HeaderProps {
  variant?: "landing" | "dashboard";
}

export function Header({ variant = "landing" }: HeaderProps) {
  // Redirect to the new LandingHeader component
  if (variant === "landing") {
    return <LandingHeader />;
  }

  // For dashboard variant, this is deprecated - use DashboardLayout instead
  return null;
}
