import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// College Schedule Queries
export const getCollegeSchedule = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collegeSchedule")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getCollegeScheduleByDay = query({
  args: { userId: v.string(), dayOfWeek: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collegeSchedule")
      .withIndex("by_user_and_day", (q) => 
        q.eq("userId", args.userId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();
  },
});

// Dining Schedule Queries
export const getDiningSchedule = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("diningSchedule")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getDiningScheduleByDay = query({
  args: { userId: v.string(), dayOfWeek: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("diningSchedule")
      .withIndex("by_user_and_day", (q) => 
        q.eq("userId", args.userId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();
  },
});

// Schedule Preferences Queries
export const getSchedulePreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schedulePreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// College Schedule Mutations
export const createCollegeScheduleItem = mutation({
  args: {
    userId: v.string(),
    subject: v.string(),
    code: v.optional(v.string()),
    instructor: v.optional(v.string()),
    location: v.optional(v.string()),
    dayOfWeek: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    duration: v.optional(v.number()),
    semester: v.optional(v.string()),
    credits: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("collegeSchedule", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCollegeScheduleItem = mutation({
  args: {
    id: v.id("collegeSchedule"),
    subject: v.optional(v.string()),
    code: v.optional(v.string()),
    instructor: v.optional(v.string()),
    location: v.optional(v.string()),
    dayOfWeek: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    semester: v.optional(v.string()),
    credits: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteCollegeScheduleItem = mutation({
  args: { id: v.id("collegeSchedule") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Dining Schedule Mutations
export const createDiningScheduleItem = mutation({
  args: {
    userId: v.string(),
    mealType: v.string(),
    location: v.optional(v.string()),
    dayOfWeek: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    specialNotes: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    reminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("diningSchedule", {
      ...args,
      isEnabled: args.isEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDiningScheduleItem = mutation({
  args: {
    id: v.id("diningSchedule"),
    mealType: v.optional(v.string()),
    location: v.optional(v.string()),
    dayOfWeek: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    specialNotes: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    reminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteDiningScheduleItem = mutation({
  args: { id: v.id("diningSchedule") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Batch operations for PDF imports
export const batchCreateCollegeSchedule = mutation({
  args: {
    userId: v.string(),
    scheduleItems: v.array(v.object({
      subject: v.string(),
      code: v.optional(v.string()),
      instructor: v.optional(v.string()),
      location: v.optional(v.string()),
      dayOfWeek: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.optional(v.number()),
      semester: v.optional(v.string()),
      credits: v.optional(v.number()),
      color: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const insertPromises = args.scheduleItems.map(item => 
      ctx.db.insert("collegeSchedule", {
        userId: args.userId,
        ...item,
        createdAt: now,
        updatedAt: now,
      })
    );
    return await Promise.all(insertPromises);
  },
});

export const batchCreateDiningSchedule = mutation({
  args: {
    userId: v.string(),
    scheduleItems: v.array(v.object({
      mealType: v.string(),
      location: v.optional(v.string()),
      dayOfWeek: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      specialNotes: v.optional(v.string()),
      isEnabled: v.optional(v.boolean()),
      reminderMinutes: v.optional(v.number()),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const insertPromises = args.scheduleItems.map(item => 
      ctx.db.insert("diningSchedule", {
        userId: args.userId,
        ...item,
        isEnabled: item.isEnabled ?? true,
        createdAt: now,
        updatedAt: now,
      })
    );
    return await Promise.all(insertPromises);
  },
});

// Schedule Preferences Mutations
export const createOrUpdateSchedulePreferences = mutation({
  args: {
    userId: v.string(),
    defaultMealCount: v.optional(v.number()),
    mealTypes: v.optional(v.array(v.string())),
    mealRemindersEnabled: v.optional(v.boolean()),
    defaultMealReminderMinutes: v.optional(v.number()),
    scheduleViewMode: v.optional(v.string()),
    classRemindersEnabled: v.optional(v.boolean()),
    defaultClassReminderMinutes: v.optional(v.number()),
    showDiningInCalendar: v.optional(v.boolean()),
    showClassesInCalendar: v.optional(v.boolean()),
    calendarStartTime: v.optional(v.string()),
    calendarEndTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...preferences } = args;
    const existing = await ctx.db
      .query("schedulePreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    
    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...preferences,
        updatedAt: now,
      });
    } else {
      return await ctx.db.insert("schedulePreferences", {
        userId,
        ...preferences,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Combined schedule view for calendar integration
export const getCombinedSchedule = query({
  args: { 
    userId: v.string(),
    includeClasses: v.optional(v.boolean()),
    includeDining: v.optional(v.boolean()),
    dayOfWeek: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, includeClasses = true, includeDining = true, dayOfWeek } = args;
    
    let collegeSchedule: any[] = [];
    let diningSchedule: any[] = [];

    if (includeClasses) {
      if (dayOfWeek) {
        collegeSchedule = await ctx.db
          .query("collegeSchedule")
          .withIndex("by_user_and_day", (q) => 
            q.eq("userId", userId).eq("dayOfWeek", dayOfWeek)
          )
          .collect();
      } else {
        collegeSchedule = await ctx.db
          .query("collegeSchedule")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .collect();
      }
    }

    if (includeDining) {
      if (dayOfWeek) {
        diningSchedule = await ctx.db
          .query("diningSchedule")
          .withIndex("by_user_and_day", (q) => 
            q.eq("userId", userId).eq("dayOfWeek", dayOfWeek)
          )
          .filter((q) => q.eq(q.field("isEnabled"), true))
          .collect();
      } else {
        diningSchedule = await ctx.db
          .query("diningSchedule")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .filter((q) => q.eq(q.field("isEnabled"), true))
          .collect();
      }
    }

    return {
      classes: collegeSchedule,
      dining: diningSchedule,
    };
  },
});