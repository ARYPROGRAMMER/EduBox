import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const createAiContent = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    contentType: v.optional(v.string()),
    prompt: v.optional(v.string()),
    generatedText: v.string(),
    model: v.optional(v.string()),
    tokens: v.optional(v.number()),
    usage: v.optional(
      v.object({
        totalTokens: v.optional(v.number()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
      })
    ),
    metadata: v.optional(v.object({ rawOptions: v.optional(v.string()) })),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("ai_content", {
      userId: args.userId,
      title: args.title,
      contentType: args.contentType,
      prompt: args.prompt,
      generatedText: args.generatedText,
      model: args.model,
      tokens: args.tokens,
      usage: args.usage,
      metadata: args.metadata,
      visibility: args.visibility || "private",
      createdAt: now,
      updatedAt: now,
    });

    // #codebase: Create notification for AI content generation completion
    // Dismiss any previous AI content generation notifications to avoid spam
    await ctx.runMutation(api.notifications.dismissNotificationsByRelatedId, {
      userId: args.userId,
      relatedId: `ai_content_${args.userId}`,
      relatedType: "ai_content_generation",
    });

    // Create completion notification
    await ctx.runMutation(api.notifications.createNotification, {
      userId: args.userId,
      title: "AI Content Generated",
      message: `Your ${args.contentType || "AI content"} "${
        args.title || "Generated Content"
      }" is ready!`,
      type: "ai_content_generated",
      priority: "medium",
      relatedId: id,
      relatedType: "ai_content",
      actionUrl: "/dashboard/ai-content-generation",
      actionLabel: "View Content",
    });

    return id;
  },
});

export const updateAiContent = mutation({
  args: {
    id: v.id("ai_content"),
    title: v.optional(v.string()),
    contentType: v.optional(v.string()),
    prompt: v.optional(v.string()),
    generatedText: v.string(),
    model: v.optional(v.string()),
    tokens: v.optional(v.number()),
    usage: v.optional(
      v.object({
        totalTokens: v.optional(v.number()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
      })
    ),
    metadata: v.optional(v.object({ rawOptions: v.optional(v.string()) })),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      title: args.title,
      contentType: args.contentType,
      prompt: args.prompt,
      generatedText: args.generatedText,
      model: args.model,
      tokens: args.tokens,
      usage: args.usage,
      metadata: args.metadata,
      visibility: args.visibility || "private",
      updatedAt: now,
    });

    return args.id;
  },
});

export const getAiContentByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    refreshKey: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("ai_content")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc");
    const results = args.limit ? await q.take(args.limit) : await q.collect();
    return results;
  },
});

export const countAiContentToday = query({
  args: { userId: v.string(), refreshKey: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Count ai_content for the user where createdAt >= start of today's UTC midnight
    const now = Date.now();
    const d = new Date(now);
    const startOfDay = Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    );

    const q = ctx.db
      .query("ai_content")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc");
    const all = await q.collect();
    let count = 0;
    for (const row of all) {
      if (row.createdAt >= startOfDay) count++;
    }
    return count;
  },
});
