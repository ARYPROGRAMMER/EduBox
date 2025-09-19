import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new campus life event
export const createCampusEvent = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    organizer: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const eventId = await ctx.db.insert("campusLife", {
      title: args.title,
      category: args.category,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      organizer: args.organizer,
      contactInfo: args.contactInfo,
      capacity: args.capacity,
      isActive: true,
      isPublic: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });

    return eventId;
  },
});

// Get all campus events
export const getCampusEvents = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events;

    if (args.category) {
      events = await ctx.db
        .query("campusLife")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      events = await ctx.db
        .query("campusLife")
        .order("desc")
        .take(args.limit || 50);
    }

    return events;
  },
});

// Get upcoming campus events
export const getUpcomingCampusEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const events = await ctx.db
      .query("campusLife")
      .withIndex("by_start_time")
      .order("asc")
      .take(args.limit || 20);

    return events.filter(event => 
      event.startTime && event.startTime >= now && event.isActive
    );
  },
});

// Update campus event
export const updateCampusEvent = mutation({
  args: {
    eventId: v.id("campusLife"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    organizer: v.optional(v.string()),
    capacity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    await ctx.db.patch(eventId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return eventId;
  },
});

// Delete campus event
export const deleteCampusEvent = mutation({
  args: {
    eventId: v.id("campusLife"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Campus event not found");
    }

    // Delete associated notifications for all users
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("relatedId"), args.eventId))
      .filter((q) => q.eq(q.field("relatedType"), "campus-event"))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    await ctx.db.delete(args.eventId);
    return true;
  },
});

// Get dining menu for today
export const getTodayMenu = query({
  args: {},
  handler: async (ctx, args) => {
    const diningEvents = await ctx.db
      .query("campusLife")
      .withIndex("by_category", (q) => q.eq("category", "dining"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(50);

    return diningEvents;
  },
});

// Get dining venues/cafeterias
export const getDiningVenues = query({
  args: {},
  handler: async (ctx, args) => {
    const venues = await ctx.db
      .query("campusLife")
      .withIndex("by_category", (q) => q.eq("category", "facility"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(20);

    return venues.filter(venue => 
      venue.title.toLowerCase().includes('cafeteria') || 
      venue.title.toLowerCase().includes('dining') ||
      venue.title.toLowerCase().includes('restaurant') ||
      venue.title.toLowerCase().includes('cafe')
    );
  },
});

// Create dining menu item
export const createDiningItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    menu: v.optional(v.array(v.object({
      item: v.string(),
      price: v.optional(v.number()),
      dietary: v.optional(v.array(v.string())),
    }))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const itemId = await ctx.db.insert("campusLife", {
      title: args.title,
      description: args.description,
      category: "dining",
      location: args.location,
      menu: args.menu,
      isActive: true,
      isPublic: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });

    return itemId;
  },
});