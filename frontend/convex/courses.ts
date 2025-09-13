import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new course
export const createCourse = mutation({
  args: {
    userId: v.string(),
    courseCode: v.string(),
    courseName: v.string(),
    instructor: v.optional(v.string()),
    semester: v.string(),
    credits: v.optional(v.number()),
    schedule: v.optional(
      v.array(
        v.object({
          dayOfWeek: v.string(),
          startTime: v.string(),
          endTime: v.string(),
          location: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const courseId = await ctx.db.insert("courses", {
      userId: args.userId,
      courseCode: args.courseCode,
      courseName: args.courseName,
      instructor: args.instructor,
      semester: args.semester,
      credits: args.credits,
      schedule: args.schedule,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return courseId;
  },
});

// Get all courses for a user
export const getCourses = query({
  args: {
    userId: v.string(),
    semester: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.semester) {
      query = query.filter((q) => q.eq(q.field("semester"), args.semester));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const courses = await query.order("desc").collect();
    return courses;
  },
});

// Get a single course by ID
export const getCourse = query({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);

    if (!course || course.userId !== args.userId) {
      return null;
    }

    return course;
  },
});

// Update course
export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
    updates: v.object({
      courseCode: v.optional(v.string()),
      courseName: v.optional(v.string()),
      instructor: v.optional(v.string()),
      semester: v.optional(v.string()),
      credits: v.optional(v.number()),
      schedule: v.optional(
        v.array(
          v.object({
            dayOfWeek: v.string(),
            startTime: v.string(),
            endTime: v.string(),
            location: v.optional(v.string()),
          })
        )
      ),
      status: v.optional(v.string()),
      grade: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);

    if (!course || course.userId !== args.userId) {
      throw new Error("Course not found or access denied");
    }

    await ctx.db.patch(args.courseId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.courseId;
  },
});

// Delete course
export const deleteCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);

    if (!course || course.userId !== args.userId) {
      throw new Error("Course not found or access denied");
    }

    await ctx.db.delete(args.courseId);
    return { success: true };
  },
});

// Get course statistics
export const getCourseStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const activeCourses = courses.filter(
      (course) => course.status === "active"
    );
    const completedCourses = courses.filter(
      (course) => course.status === "completed"
    );

    const totalCredits = activeCourses.reduce(
      (sum, course) => sum + (course.credits || 0),
      0
    );

    // Calculate GPA from completed courses
    const gradedCourses = completedCourses.filter((course) => course.grade);
    const gpa =
      gradedCourses.length > 0
        ? gradedCourses.reduce((sum, course) => {
            const gradePoint = convertGradeToPoint(course.grade || "");
            return sum + gradePoint;
          }, 0) / gradedCourses.length
        : 0;

    return {
      totalCourses: courses.length,
      activeCourses: activeCourses.length,
      completedCourses: completedCourses.length,
      totalCredits,
      gpa: Math.round(gpa * 100) / 100,
    };
  },
});

// Helper function to convert letter grades to GPA points
function convertGradeToPoint(grade: string): number {
  const gradeMap: Record<string, number> = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  };
  return gradeMap[grade.toUpperCase()] || 0;
}
