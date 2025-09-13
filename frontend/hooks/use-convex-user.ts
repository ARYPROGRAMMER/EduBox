"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export function useConvexUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Get the user from Convex database
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    
    // Create or update user in Convex when they sign in or user data changes
    const initializeUser = async () => {
      try {
        await createOrUpdateUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          fullName: user.fullName || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profileImage: user.imageUrl || "",
        });
      } catch (error) {
        console.error("Failed to create/update user:", error);
      }
    };

    initializeUser();
  }, [isLoaded, isSignedIn, user, createOrUpdateUser, user?.updatedAt]); // Added user.updatedAt to trigger updates

  return {
    user: convexUser,
    isLoading: !isLoaded || (isSignedIn && !convexUser),
    clerkUser: user,
  };
}