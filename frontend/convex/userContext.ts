import { v } from "convex/values";
import { query } from "./_generated/server";

// Get comprehensive user context for AI chat
export const getUserContext = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    if (!userId) {
      return null;
    }

    // Get user profile
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    // Get current and upcoming assignments (next 30 days)
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

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
    const fourteenDaysFromNow = now + 14 * 24 * 60 * 60 * 1000;

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
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

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
    const dayOfWeek = today
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase(); // Get day name

    const todayClasses = (courses || []).filter((course) =>
      course.schedule?.some(
        (slot) => slot.dayOfWeek?.toLowerCase() === dayOfWeek.toLowerCase()
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

    // Get college schedule
    const collegeSchedule = await ctx.db
      .query("collegeSchedule")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    // Get dining schedule
    const diningSchedule = await ctx.db
      .query("diningSchedule")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();

    // Get schedule preferences
    const schedulePreferences = await ctx.db
      .query("schedulePreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    // Get today's schedule from new schedule system
    const todayDayName = today.toLocaleDateString("en-US", { weekday: "long" });

    const todayCollegeClasses = (collegeSchedule || []).filter(
      (cls) => cls.dayOfWeek === todayDayName
    );

    const todayMeals = (diningSchedule || []).filter(
      (meal) => meal.dayOfWeek === todayDayName || meal.dayOfWeek === "Daily"
    );

    return {
      user: user
        ? {
            name: user.fullName,
            year: user.year,
            major: user.major,
            minor: user.minor,
            gpa: user.gpa,
            institution: user.institution,
          }
        : null,

      assignments: {
        upcoming: assignments.map((a) => ({
          title: a.title,
          course: a.courseId,
          dueDate: a.dueDate,
          priority: a.priority,
          status: a.status,
        })),
        overdue: overdueAssignments.map((a) => ({
          title: a.title,
          course: a.courseId,
          dueDate: a.dueDate,
          priority: a.priority,
        })),
      },

      courses: courses.map((c) => ({
        code: c.courseCode,
        name: c.courseName,
        instructor: c.instructor,
        semester: c.semester,
        credits: c.credits,
        schedule: c.schedule,
      })),

      todaySchedule: todayClasses.map((c) => ({
        course: c.courseCode,
        name: c.courseName,
        schedule: c.schedule?.filter(
          (s) => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
        ),
      })),

      events: events.map((e) => ({
        title: e.title,
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        description: e.description,
      })),

      recentFiles: recentFiles.map((f) => ({
        name: f.fileName,
        category: f.category,
        subject: f.subject,
        description: f.description,
        createdAt: f.createdAt,
      })),

      performance: {
        recentGrades: grades.map((g) => ({
          assignment: g.title,
          course: g.courseId,
          grade: g.grade,
          maxPoints: g.maxPoints,
          submittedAt: g.submittedDate,
        })),
        currentGPA: user?.gpa,
      },

      campusLife: campusEvents.map((e) => ({
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

      // Schedule data
      schedule: {
        college: collegeSchedule.map((cls) => ({
          subject: cls.subject,
          code: cls.code,
          instructor: cls.instructor,
          location: cls.location,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          semester: cls.semester,
          credits: cls.credits,
        })),

        dining: diningSchedule.map((meal) => ({
          mealType: meal.mealType,
          location: meal.location,
          dayOfWeek: meal.dayOfWeek,
          startTime: meal.startTime,
          endTime: meal.endTime,
          specialNotes: meal.specialNotes,
        })),

        preferences: schedulePreferences
          ? {
              defaultMealCount: schedulePreferences.defaultMealCount,
              mealTypes: schedulePreferences.mealTypes,
              showDiningInCalendar: schedulePreferences.showDiningInCalendar,
              showClassesInCalendar: schedulePreferences.showClassesInCalendar,
              scheduleViewMode: schedulePreferences.scheduleViewMode,
            }
          : null,

        today: {
          classes: todayCollegeClasses.map((cls) => ({
            subject: cls.subject,
            code: cls.code,
            startTime: cls.startTime,
            endTime: cls.endTime,
            location: cls.location,
            instructor: cls.instructor,
          })),
          meals: todayMeals.map((meal) => ({
            mealType: meal.mealType,
            startTime: meal.startTime,
            endTime: meal.endTime,
            location: meal.location,
          })),
        },
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
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

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
      assignmentsDueToday: assignmentsDueToday.map((a) => ({
        title: a.title,
        course: a.courseId,
        priority: a.priority,
        status: a.status,
      })),

      eventsToday: eventsToday.map((e) => ({
        title: e.title,
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
      })),
    };
  },
});

// Get comprehensive import/export status with preloaded data
export const getImportExportStatus = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get all import/export jobs with status
    const jobs = await ctx.db
      .query("dataImportExport")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    // Get recent successful imports by type
    const recentImports = jobs.filter(
      (job) =>
        job.operation === "import" &&
        job.status === "completed" &&
        job.completedAt &&
        job.completedAt > Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    // Get pending/processing import jobs (ignore export jobs so exports don't block imports)
    const activeJobs = jobs.filter(
      (job) =>
        job.operation === "import" &&
        (job.status === "pending" || job.status === "processing")
    );

    // Calculate import statistics
    const importStats = {
      totalImports: jobs.filter((job) => job.operation === "import").length,
      totalExports: jobs.filter((job) => job.operation === "export").length,
      successfulImports: jobs.filter(
        (job) => job.operation === "import" && job.status === "completed"
      ).length,
      failedImports: jobs.filter(
        (job) => job.operation === "import" && job.status === "failed"
      ).length,
      totalRecordsImported: jobs
        .filter(
          (job) => job.operation === "import" && job.status === "completed"
        )
        .reduce((sum, job) => sum + (job.recordsSuccessful || 0), 0),
    };

    // Group by data type for quick access
    const jobsByType = jobs.reduce((acc, job) => {
      if (!acc[job.dataType]) acc[job.dataType] = [];
      acc[job.dataType].push(job);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      jobs,
      recentImports,
      activeJobs,
      importStats,
      jobsByType,
      readyForImport: activeJobs.length === 0, // Can start new import if no active import jobs
    };
  },
});

// Preload user analytics for immediate display
export const getPreloadedAnalytics = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get analytics for different time periods
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const last90Days = Date.now() - 90 * 24 * 60 * 60 * 1000;

    // Get study sessions for all periods
    const allStudySessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("startTime"), last90Days))
      .collect();

    // Get grade history for all periods
    const allGrades = await ctx.db
      .query("gradeHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("dateGraded"), last90Days))
      .collect();

    // Get assignments for all periods
    const allAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("dueDate"), last90Days))
      .collect();

    // Process data for different time periods
    const processForPeriod = (startDate: number) => {
      const studySessions = allStudySessions.filter(
        (s) => s.startTime >= startDate
      );
      const grades = allGrades.filter((g) => g.dateGraded >= startDate);
      const assignments = allAssignments.filter((a) => a.dueDate >= startDate);

      const totalStudyHours =
        studySessions.reduce(
          (sum, session) => sum + (session.duration || 0),
          0
        ) / 60;
      const averageFocusScore =
        studySessions.length > 0
          ? studySessions.reduce(
              (sum, session) => sum + (session.focusScore || 0),
              0
            ) / studySessions.length
          : 0;
      const averageGrade =
        grades.length > 0
          ? grades.reduce((sum, grade) => sum + (grade.numericGrade || 0), 0) /
            grades.length
          : 0;
      const completedAssignments = assignments.filter(
        (a) => a.status === "submitted" || a.status === "graded"
      ).length;
      const completionRate =
        assignments.length > 0
          ? (completedAssignments / assignments.length) * 100
          : 0;

      return {
        totalStudyHours: Math.round(totalStudyHours * 10) / 10,
        studySessionsCount: studySessions.length,
        averageFocusScore: Math.round(averageFocusScore),
        averageGrade: Math.round(averageGrade * 10) / 10,
        completedAssignments,
        totalAssignments: assignments.length,
        completionRate: Math.round(completionRate),
      };
    };

    return {
      last7Days: processForPeriod(last7Days),
      last30Days: processForPeriod(last30Days),
      last90Days: processForPeriod(last90Days),
      rawData: {
        studySessions: allStudySessions,
        grades: allGrades,
        assignments: allAssignments,
      },
    };
  },
});

// Get comprehensive dining information with user preferences
export const getDiningContext = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get user-specific dining preferences
    const userDiningData = await ctx.db
      .query("campusDining")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    // Get general dining hall information
    const diningHalls = await ctx.db
      .query("campusDining")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("userId"), undefined)) // General dining halls
      .collect();

    return {
      userPreferences: userDiningData,
      diningHalls: diningHalls,
      hasDiningData: diningHalls.length > 0,
    };
  },
});
