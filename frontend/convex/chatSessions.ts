import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new chat session
export const createChatSession = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const chatSessionId = await ctx.db.insert("chatSessions", {
      userId: args.userId,
      sessionId: args.sessionId,
      title: args.title,
      lastMessageAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return chatSessionId;
  },
});

// Get a chat session by session ID
export const getChatSession = query({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    return session;
  },
});

// Get all chat sessions for a user (only sessions with messages)
export const getChatSessions = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Filter sessions to only include those with messages
    const sessionsWithMessages = [];
    for (const session of sessions) {
      const messageCount = await ctx.db
        .query("chatMessages")
        .withIndex("by_session_id", (q) => q.eq("sessionId", session.sessionId))
        .collect();
      
      if (messageCount.length > 0) {
        sessionsWithMessages.push(session);
      }
    }

    return sessionsWithMessages;
  },
});

// Update a chat session
export const updateSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      lastMessageAt: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!session) {
      throw new Error("Chat session not found");
    }

    await ctx.db.patch(session._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return session._id;
  },
});

// Delete a chat session
export const deleteSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!session) {
      throw new Error("Chat session not found");
    }

    await ctx.db.patch(session._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return session._id;
  },
});

// Delete multiple sessions and their messages
export const deleteSessions = mutation({
  args: {
    sessionIds: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For each sessionId, find session(s) for user and mark inactive and delete messages
    for (const sessionId of args.sessionIds) {
      const sessions = await ctx.db
        .query("chatSessions")
        .withIndex("by_session_id", (q) => q.eq("sessionId", sessionId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();

      for (const session of sessions) {
        // mark inactive
        await ctx.db.patch(session._id, { isActive: false, updatedAt: Date.now() });

        // delete messages belonging to this session
        const messages = await ctx.db
          .query("chatMessages")
          .withIndex("by_session_id", (q) => q.eq("sessionId", session.sessionId))
          .collect();

        for (const m of messages) {
          await ctx.db.delete(m._id);
        }
      }
    }

    return { success: true };
  },
});

// Delete all sessions and messages for a user
export const deleteAllSessions = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { isActive: false, updatedAt: Date.now() });

      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_session_id", (q) => q.eq("sessionId", session.sessionId))
        .collect();

      for (const m of messages) {
        await ctx.db.delete(m._id);
      }
    }

    return { success: true };
  },
});