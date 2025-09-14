import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createGeneration = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    contentType: v.optional(v.string()),
    prompt: v.optional(v.string()),
    generatedText: v.string(),
    model: v.optional(v.string()),
    tokens: v.optional(v.number()),
    usage: v.optional(v.object({ totalTokens: v.optional(v.number()), promptTokens: v.optional(v.number()), completionTokens: v.optional(v.number()) })),
  // Allow a small metadata object with a rawOptions snapshot string to avoid rejecting
  // arbitrary nested client-side options when persisting.
  metadata: v.optional(v.object({ rawOptions: v.optional(v.string()) })),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("generations", {
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

    return id;
  },
});

export const getGenerationsByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const q = ctx.db.query("generations").withIndex("by_user_id", (q) => q.eq("userId", args.userId)).order("desc");
    const results = args.limit ? await q.take(args.limit) : await q.collect();
    return results;
  },
});
