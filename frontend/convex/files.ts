import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for file storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Store a new file with enhanced metadata
export const storeFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    originalName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    category: v.string(),
    courseId: v.optional(v.string()),
    subject: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const fileId = await ctx.db.insert("files", {
      userId: args.userId,
      storageId: args.storageId,
      fileName: args.fileName,
      originalName: args.originalName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      category: args.category,
      courseId: args.courseId,
      subject: args.subject,
      tags: args.tags,
      description: args.description,
      isPublic: false,
      isArchived: false,
      isFavorite: false,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return fileId;
  },
});

// Get all files for a user with optional filtering
export const getFiles = query({
  args: {
    userId: v.string(),
    category: v.optional(v.string()),
    courseId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.category && args.category !== "all") {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.courseId) {
      query = query.filter((q) => q.eq(q.field("courseId"), args.courseId));
    }

    query = query.filter((q) => q.neq(q.field("isArchived"), true));

    const files = await query.order("desc").take(args.limit || 50);

    // Get URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls;
  },
});

// Get a single file by ID
export const getFile = query({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      return null;
    }

    return {
      ...file,
      url: await ctx.storage.getUrl(file.storageId),
    };
  },
});

// Rename file
export const renameFile = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      throw new Error("File not found or access denied");
    }

    await ctx.db.patch(args.fileId, {
      originalName: args.newName,
      fileName: args.newName, // Update both names for consistency
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

// Update file metadata
export const updateFile = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
    updates: v.object({
      fileName: v.optional(v.string()),
      category: v.optional(v.string()),
      courseId: v.optional(v.string()),
      subject: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      description: v.optional(v.string()),
      isFavorite: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      throw new Error("File not found or access denied");
    }

    await ctx.db.patch(args.fileId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

// Delete file
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      throw new Error("File not found or access denied");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete from database
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});

// Archive file
export const archiveFile = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      throw new Error("File not found or access denied");
    }

    await ctx.db.patch(args.fileId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

// Toggle favorite status
export const toggleFavorite = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      throw new Error("File not found or access denied");
    }

    await ctx.db.patch(args.fileId, {
      isFavorite: !file.isFavorite,
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

// Update last accessed time
export const updateLastAccessed = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);

    if (!file || file.userId !== args.userId) {
      return;
    }

    await ctx.db.patch(args.fileId, {
      lastAccessedAt: Date.now(),
    });
  },
});

// Get file statistics for dashboard
export const getFileStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const allFiles = await ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    const totalFiles = allFiles.length;
    const totalSize = allFiles.reduce((sum, file) => sum + file.fileSize, 0);

    const categoryCounts = allFiles.reduce((acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentFiles = allFiles
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, 5);

    return {
      totalFiles,
      totalSize,
      categoryCounts,
      recentFiles: await Promise.all(
        recentFiles.map(async (file) => ({
          ...file,
          url: await ctx.storage.getUrl(file.storageId),
        }))
      ),
    };
  },
});

// Search files by text content (for future AI enhancement)
export const searchFiles = query({
  args: {
    userId: v.string(),
    searchQuery: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.category && args.category !== "all") {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    const files = await query
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    // Simple text search in filename and description
    const searchTerm = args.searchQuery.toLowerCase();
    const filteredFiles = files.filter(
      (file) =>
        file.fileName.toLowerCase().includes(searchTerm) ||
        file.originalName.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
    );

    const limitedFiles = filteredFiles
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, args.limit || 20);

    return await Promise.all(
      limitedFiles.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );
  },
});
