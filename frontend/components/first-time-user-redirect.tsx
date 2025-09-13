"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useConvexUser } from "@/hooks/use-convex-user";

export function FirstTimeUserRedirect() {
  const { user: convexUser, clerkUser } = useConvexUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (convexUser && clerkUser && pathname !== "/dashboard/profile") {
      // Check if the user has completed their profile
      const isProfileComplete = 
        convexUser.studentId && 
        convexUser.institution && 
        convexUser.major && 
        convexUser.year;

      if (!isProfileComplete) {
        // Only redirect if we're not already on the profile page
        router.push("/dashboard/profile");
      }
    }
  }, [convexUser, clerkUser, router, pathname]);

  return null; // This component doesn't render anything
}