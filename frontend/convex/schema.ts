import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users - Student profiles with comprehensive information
  users: defineTable({
    clerkId: v.string(), // Clerk user ID for authentication
    email: v.string(),
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    
    // Personal Information
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Academic Information
    studentId: v.optional(v.string()),
    year: v.optional(v.string()), // "freshman", "sophomore", "junior", "senior"
    major: v.optional(v.string()),
    minor: v.optional(v.string()),
    gpa: v.optional(v.number()),
    institution: v.optional(v.string()),

    // Preferences
    theme: v.optional(v.string()), // "light" | "dark" | "system"
    timezone: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),

    // Subscription/Plan
    planType: v.optional(v.string()), // "free", "premium", "student"
    planExpiresAt: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_student_id", ["studentId"])
    .index("by_institution", ["institution"]),

  // Courses - Student's enrolled courses
  courses: defineTable({
    userId: v.string(),
    courseCode: v.string(), // e.g., "PHYS101", "MATH201"
    courseName: v.string(),
    instructor: v.optional(v.string()),
    semester: v.string(), // e.g., "Fall 2025", "Spring 2025"
    credits: v.optional(v.number()),

    // Schedule
    schedule: v.optional(
      v.array(
        v.object({
          dayOfWeek: v.string(), // "monday", "tuesday", etc.
          startTime: v.string(), // "09:00"
          endTime: v.string(), // "10:30"
          location: v.optional(v.string()),
        })
      )
    ),

    // Status
    status: v.string(), // "active", "completed", "dropped"
    grade: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_course_code", ["courseCode"])
    .index("by_semester", ["semester"])
    .index("by_user_and_course", ["userId", "courseCode"]),

  // Files - All user files with enhanced metadata
  files: defineTable({
    userId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    originalName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),

    // File categorization
    category: v.string(), // "notes", "assignments", "presentations", "references", "lectures", "study-materials"
    courseId: v.optional(v.string()), // Link to course
    subject: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // AI-generated metadata
    description: v.optional(v.string()),
    extractedText: v.optional(v.string()), // For searchability
    thumbnail: v.optional(v.string()),

    // File status
    isPublic: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),

    // Metadata
    uploadedAt: v.number(),
    lastAccessedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_category", ["category"])
    .index("by_course_id", ["courseId"])
    .index("by_user_and_category", ["userId", "category"])
    .index("by_user_and_course", ["userId", "courseId"])
    .index("by_uploaded_at", ["uploadedAt"]),

  // Assignments - Student assignments and deadlines
  assignments: defineTable({
    userId: v.string(),
    courseId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),

    // Dates
    dueDate: v.number(),
    assignedDate: v.optional(v.number()),
    submittedDate: v.optional(v.number()),

    // Status and grading
    status: v.string(), // "pending", "submitted", "graded", "overdue"
    priority: v.string(), // "high", "medium", "low"
    grade: v.optional(v.string()),
    maxPoints: v.optional(v.number()),
    earnedPoints: v.optional(v.number()),

    // Related files
    attachments: v.optional(v.array(v.string())), // File IDs
    submissionFiles: v.optional(v.array(v.string())), // File IDs

    // Reminders
    reminderSent: v.optional(v.boolean()),
    customReminders: v.optional(v.array(v.number())), // Timestamps

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_course_id", ["courseId"])
    .index("by_due_date", ["dueDate"])
    .index("by_status", ["status"])
    .index("by_user_and_course", ["userId", "courseId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Schedule Events - Calendar events, classes, personal events
  events: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),

    // Time and location
    startTime: v.number(),
    endTime: v.number(),
    isAllDay: v.optional(v.boolean()),
    location: v.optional(v.string()),

    // Meeting/Virtual event support
    meetingLink: v.optional(v.string()),
    meetingPlatform: v.optional(v.string()), // "zoom", "teams", "meet", "webex"
    meetingId: v.optional(v.string()),
    meetingPassword: v.optional(v.string()),

    // Event type and metadata
    type: v.string(), // "class", "assignment", "exam", "study-session", "club", "personal", "meeting"
    courseId: v.optional(v.string()),
    color: v.optional(v.string()),

    // Recurrence
    isRecurring: v.optional(v.boolean()),
    recurrencePattern: v.optional(v.string()), // "daily", "weekly", "monthly"
    recurrenceEnd: v.optional(v.number()),

    // Notifications
    reminders: v.optional(v.array(v.number())), // Minutes before event

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_start_time", ["startTime"])
    .index("by_type", ["type"])
    .index("by_course_id", ["courseId"])
    .index("by_user_and_type", ["userId", "type"]),

  // Chat Sessions - AI assistant conversations
  chatSessions: defineTable({
    userId: v.string(),
    sessionId: v.string(),
    title: v.optional(v.string()),

    // Session metadata
    isActive: v.optional(v.boolean()),
    lastMessageAt: v.optional(v.number()),

    // Context
    context: v.optional(
      v.object({
        courseId: v.optional(v.string()),
        fileIds: v.optional(v.array(v.string())),
        assignmentId: v.optional(v.string()),
      })
    ),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_session_id", ["sessionId"])
    .index("by_user_and_session", ["userId", "sessionId"])
    .index("by_last_message", ["lastMessageAt"]),

  // Chat Messages - Individual messages in conversations
  chatMessages: defineTable({
    sessionId: v.string(),
    userId: v.string(),

    // Message content
    message: v.string(),
    role: v.string(), // "user", "assistant"

    // Message metadata
    messageIndex: v.number(),
    tokens: v.optional(v.number()),
    model: v.optional(v.string()),

    // Attachments and context
    attachments: v.optional(v.array(v.string())), // File IDs
    context: v.optional(v.string()),

    // Metadata
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_user_id", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_session_and_index", ["sessionId", "messageIndex"]),

  // Campus Life - Events, clubs, dining, etc.
  campusLife: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // "event", "club", "dining", "announcement", "facility"

    // Time and location
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),

    // Event details
    organizer: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    registrationRequired: v.optional(v.boolean()),
    registrationLink: v.optional(v.string()),
    capacity: v.optional(v.number()),

    // Dining specific
    menu: v.optional(
      v.array(
        v.object({
          item: v.string(),
          price: v.optional(v.number()),
          dietary: v.optional(v.array(v.string())), // "vegetarian", "vegan", "gluten-free"
        })
      )
    ),

    // Visibility and status
    isPublic: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    institution: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_start_time", ["startTime"])
    .index("by_institution", ["institution"])
    .index("by_is_active", ["isActive"]),

  // User Preferences - App-specific settings
  userPreferences: defineTable({
    userId: v.string(),

    // Dashboard preferences
    dashboardLayout: v.optional(v.string()),
    hiddenSections: v.optional(v.array(v.string())),

    // Notification preferences
    notificationSettings: v.optional(
      v.object({
        assignments: v.boolean(),
        classes: v.boolean(),
        campusEvents: v.boolean(),
        weeklyDigest: v.boolean(),
        studyReminders: v.boolean(),
      })
    ),

    // Study preferences
    studySettings: v.optional(
      v.object({
        defaultStudyDuration: v.number(), // minutes
        breakDuration: v.number(), // minutes
        dailyStudyGoal: v.number(), // hours
        preferredStudyTimes: v.array(v.string()),
      })
    ),

    // AI assistant preferences
    aiSettings: v.optional(
      v.object({
        personality: v.string(), // "formal", "casual", "encouraging"
        responseLength: v.string(), // "brief", "detailed"
        contextWindow: v.number(), // messages to remember
      })
    ),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),
});
