import { v } from "convex/values";
import { query } from "./_generated/server";

// Global search across all user content
export const globalSearch = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, query: searchQuery, limit = 20 } = args;
    
    if (searchQuery.length < 2) {
      return {
        files: [],
        chatSessions: [],
        assignments: [],
        courses: [],
        events: [],
        totalResults: 0,
      };
    }

    const searchLower = searchQuery.toLowerCase();

    // Search files with improved matching
    const files = await ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          // Exact matches for file names
          q.eq(q.field("fileName"), searchQuery),
          q.eq(q.field("originalName"), searchQuery),
          // Contains matches (case-insensitive via toLowerCase)
          q.gte(q.field("fileName"), searchLower),
          q.gte(q.field("originalName"), searchLower),
          q.gte(q.field("description"), searchLower),
          q.gte(q.field("extractedText"), searchLower),
          q.gte(q.field("category"), searchLower),
          q.gte(q.field("subject"), searchLower)
        )
      )
      .filter((q) => q.neq(q.field("isArchived"), true)) // Exclude archived files
      .take(limit);

    // Search chat sessions
    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.gte(q.field("title"), searchLower)
      )
      .take(limit);

    // Search assignments
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.gte(q.field("title"), searchLower),
          q.gte(q.field("description"), searchLower)
        )
      )
      .take(limit);

    // Search courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.gte(q.field("courseCode"), searchLower),
          q.gte(q.field("courseName"), searchLower),
          q.gte(q.field("instructor"), searchLower)
        )
      )
      .take(limit);

    // Search events (including exams)
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.gte(q.field("title"), searchLower),
          q.gte(q.field("description"), searchLower),
          q.gte(q.field("location"), searchLower),
          q.gte(q.field("type"), searchLower)
        )
      )
      .take(limit);

    const totalResults = files.length + chatSessions.length + assignments.length + courses.length + events.length;

    return {
      files,
      chatSessions,
      assignments,
      courses,
      events,
      totalResults,
    };
  },
});

// Search within chat messages
export const searchChatMessages = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, query: searchQuery, limit = 10 } = args;
    
    if (searchQuery.length < 2) {
      return [];
    }

    const searchLower = searchQuery.toLowerCase();

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.gte(q.field("message"), searchLower)
      )
      .order("desc")
      .take(limit);

    return messages;
  },
});

// Get search suggestions
export const getSearchSuggestions = query({
  args: {
    userId: v.string(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, query: searchQuery } = args;
    
    if (searchQuery.length < 1) {
      return [];
    }

    const searchLower = searchQuery.toLowerCase();
    const suggestions: string[] = [];

    // Get file names and course names as suggestions
    const files = await ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(5);

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(5);

    // Add matching file names
    files.forEach((file) => {
      if (file.originalName.toLowerCase().includes(searchLower)) {
        suggestions.push(file.originalName);
      }
    });

    // Add matching course names
    courses.forEach((course) => {
      if (course.courseName.toLowerCase().includes(searchLower)) {
        suggestions.push(course.courseName);
      }
      if (course.courseCode.toLowerCase().includes(searchLower)) {
        suggestions.push(course.courseCode);
      }
    });

    return [...new Set(suggestions)].slice(0, 5);
  },
});