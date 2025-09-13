"use client";

import { useConvexUser } from "@/hooks/use-convex-user";

interface UserInitializerProps {
  children: React.ReactNode;
}

export function UserInitializer({ children }: UserInitializerProps) {
  const { isLoading } = useConvexUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}