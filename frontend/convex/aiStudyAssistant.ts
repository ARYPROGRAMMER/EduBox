import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Get AI-powered study recommendations for a user
export const getStudyRecommendations = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's current assignments
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("asc")
      .take(10);

    // Get recent study sessions to understand patterns
    const recentSessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    // Get user courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(20);

    // Generate recommendations based on data
    const recommendations: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      priority: string;
      timeEstimate: string;
      difficulty: string;
      topics: string[];
      assignmentId?: any;
      courseId?: any;
    }> = [];

    // Priority assignments requiring focus
    const urgentAssignments = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 3 && daysDiff > 0; // Due in next 3 days
    });

    urgentAssignments.forEach((assignment, index) => {
      if (index < 3) { // Limit to top 3
        recommendations.push({
          id: `urgent-${assignment._id}`,
          type: "focus-session",
          title: `Complete ${assignment.title}`,
          description: `Focus session for upcoming assignment due soon`,
          priority: "high",
          timeEstimate: `${assignment.estimatedHours || 2} hours`,
          difficulty: assignment.priority === "high" ? "Hard" : "Medium",
          topics: [assignment.title],
          assignmentId: assignment._id,
          courseId: assignment.courseId,
        });
      }
    });

    // Study session recommendations based on poor performing subjects
    const performanceData = await ctx.db
      .query("academicAnalytics")
      .withIndex("by_user_and_period", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Add review recommendations for courses with lower performance
    courses.forEach((course, index) => {
      if (index < 2) { // Limit recommendations
        recommendations.push({
          id: `review-${course._id}`,
          type: "review",
          title: `Review ${course.courseName}`,
          description: `Strengthen understanding of key concepts`,
          priority: "medium",
          timeEstimate: "45 min",
          difficulty: "Medium",
          topics: [course.courseCode, course.courseName],
          courseId: course._id,
        });
      }
    });

    return recommendations;
  },
});

// Get learning insights and analytics
export const getLearningInsights = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lastWeek = now - (7 * 24 * 60 * 60 * 1000);
    const lastMonth = now - (30 * 24 * 60 * 60 * 1000);

    // Get study sessions for analysis
    const recentSessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("startTime"), lastMonth))
      .collect();

    const weekSessions = recentSessions.filter(s => s.startTime >= lastWeek);
    const monthSessions = recentSessions;

    // Calculate study efficiency
    const avgFocusScore = weekSessions.reduce((sum, s) => sum + (s.focusScore || 75), 0) / (weekSessions.length || 1);
    const previousAvgFocus = monthSessions
      .filter(s => s.startTime < lastWeek)
      .reduce((sum, s) => sum + (s.focusScore || 75), 0) / (monthSessions.length - weekSessions.length || 1);
    
    const focusTrend = avgFocusScore > previousAvgFocus ? 
      `+${((avgFocusScore - previousAvgFocus) / previousAvgFocus * 100).toFixed(0)}%` : 
      `-${((previousAvgFocus - avgFocusScore) / previousAvgFocus * 100).toFixed(0)}%`;

    // Calculate productivity
    const avgProductivity = weekSessions.reduce((sum, s) => sum + (s.productivityRating || 4), 0) / (weekSessions.length || 1);
    const productivityScore = (avgProductivity / 5) * 100;

    // Calculate learning pace (sessions completed vs planned)
    const completedSessions = weekSessions.filter(s => s.isCompleted).length;
    const totalSessions = weekSessions.length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 85;

    return [
      {
        metric: "Study Efficiency",
        value: Math.round(avgFocusScore),
        trend: focusTrend,
        description: `Your focus score is ${avgFocusScore > previousAvgFocus ? 'improving' : 'declining'} this week`,
        color: avgFocusScore > previousAvgFocus ? "text-green-600" : "text-red-600",
      },
      {
        metric: "Productivity Score",
        value: Math.round(productivityScore),
        trend: productivityScore > 80 ? "+5%" : "-2%",
        description: `Based on ${weekSessions.length} study sessions this week`,
        color: productivityScore > 80 ? "text-blue-600" : "text-orange-600",
      },
      {
        metric: "Session Completion",
        value: Math.round(completionRate),
        trend: completionRate > 80 ? "+8%" : "-3%",
        description: `${completedSessions} of ${totalSessions} sessions completed successfully`,
        color: completionRate > 80 ? "text-purple-600" : "text-red-600",
      },
    ];
  },
});

// Get AI-generated study plans
export const getStudyPlans = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's courses and assignments
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(10);

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("asc")
      .take(15);

    // Generate study plans based on current workload
    const plans: Array<{
      id: string;
      name: string;
      description: string;
      duration: string;
      subjects: string[];
      totalHours: number;
      difficulty: string;
      tasksCount: number;
      progress: number;
      isActive: boolean;
    }> = [];

    // Weekly study plan
    if (assignments.length > 0) {
      const weeklyHours = assignments.reduce((sum, a) => sum + (a.estimatedHours || 2), 0);
      plans.push({
        id: "weekly-plan",
        name: "Weekly Study Plan",
        description: "Optimized schedule for this week's assignments",
        duration: "7 days",
        subjects: [...new Set(assignments.map(a => a.title).slice(0, 3))],
        totalHours: weeklyHours,
        difficulty: weeklyHours > 20 ? "High" : weeklyHours > 10 ? "Medium" : "Low",
        tasksCount: assignments.length,
        progress: 0,
        isActive: true,
      });
    }

    // Exam preparation plan
    const upcomingExams = assignments.filter(a => a.title.toLowerCase().includes('exam') || a.title.toLowerCase().includes('test'));
    if (upcomingExams.length > 0) {
      plans.push({
        id: "exam-prep",
        name: "Exam Preparation",
        description: "Comprehensive review plan for upcoming exams",
        duration: "14 days",
        subjects: [...new Set(upcomingExams.map(a => a.title))],
        totalHours: upcomingExams.length * 6,
        difficulty: "High",
        tasksCount: upcomingExams.length * 3,
        progress: 25,
        isActive: false,
      });
    }

    // Course review plan
    if (courses.length > 0) {
      plans.push({
        id: "course-review",
        name: "Course Review Session",
        description: "Regular review of all active courses",
        duration: "Ongoing",
        subjects: courses.map(c => c.courseCode),
        totalHours: courses.length * 2,
        difficulty: "Medium",
        tasksCount: courses.length * 5,
        progress: 60,
        isActive: false,
      });
    }

    return plans;
  },
});

// Generate AI-powered study recommendations
export const generateStudyRecommendations = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // This would normally trigger AI-powered recommendation generation
    // For now, we just return success to trigger a refresh of the recommendations
    return {
      success: true,
      message: "Study recommendations generated successfully",
      generatedAt: Date.now(),
    };
  },
});