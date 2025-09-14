import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user notifications with pagination
export const getUserNotifications = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 20, includeArchived = false } = args;

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId));

    if (!includeArchived) {
      query = query.filter((q) => q.neq(q.field("isArchived"), true));
    }

    const notifications = await query
      .order("desc")
      .take(limit);

    return notifications;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    return unreadNotifications.length;
  },
});

// Create a new notification
export const createNotification = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    priority: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    actionUrl: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      priority: args.priority || "medium",
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      isRead: false,
      isArchived: false,
      scheduledFor: args.scheduledFor || now,
      expiresAt: args.expiresAt,
      actionUrl: args.actionUrl,
      actionLabel: args.actionLabel,
      createdAt: now,
      updatedAt: now,
    });

    return notificationId;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== args.userId) {
      throw new Error("Notification not found or access denied");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      updatedAt: Date.now(),
    });

    return args.notificationId;
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
          updatedAt: now,
        })
      )
    );

    return unreadNotifications.length;
  },
});

// Archive notification
export const archiveNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== args.userId) {
      throw new Error("Notification not found or access denied");
    }

    await ctx.db.patch(args.notificationId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return args.notificationId;
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== args.userId) {
      throw new Error("Notification not found or access denied");
    }

    await ctx.db.delete(args.notificationId);
    return args.notificationId;
  },
});

// Generate assignment reminders
export const generateAssignmentReminders = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000; // 24 hours
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000; // 3 days
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000; // 1 week

    // Get upcoming assignments
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("dueDate"), now),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    const notifications = [];

    for (const assignment of assignments) {
      const timeDiff = assignment.dueDate - now;
      
      // Check if we need to create reminders
      if (timeDiff <= oneDayFromNow && timeDiff > 0) {
        // 1 day reminder
        notifications.push({
          userId: args.userId,
          title: "Assignment Due Tomorrow!",
          message: `"${assignment.title}" is due tomorrow`,
          type: "assignment",
          priority: "high",
          relatedId: assignment._id,
          relatedType: "assignment",
          actionUrl: `/dashboard/planner`,
          actionLabel: "View Assignment",
        });
      } else if (timeDiff <= threeDaysFromNow && timeDiff > oneDayFromNow) {
        // 3 day reminder
        notifications.push({
          userId: args.userId,
          title: "Assignment Due Soon",
          message: `"${assignment.title}" is due in 3 days`,
          type: "assignment",
          priority: "medium",
          relatedId: assignment._id,
          relatedType: "assignment",
          actionUrl: `/dashboard/planner`,
          actionLabel: "View Assignment",
        });
      } else if (timeDiff <= oneWeekFromNow && timeDiff > threeDaysFromNow) {
        // 1 week reminder
        notifications.push({
          userId: args.userId,
          title: "Upcoming Assignment",
          message: `"${assignment.title}" is due in one week`,
          type: "assignment",
          priority: "low",
          relatedId: assignment._id,
          relatedType: "assignment",
          actionUrl: `/dashboard/planner`,
          actionLabel: "View Assignment",
        });
      }
    }

    // Create notifications
    const createdIds = [];
    for (const notification of notifications) {
      // Check if similar notification already exists
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_type", (q) => 
          q.eq("userId", args.userId).eq("type", "assignment")
        )
        .filter((q) => q.eq(q.field("relatedId"), notification.relatedId))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("notifications", {
          ...notification,
          isRead: false,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        });
        createdIds.push(id);
      }
    }

    return createdIds;
  },
});

// Generate study reminders based on user preferences
export const generateStudyReminders = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get user preferences
    const userPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!userPrefs?.notificationSettings?.studyReminders) {
      return [];
    }

    const studySettings = userPrefs.studySettings;
    if (!studySettings?.preferredStudyTimes) {
      return [];
    }

    const notifications = [];
    const today = new Date();
    
    // Generate study reminders for preferred times
    for (const timeStr of studySettings.preferredStudyTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const studyTime = new Date(today);
      studyTime.setHours(hours, minutes, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (studyTime.getTime() < now) {
        studyTime.setDate(studyTime.getDate() + 1);
      }

      notifications.push({
        userId: args.userId,
        title: "Study Time Reminder",
        message: `Time for your scheduled study session! Goal: ${studySettings.dailyStudyGoal}h today`,
        type: "study",
        priority: "medium",
        scheduledFor: studyTime.getTime(),
        actionUrl: `/dashboard/planner`,
        actionLabel: "Start Studying",
      });
    }

    // Create notifications
    const createdIds = [];
    for (const notification of notifications) {
      const id = await ctx.db.insert("notifications", {
        ...notification,
        isRead: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
      createdIds.push(id);
    }

    return createdIds;
  },
});

// Get notifications summary for dashboard
export const getNotificationsSummary = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .order("desc")
      .take(50);

    const unread = notifications.filter(n => !n.isRead);
    const today = notifications.filter(n => 
      n.createdAt > now - 24 * 60 * 60 * 1000
    );

    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: notifications.length,
      unread: unread.length,
      today: today.length,
      byType,
      recent: notifications.slice(0, 5),
    };
  },
});