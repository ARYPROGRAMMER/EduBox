import { v } from "convex/values";
import { query } from "./_generated/server";

// Get comprehensive user context for AI chat
export const getUserContext = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get user profile
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    // Get current and upcoming assignments (next 30 days)
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("dueDate"), now),
          q.lte(q.field("dueDate"), thirtyDaysFromNow)
        )
      )
      .order("asc")
      .take(20);

    // Get active courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(20);

    // Get upcoming events (next 14 days)
    const fourteenDaysFromNow = now + (14 * 24 * 60 * 60 * 1000);
    
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("startTime"), now),
          q.lte(q.field("startTime"), fourteenDaysFromNow)
        )
      )
      .order("asc")
      .take(20);

    // Get recent files (last 30 days)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentFiles = await ctx.db
      .query("files")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), thirtyDaysAgo),
          q.eq(q.field("isArchived"), false)
        )
      )
      .order("desc")
      .take(15);

    // Get grade/performance data
    const grades = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.neq(q.field("grade"), undefined),
          q.eq(q.field("status"), "completed")
        )
      )
      .order("desc")
      .take(10);

    // Get campus life events (if available)
    const campusEvents = await ctx.db
      .query("campusLife")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), "event"),
          q.gte(q.field("startTime"), now)
        )
      )
      .order("asc")
      .take(10);

    // Calculate today's schedule
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // Get day name
    
    const todayClasses = courses.filter(course => 
      course.schedule?.some(slot => 
        slot.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
      )
    );

    // Get overdue assignments
    const overdueAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.lt(q.field("dueDate"), now),
          q.neq(q.field("status"), "completed")
        )
      )
      .order("asc")
      .take(10);

    return {
      user: user ? {
        name: user.fullName,
        year: user.year,
        major: user.major,
        minor: user.minor,
        gpa: user.gpa,
        institution: user.institution,
      } : null,
      
      assignments: {
        upcoming: assignments.map(a => ({
          title: a.title,
          course: a.courseId,
          dueDate: a.dueDate,
          priority: a.priority,
          status: a.status,
        })),
        overdue: overdueAssignments.map(a => ({
          title: a.title,
          course: a.courseId,
          dueDate: a.dueDate,
          priority: a.priority,
        })),
      },

      courses: courses.map(c => ({
        code: c.courseCode,
        name: c.courseName,
        instructor: c.instructor,
        semester: c.semester,
        credits: c.credits,
        schedule: c.schedule,
      })),

      todaySchedule: todayClasses.map(c => ({
        course: c.courseCode,
        name: c.courseName,
        schedule: c.schedule?.filter(s => 
          s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
        ),
      })),

      events: events.map(e => ({
        title: e.title,
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        description: e.description,
      })),

      recentFiles: recentFiles.map(f => ({
        name: f.fileName,
        category: f.category,
        subject: f.subject,
        description: f.description,
        createdAt: f.createdAt,
      })),

      performance: {
        recentGrades: grades.map(g => ({
          assignment: g.title,
          course: g.courseId,
          grade: g.grade,
          maxPoints: g.maxPoints,
          submittedAt: g.submittedDate,
        })),
        currentGPA: user?.gpa,
      },

      campusLife: campusEvents.map(e => ({
        title: e.title,
        category: e.category,
        startTime: e.startTime,
        location: e.location,
      })),

      statistics: {
        totalCourses: courses.length,
        upcomingAssignments: assignments.length,
        overdueAssignments: overdueAssignments.length,
        upcomingEvents: events.length,
        recentFiles: recentFiles.length,
      },
    };
  },
});

// Get today's specific context for questions like "What's due today?"
export const getTodayContext = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    // Get today's date boundaries
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;

    // Assignments due today
    const assignmentsDueToday = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("dueDate"), startOfDay),
          q.lte(q.field("dueDate"), endOfDay)
        )
      )
      .collect();

    // Events happening today
    const eventsToday = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("startTime"), startOfDay),
          q.lte(q.field("startTime"), endOfDay)
        )
      )
      .collect();

    return {
      assignmentsDueToday: assignmentsDueToday.map(a => ({
        title: a.title,
        course: a.courseId,
        priority: a.priority,
        status: a.status,
      })),
      
      eventsToday: eventsToday.map(e => ({
        title: e.title,
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
      })),
    };
  },
});