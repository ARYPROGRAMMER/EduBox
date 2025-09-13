import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a message to a chat session
export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
    message: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    messageIndex: v.number(),
    attachments: v.optional(v.array(v.string())),
    context: v.optional(v.string()),
    tokens: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      userId: args.userId,
      message: args.message,
      role: args.role,
      messageIndex: args.messageIndex,
      attachments: args.attachments,
      context: args.context,
      tokens: args.tokens,
      model: args.model,
      timestamp: now,
      createdAt: now,
    });

    // Update the chat session's lastMessageAt timestamp
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastMessageAt: now,
        updatedAt: now,
      });
    }

    return messageId;
  },
});

// Get messages for a chat session
export const getMessages = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return messages;
  },
});

// Update a message
export const updateMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    userId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message || message.userId !== args.userId) {
      throw new Error("Message not found or access denied");
    }

    await ctx.db.patch(args.messageId, {
      message: args.message,
    });

    return args.messageId;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message || message.userId !== args.userId) {
      throw new Error("Message not found or access denied");
    }

    await ctx.db.delete(args.messageId);

    return { success: true };
  },
});

// Get recent chat activity for dashboard
export const getRecentChatActivity = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);

    return messages;
  },
});