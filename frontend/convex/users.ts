import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user profile
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        fullName: args.fullName,
        firstName: args.firstName,
        lastName: args.lastName,
        profileImage: args.profileImage,
        updatedAt: now,
        lastLoginAt: now,
      });

      // Return the updated user object so the client can use it immediately
      const updated = await ctx.db.get(existingUser._id);
      return updated;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        fullName: args.fullName,
        firstName: args.firstName,
        lastName: args.lastName,
        profileImage: args.profileImage,
        theme: "system",
        notificationsEnabled: true,
        emailNotifications: true,
        planType: "free",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });

      // Create default user preferences
      await ctx.db.insert("userPreferences", {
        userId: userId,
        notificationSettings: {
          assignments: true,
          classes: true,
          campusEvents: true,
          weeklyDigest: true,
          studyReminders: true,
        },
        studySettings: {
          defaultStudyDuration: 60, // 1 hour
          breakDuration: 15, // 15 minutes
          dailyStudyGoal: 4, // 4 hours
          preferredStudyTimes: ["09:00", "14:00", "19:00"],
        },
        aiSettings: {
          personality: "encouraging",
          responseLength: "detailed",
          contextWindow: 10,
        },
        createdAt: now,
        updatedAt: now,
      });

      // Return the full user object after insert so the client can use it immediately
      const created = await ctx.db.get(userId);
      return created;
    }
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

// Get user profile with preferences
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    return {
      ...user,
      preferences,
    };
  },
});

// Update user academic information
export const updateAcademicInfo = mutation({
  args: {
    userId: v.id("users"),
    studentId: v.optional(v.string()),
    year: v.optional(v.string()),
    major: v.optional(v.string()),
    minor: v.optional(v.string()),
    gpa: v.optional(v.number()),
    institution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Update user personal information
export const updatePersonalInfo = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Also update fullName if firstName or lastName is provided
    const updateData: any = { ...updates, updatedAt: Date.now() };

    if (updates.firstName || updates.lastName) {
      const user = await ctx.db.get(userId);
      if (user) {
        const firstName = updates.firstName || user.firstName || "";
        const lastName = updates.lastName || user.lastName || "";
        updateData.fullName = `${firstName} ${lastName}`.trim();
      }
    }

    await ctx.db.patch(userId, updateData);

    return userId;
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      theme: v.optional(v.string()),
      timezone: v.optional(v.string()),
      notificationsEnabled: v.optional(v.boolean()),
      emailNotifications: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      ...args.preferences,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

// Update detailed user preferences
export const updateDetailedPreferences = mutation({
  args: {
    userId: v.string(),
    notificationSettings: v.optional(
      v.object({
        assignments: v.boolean(),
        classes: v.boolean(),
        campusEvents: v.boolean(),
        weeklyDigest: v.boolean(),
        studyReminders: v.boolean(),
      })
    ),
    studySettings: v.optional(
      v.object({
        defaultStudyDuration: v.number(),
        breakDuration: v.number(),
        dailyStudyGoal: v.number(),
        preferredStudyTimes: v.array(v.string()),
      })
    ),
    aiSettings: v.optional(
      v.object({
        personality: v.string(),
        responseLength: v.string(),
        contextWindow: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const updates = {
      notificationSettings: args.notificationSettings,
      studySettings: args.studySettings,
      aiSettings: args.aiSettings,
      updatedAt: Date.now(),
    };

    if (existingPrefs) {
      await ctx.db.patch(existingPrefs._id, updates);
      return existingPrefs._id;
    } else {
      const prefsId = await ctx.db.insert("userPreferences", {
        userId: args.userId,
        ...updates,
        createdAt: Date.now(),
      });
      return prefsId;
    }
  },
});

// Get user dashboard statistics
export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get course count
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get upcoming assignments
    const now = Date.now();
    const upcomingAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("dueDate"), now))
      .filter((q) => q.neq(q.field("status"), "submitted"))
      .order("asc")
      .take(10);

    // Get file count
    const files = await ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    // Calculate study streak (placeholder - would need more complex logic)
    const studyStreak = 24; // This would be calculated based on actual study sessions

    // Calculate GPA from courses
    const completedCourses = courses.filter((course) => course.grade);
    const gpa =
      completedCourses.length > 0
        ? completedCourses.reduce((sum, course) => {
            const gradePoint = convertGradeToPoint(course.grade || "");
            return sum + gradePoint;
          }, 0) / completedCourses.length
        : 0;

    return {
      activeCourses: courses.length,
      upcomingAssignments: upcomingAssignments.length,
      totalFiles: files.length,
      studyStreak,
      gpa: Math.round(gpa * 100) / 100,
      recentAssignments: upcomingAssignments.slice(0, 3),
    };
  },
});

// Helper function to convert letter grades to GPA points
function convertGradeToPoint(grade: string): number {
  const gradeMap: Record<string, number> = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  };
  return gradeMap[grade.toUpperCase()] || 0;
}

// Update last login time
export const updateLastLogin = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        lastLoginAt: Date.now(),
      });
    }
  },
});
