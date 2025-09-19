import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new assignment
export const createAssignment = mutation({
  args: {
    userId: v.string(),
    courseId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    assignedDate: v.optional(v.number()),
    priority: v.string(),
    maxPoints: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const assignmentId = await ctx.db.insert("assignments", {
      userId: args.userId,
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      assignedDate: args.assignedDate || now,
      status: "pending",
      priority: args.priority,
      maxPoints: args.maxPoints,
      estimatedHours: args.estimatedHours,
      attachments: args.attachments,
      reminderSent: false,
      createdAt: now,
      updatedAt: now,
    });

    return assignmentId;
  },
});

// Get all assignments for a user
export const getAssignments = query({
  args: {
    userId: v.string(),
    courseId: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.courseId) {
      query = query.filter((q) => q.eq(q.field("courseId"), args.courseId));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.priority) {
      query = query.filter((q) => q.eq(q.field("priority"), args.priority));
    }

    const assignments = await query.order("desc").take(args.limit || 50);

    return assignments;
  },
});

// Get upcoming assignments (due within next 7 days)
export const getUpcomingAssignments = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("dueDate"), now))
      .filter((q) => q.lt(q.field("dueDate"), futureDate))
      .filter((q) => q.neq(q.field("status"), "submitted"))
      .order("asc")
      .collect();

    return assignments;
  },
});

// Get overdue assignments
export const getOverdueAssignments = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.lt(q.field("dueDate"), now))
      .filter((q) => q.neq(q.field("status"), "submitted"))
      .filter((q) => q.neq(q.field("status"), "graded"))
      .collect();

    return assignments;
  },
});

// Mark overdue assignments (separate mutation)
export const markOverdueAssignments = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const overdueAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.lt(q.field("dueDate"), now))
      .filter((q) => q.neq(q.field("status"), "submitted"))
      .filter((q) => q.neq(q.field("status"), "graded"))
      .filter((q) => q.neq(q.field("status"), "overdue"))
      .collect();

    // Update overdue assignments
    for (const assignment of overdueAssignments) {
      await ctx.db.patch(assignment._id, {
        status: "overdue",
        updatedAt: Date.now(),
      });
    }

    return overdueAssignments.length;
  },
});

// Get a single assignment by ID
export const getAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment || assignment.userId !== args.userId) {
      return null;
    }

    return assignment;
  },
});

// Update assignment
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      status: v.optional(v.string()),
      priority: v.optional(v.string()),
      grade: v.optional(v.string()),
      maxPoints: v.optional(v.number()),
      earnedPoints: v.optional(v.number()),
      submittedDate: v.optional(v.number()),
      submissionFiles: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment || assignment.userId !== args.userId) {
      throw new Error("Assignment not found or access denied");
    }

    await ctx.db.patch(args.assignmentId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.assignmentId;
  },
});

// Submit assignment
export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    userId: v.string(),
    submissionFiles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment || assignment.userId !== args.userId) {
      throw new Error("Assignment not found or access denied");
    }

    await ctx.db.patch(args.assignmentId, {
      status: "submitted",
      submittedDate: Date.now(),
      submissionFiles: args.submissionFiles,
      updatedAt: Date.now(),
    });

    return args.assignmentId;
  },
});

// Delete assignment
export const deleteAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment || assignment.userId !== args.userId) {
      throw new Error("Assignment not found or access denied");
    }

    // Delete associated notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("relatedId"), args.assignmentId))
      .filter((q) => q.eq(q.field("relatedType"), "assignment"))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    await ctx.db.delete(args.assignmentId);
    return { success: true };
  },
});

// Get assignment statistics
export const getAssignmentStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();

    const pending = assignments.filter((a) => a.status === "pending");
    const submitted = assignments.filter((a) => a.status === "submitted");
    const graded = assignments.filter((a) => a.status === "graded");
    const overdue = assignments.filter(
      (a) =>
        a.dueDate < now && a.status !== "submitted" && a.status !== "graded"
    );

    const upcoming = assignments.filter(
      (a) =>
        a.dueDate > now &&
        a.dueDate < now + 7 * 24 * 60 * 60 * 1000 &&
        a.status !== "submitted"
    );

    // Calculate average grade
    const gradedWithPoints = graded.filter(
      (a) => a.earnedPoints !== undefined && a.maxPoints !== undefined
    );
    const averageGrade =
      gradedWithPoints.length > 0
        ? gradedWithPoints.reduce(
            (sum, a) => sum + (a.earnedPoints! / a.maxPoints!) * 100,
            0
          ) / gradedWithPoints.length
        : 0;

    return {
      total: assignments.length,
      pending: pending.length,
      submitted: submitted.length,
      graded: graded.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      averageGrade: Math.round(averageGrade * 100) / 100,
      upcomingList: upcoming.slice(0, 5),
    };
  },
});

// Mark assignment as read/unread for reminders
export const updateAssignmentReminder = mutation({
  args: {
    assignmentId: v.id("assignments"),
    userId: v.string(),
    reminderSent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment || assignment.userId !== args.userId) {
      throw new Error("Assignment not found or access denied");
    }

    await ctx.db.patch(args.assignmentId, {
      reminderSent: args.reminderSent,
      updatedAt: Date.now(),
    });

    return args.assignmentId;
  },
});
