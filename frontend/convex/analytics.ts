import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get analytics summary for a user over a period
export const getAnalyticsSummary = query({
  args: {
    userId: v.string(),
    periodDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - args.periodDays * 24 * 60 * 60 * 1000;

    // Get study sessions for the period
    const studySessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("startTime"), cutoffDate))
      .collect();

    // Calculate total study hours
    const totalStudyHours = studySessions.reduce((sum, session) => {
      return sum + (session.duration || 0) / 60;
    }, 0);

    // Get assignments for the period
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffDate))
      .collect();

    // Get courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      totalStudyHours: Math.round(totalStudyHours * 10) / 10,
      totalAssignments: assignments.length,
      totalCourses: courses.length,
      averageSessionLength:
        studySessions.length > 0 ? totalStudyHours / studySessions.length : 0,
      studySessionsCount: studySessions.length,
    };
  },
});

// Get study sessions for analytics
export const getStudySessions = query({
  args: {
    userId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lte(q.field("startTime"), args.endDate)
        )
      )
      .order("desc")
      .take(args.limit || 50);

    return sessions.map((session) => {
      const sAny: any = session;
      return {
        _id: sAny._id,
        startTime: sAny.startTime,
        duration: sAny.duration || 0,
        focusScore: sAny.focusScore || 70,
        subject: sAny.subject || sAny.title || "General Study",
        title: sAny.title || sAny.subject || "Study Session",
        description: sAny.description || "",
        completed: sAny.isCompleted || true,
        audioQueue: sAny.audioQueue || [],
      };
    });
  },
});

// Get grade history for analytics
export const getGradeHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("grade"), undefined))
      .order("desc")
      .take(args.limit || 50);

    return assignments.map((assignment) => ({
      _id: assignment._id,
      courseId: assignment.courseId || "Unknown Course",
      numericGrade: assignment.grade
        ? parseFloat(assignment.grade.toString())
        : 0,
      earnedPoints: assignment.grade
        ? parseFloat(assignment.grade.toString())
        : 0,
      maxPoints: 100, // Default max points
      submittedAt: assignment.submittedDate || assignment.createdAt,
      assignmentTitle: assignment.title,
    }));
  },
});

// Get user's academic analytics for a specific period
export const getAcademicAnalytics = query({
  args: {
    userId: v.string(),
    period: v.optional(v.string()),
    courseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("academicAnalytics")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => {
        let condition = q.eq(q.field("userId"), args.userId);
        if (args.period) {
          condition = q.and(condition, q.eq(q.field("period"), args.period));
        }
        if (args.courseId) {
          condition = q.and(
            condition,
            q.eq(q.field("courseId"), args.courseId)
          );
        }
        return condition;
      })
      .order("desc")
      .take(50);

    return analytics;
  },
});

// Create or update academic analytics
export const upsertAcademicAnalytics = mutation({
  args: {
    userId: v.string(),
    courseId: v.optional(v.string()),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    gpa: v.optional(v.number()),
    gradePoints: v.optional(v.number()),
    totalCredits: v.optional(v.number()),
    totalStudyHours: v.optional(v.number()),
    averageStudyHours: v.optional(v.number()),
    studySessionsCount: v.optional(v.number()),
    assignmentsCompleted: v.optional(v.number()),
    assignmentsTotal: v.optional(v.number()),
    averageGrade: v.optional(v.number()),
    onTimeSubmissions: v.optional(v.number()),
    classesAttended: v.optional(v.number()),
    totalClasses: v.optional(v.number()),
    attendanceRate: v.optional(v.number()),
    studyGoalHours: v.optional(v.number()),
    gpaTarget: v.optional(v.number()),
    completionTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("academicAnalytics")
      .withIndex("by_user_and_period", (q) =>
        q.eq("userId", args.userId).eq("period", args.period)
      )
      .filter((q) => {
        let condition = q.and(
          q.eq(q.field("periodStart"), args.periodStart),
          q.eq(q.field("periodEnd"), args.periodEnd)
        );
        if (args.courseId) {
          condition = q.and(
            condition,
            q.eq(q.field("courseId"), args.courseId)
          );
        }
        return condition;
      })
      .first();

    const now = Date.now();
    const data = {
      ...args,
      updatedAt: now,
    };

    if (existing) {
      return await ctx.db.patch(existing._id, data);
    } else {
      return await ctx.db.insert("academicAnalytics", {
        ...data,
        createdAt: now,
      });
    }
  },
});

// Create a new study session
export const createStudySession = mutation({
  args: {
    userId: v.string(),
    courseId: v.optional(v.string()),
    assignmentId: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    plannedDuration: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
    accumulatedPausedSeconds: v.optional(v.number()),
    focusScore: v.optional(v.number()),
    productivityRating: v.optional(v.number()),
    distractionCount: v.optional(v.number()),
    breakCount: v.optional(v.number()),
    sessionType: v.string(),
    studyMethod: v.optional(v.string()),
    location: v.optional(v.string()),
    environment: v.optional(v.string()),
    filesUsed: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    // Optional persisted audio queue: array of { id, name, url }
    audioQueue: v.optional(
      v.array(v.object({ id: v.string(), name: v.string(), url: v.string() }))
    ),
    isCompleted: v.optional(v.boolean()),
    wasInterrupted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("studySessions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update study session (for ending session, updating metrics)
export const updateStudySession = mutation({
  args: {
    sessionId: v.id("studySessions"),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    focusScore: v.optional(v.number()),
    productivityRating: v.optional(v.number()),
    distractionCount: v.optional(v.number()),
    breakCount: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
    accumulatedPausedSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    wasInterrupted: v.optional(v.boolean()),
    // Allow editing basic session metadata
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    courseId: v.optional(v.string()),
    plannedDuration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
    studyMethod: v.optional(v.string()),
    location: v.optional(v.string()),
    environment: v.optional(v.string()),
    audioQueue: v.optional(
      v.array(v.object({ id: v.string(), name: v.string(), url: v.string() }))
    ),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updateData } = args;
    return await ctx.db.patch(sessionId, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

// Delete a study session (user action)
export const deleteStudySession = mutation({
  args: { sessionId: v.id("studySessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
    return true;
  },
});

// Get the active (not completed) study session for a user, if any
export const getActiveStudySessionForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc");
    const results = await q.take(20);
    // Find the most recent session that does not have endTime and is not completed
    // Also ignore sessions that have clearly expired (startTime + plannedDuration exceeded plus grace)
    const now = Date.now();
    const graceMs = 5 * 60 * 1000; // 5 minutes grace window
    for (const s of results) {
      if (!s.endTime && !s.isCompleted) {
        const plannedMs = (s.plannedDuration || 0) * 60 * 1000;
        if (
          plannedMs > 0 &&
          s.startTime &&
          now > s.startTime + plannedMs + graceMs
        ) {
          // consider expired; skip it (frontend can call deleteExpiredStudySessions to clean up)
          continue;
        }
        return s;
      }
    }
    return null;
  },
});

// Get all active (not completed) study sessions for a user
export const getActiveStudySessionsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc");
    const results = await q.take(50);
    // Filter active sessions and remove sessions that appear to have expired beyond a grace window
    const now = Date.now();
    const graceMs = 5 * 60 * 1000; // 5 minutes
    return results.filter((s) => {
      if (s.endTime || s.isCompleted) return false;
      const plannedMs = (s.plannedDuration || 0) * 60 * 1000;
      if (
        plannedMs > 0 &&
        s.startTime &&
        now > s.startTime + plannedMs + graceMs
      ) {
        return false;
      }
      return true;
    });
  },
});

// Mutation to delete expired active study sessions for a user (cleanup)
export const deleteExpiredStudySessions = mutation({
  args: { userId: v.string(), graceMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const graceMs = (args.graceMinutes || 5) * 60 * 1000;
    const sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .take(200);

    let deleted = 0;
    for (const s of sessions) {
      if (!s.endTime && !s.isCompleted && s.startTime) {
        const plannedMs = (s.plannedDuration || 0) * 60 * 1000;
        if (plannedMs > 0 && now > s.startTime + plannedMs + graceMs) {
          await ctx.db.delete(s._id);
          deleted += 1;
        }
      }
    }
    return { deleted };
  },
});

// Add grade record
export const addGradeRecord = mutation({
  args: {
    userId: v.string(),
    courseId: v.string(),
    assignmentId: v.optional(v.string()),
    grade: v.string(),
    numericGrade: v.optional(v.number()),
    maxPoints: v.optional(v.number()),
    earnedPoints: v.optional(v.number()),
    percentage: v.optional(v.number()),
    gradeType: v.string(),
    weight: v.optional(v.number()),
    category: v.optional(v.string()),
    instructorFeedback: v.optional(v.string()),
    personalNotes: v.optional(v.string()),
    improvementAreas: v.optional(v.array(v.string())),
    classAverage: v.optional(v.number()),
    classMedian: v.optional(v.number()),
    classHigh: v.optional(v.number()),
    classLow: v.optional(v.number()),
    percentile: v.optional(v.number()),
    dateAssigned: v.optional(v.number()),
    dateDue: v.optional(v.number()),
    dateSubmitted: v.optional(v.number()),
    dateGraded: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("gradeHistory", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get a single study session by id
export const getStudySession = query({
  args: {
    sessionId: v.id("studySessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const sAny: any = session;
    return {
      _id: sAny._id,
      userId: sAny.userId,
      title: sAny.title,
      subject: sAny.subject,
      startTime: sAny.startTime,
      endTime: sAny.endTime,
      duration: sAny.duration || 0,
      plannedDuration: sAny.plannedDuration || 0,
      isCompleted: sAny.isCompleted || false,
      notes: sAny.notes || "",
      audioQueue: sAny.audioQueue || [],
    };
  },
});
