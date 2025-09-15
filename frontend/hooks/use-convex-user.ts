"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";

export function useConvexUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Get the user from Convex database
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [localConvexUser, setLocalConvexUser] = useState<any | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Create or update user in Convex when they sign in or user data changes
    const initializeUser = async () => {
      try {
        const result = await createOrUpdateUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          fullName: user.fullName || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profileImage: user.imageUrl || "",
        });

        // If the mutation returned the user object, use it immediately to avoid waiting
        // for the query cache to update/stream back from the server. This prevents
        // needing a manual refresh for downstream redirects.
        if (result) {
          setLocalConvexUser(result as any);
        }
      } catch (error) {
        console.error("Failed to create/update user:", error);
      }
    };

    initializeUser();
  }, [isLoaded, isSignedIn, user, createOrUpdateUser, user?.updatedAt]); // Added user.updatedAt to trigger updates

  return {
    // prefer the local optimistic user if present, otherwise the query result
    user: localConvexUser || convexUser,
    isLoading: !isLoaded || (isSignedIn && !convexUser && !localConvexUser),
    clerkUser: user,
  };
}
