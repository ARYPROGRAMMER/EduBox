import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Create a new event
export const createEvent = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    isAllDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    type: v.string(),
    courseId: v.optional(v.string()),
    color: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    recurrencePattern: v.optional(v.string()),
    recurrenceEnd: v.optional(v.number()),
    reminders: v.optional(v.array(v.number())),
    // Meeting fields
    meetingLink: v.optional(v.string()),
    meetingPlatform: v.optional(v.string()),
    meetingId: v.optional(v.string()),
    meetingPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const eventId = await ctx.db.insert("events", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      isAllDay: args.isAllDay || false,
      location: args.location,
      type: args.type,
      courseId: args.courseId,
      color: args.color,
      isRecurring: args.isRecurring || false,
      recurrencePattern: args.recurrencePattern,
      recurrenceEnd: args.recurrenceEnd,
      reminders: args.reminders,
      // Meeting fields
      meetingLink: args.meetingLink,
      meetingPlatform: args.meetingPlatform,
      meetingId: args.meetingId,
      meetingPassword: args.meetingPassword,
      createdAt: now,
      updatedAt: now,
    });

    // #codebase: Create notification for event creation
    await ctx.runMutation(api.notifications.createNotification, {
      userId: args.userId,
      title: "Event Created",
      message: `"${args.title}" has been added to your schedule.`,
      type: "event_created",
      priority: "low",
      relatedId: eventId,
      relatedType: "event",
      actionUrl: "/dashboard/planner",
      actionLabel: "View Schedule",
    });

    return eventId;
  },
});

// Get all events for a user
export const getEvents = query({
  args: {
    userId: v.string(),
    type: v.optional(v.string()),
    courseId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.courseId) {
      query = query.filter((q) => q.eq(q.field("courseId"), args.courseId));
    }

    if (args.startDate && args.endDate) {
      query = query
        .filter((q) => q.gte(q.field("startTime"), args.startDate!))
        .filter((q) => q.lte(q.field("startTime"), args.endDate!));
    }

    const events = await query.order("asc").collect();
    return events;
  },
});

// Get upcoming events (next 7 days)
export const getUpcomingEvents = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("startTime"), now))
      .filter((q) => q.lte(q.field("startTime"), futureDate))
      .order("asc")
      .take(args.limit || 10);

    return events;
  },
});

// Get events for a specific date
export const getEventsForDate = query({
  args: {
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("startTime"), startOfDay))
      .filter((q) => q.lte(q.field("startTime"), endOfDay))
      .order("asc")
      .collect();

    return events;
  },
});

// Get a single event by ID
export const getEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event || event.userId !== args.userId) {
      return null;
    }

    return event;
  },
});

// Update event
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      startTime: v.optional(v.number()),
      endTime: v.optional(v.number()),
      isAllDay: v.optional(v.boolean()),
      location: v.optional(v.string()),
      type: v.optional(v.string()),
      courseId: v.optional(v.string()),
      color: v.optional(v.string()),
      isRecurring: v.optional(v.boolean()),
      recurrencePattern: v.optional(v.string()),
      recurrenceEnd: v.optional(v.number()),
      reminders: v.optional(v.array(v.number())),
      // Meeting fields
      meetingLink: v.optional(v.string()),
      meetingPlatform: v.optional(v.string()),
      meetingId: v.optional(v.string()),
      meetingPassword: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }

    await ctx.db.patch(args.eventId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.eventId;
  },
});

// Delete event
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }

    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

// Get event statistics
export const getEventStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const monthFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const upcomingThisWeek = allEvents.filter(
      (e) => e.startTime >= now && e.startTime <= weekFromNow
    );

    const upcomingThisMonth = allEvents.filter(
      (e) => e.startTime >= now && e.startTime <= monthFromNow
    );

    const eventsByType = allEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysEvents = allEvents.filter(
      (e) =>
        e.startTime >= todayStart.getTime() && e.startTime <= todayEnd.getTime()
    );

    return {
      total: allEvents.length,
      thisWeek: upcomingThisWeek.length,
      thisMonth: upcomingThisMonth.length,
      today: todaysEvents.length,
      byType: eventsByType,
      upcomingEvents: upcomingThisWeek.slice(0, 5),
    };
  },
});

// Get conflicting events (for scheduling validation)
export const getConflictingEvents = query({
  args: {
    userId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    excludeEventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    const events = await query
      .filter((q) => q.lt(q.field("startTime"), args.endTime))
      .filter((q) => q.gt(q.field("endTime"), args.startTime))
      .collect();

    // Exclude the event being updated if provided
    const conflictingEvents = args.excludeEventId
      ? events.filter((e) => e._id !== args.excludeEventId)
      : events;

    return conflictingEvents;
  },
});
