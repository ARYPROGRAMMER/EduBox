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
    nucliaResourceId: v.optional(v.string()),
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
    estimatedHours: v.optional(v.number()),

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

  // AI Generations - Store outputs produced by LLMs (content generation, study plans, etc.)
  generations: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    contentType: v.optional(v.string()), // e.g., "blog_post", "study_plan"
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
    // Allow a small, safe metadata object. We store a rawOptions snapshot as a string
    // to avoid Convex validator errors when persisting arbitrary client options.
    metadata: v.optional(v.object({ rawOptions: v.optional(v.string()) })),
    visibility: v.optional(v.string()), // "private" | "public"

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_created_at", ["createdAt"]),

  // Separate table for AI Content Generation feature to keep histories distinct
  ai_content: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    contentType: v.optional(v.string()), // e.g., essay, summary, outline
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

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_created_at", ["createdAt"]),

  // Notifications - In-app notifications and reminders
  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    message: v.string(),

    // Notification type and metadata
    type: v.string(), // "assignment", "class", "exam", "study", "system", "campus-event"
    priority: v.string(), // "high", "medium", "low"

    // Related entities
    relatedId: v.optional(v.string()), // Assignment ID, Event ID, etc.
    relatedType: v.optional(v.string()), // "assignment", "event", "course"

    // Notification status
    isRead: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),

    // Scheduling
    scheduledFor: v.optional(v.number()), // When to show the notification
    expiresAt: v.optional(v.number()), // When the notification becomes irrelevant

    // Actions
    actionUrl: v.optional(v.string()), // URL to navigate to when clicked
    actionLabel: v.optional(v.string()), // Button text

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_type", ["type"])
    .index("by_is_read", ["isRead"])
    .index("by_scheduled_for", ["scheduledFor"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_read", ["userId", "isRead"]),

  // Academic Analytics - Performance tracking and insights
  academicAnalytics: defineTable({
    userId: v.string(),
    courseId: v.optional(v.string()),

    // Time period
    period: v.string(), // "week", "month", "semester", "year"
    periodStart: v.number(),
    periodEnd: v.number(),

    // Performance metrics
    gpa: v.optional(v.number()),
    gradePoints: v.optional(v.number()),
    totalCredits: v.optional(v.number()),

    // Study metrics
    totalStudyHours: v.optional(v.number()),
    averageStudyHours: v.optional(v.number()),
    studySessionsCount: v.optional(v.number()),

    // Assignment metrics
    assignmentsCompleted: v.optional(v.number()),
    assignmentsTotal: v.optional(v.number()),
    averageGrade: v.optional(v.number()),
    onTimeSubmissions: v.optional(v.number()),

    // Attendance (if tracked)
    classesAttended: v.optional(v.number()),
    totalClasses: v.optional(v.number()),
    attendanceRate: v.optional(v.number()),

    // Goals and targets
    studyGoalHours: v.optional(v.number()),
    gpaTarget: v.optional(v.number()),
    completionTarget: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_course_id", ["courseId"])
    .index("by_period", ["period"])
    .index("by_period_start", ["periodStart"])
    .index("by_user_and_period", ["userId", "period"])
    .index("by_user_and_course", ["userId", "courseId"]),

  // Study Sessions - Track study time and productivity
  studySessions: defineTable({
    userId: v.string(),
    courseId: v.optional(v.string()),
    assignmentId: v.optional(v.string()),

    // Session details
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),

    // Time tracking
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()), // in minutes
    plannedDuration: v.optional(v.number()),

    // Productivity metrics
    focusScore: v.optional(v.number()), // 1-100
    productivityRating: v.optional(v.number()), // 1-5
    distractionCount: v.optional(v.number()),
    breakCount: v.optional(v.number()),

    // Session type and method
    sessionType: v.string(), // "focused", "review", "practice", "reading", "research"
    studyMethod: v.optional(v.string()), // "pomodoro", "timeboxing", "flow"

    // Location and environment
    location: v.optional(v.string()),
    environment: v.optional(v.string()), // "quiet", "background-music", "group"

    // Related content
    filesUsed: v.optional(v.array(v.string())), // File IDs
    notes: v.optional(v.string()),

    // Status
    isCompleted: v.optional(v.boolean()),
    wasInterrupted: v.optional(v.boolean()),
    // Pause/resume support for persistent timers
    pausedAt: v.optional(v.number()), // timestamp when session was paused
    accumulatedPausedSeconds: v.optional(v.number()), // total paused seconds accumulated

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_course_id", ["courseId"])
    .index("by_assignment_id", ["assignmentId"])
    .index("by_start_time", ["startTime"])
    .index("by_session_type", ["sessionType"])
    .index("by_user_and_course", ["userId", "courseId"])
    .index("by_user_and_date", ["userId", "startTime"]),

  // Campus Dining - Detailed dining hall information
  campusDining: defineTable({
    userId: v.optional(v.string()), // If user-specific

    // Basic info
    diningHallName: v.string(),
    location: v.string(),
    description: v.optional(v.string()),

    // Operating hours
    operatingHours: v.array(
      v.object({
        dayOfWeek: v.string(), // "monday", "tuesday", etc.
        openTime: v.string(), // "07:00"
        closeTime: v.string(), // "22:00"
        mealPeriods: v.array(
          v.object({
            name: v.string(), // "breakfast", "lunch", "dinner"
            startTime: v.string(),
            endTime: v.string(),
          })
        ),
      })
    ),

    // Menu information
    currentMenu: v.optional(
      v.array(
        v.object({
          mealPeriod: v.string(), // "breakfast", "lunch", "dinner"
          date: v.string(), // "2025-09-13"
          items: v.array(
            v.object({
              name: v.string(),
              description: v.optional(v.string()),
              category: v.string(), // "entree", "side", "dessert", "beverage"
              price: v.optional(v.number()),
              calories: v.optional(v.number()),
              dietaryRestrictions: v.optional(v.array(v.string())), // "vegetarian", "vegan", "gluten-free", "nut-free"
              allergens: v.optional(v.array(v.string())),
              nutritionFacts: v.optional(
                v.object({
                  protein: v.optional(v.number()),
                  carbs: v.optional(v.number()),
                  fat: v.optional(v.number()),
                  fiber: v.optional(v.number()),
                  sodium: v.optional(v.number()),
                })
              ),
            })
          ),
        })
      )
    ),

    // Services and amenities
    services: v.optional(v.array(v.string())), // "takeout", "delivery", "catering", "meal-plans"
    paymentMethods: v.optional(v.array(v.string())), // "cash", "card", "student-id", "meal-plan"

    // Contact and additional info
    contactInfo: v.optional(
      v.object({
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        manager: v.optional(v.string()),
      })
    ),

    // User preferences (if user-specific)
    favoriteItems: v.optional(v.array(v.string())),
    dietaryPreferences: v.optional(v.array(v.string())),

    // Metadata
    institution: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_dining_hall", ["diningHallName"])
    .index("by_institution", ["institution"])
    .index("by_is_active", ["isActive"]),

  // Data Import/Export Logs - Track import/export operations
  dataImportExport: defineTable({
    userId: v.string(),

    // Operation details
    operation: v.string(), // "import", "export"
    dataType: v.string(), // "courses", "assignments", "grades", "analytics", "dining"
    format: v.string(), // "csv", "json", "pdf"

    // File information
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),

    // Processing status
    status: v.string(), // "pending", "processing", "completed", "failed"
    progress: v.optional(v.number()), // 0-100
    recordsProcessed: v.optional(v.number()),
    recordsTotal: v.optional(v.number()),
    recordsSuccessful: v.optional(v.number()),
    recordsFailed: v.optional(v.number()),

    // Error handling
    errors: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),

    // AI processing (for PDF extraction, etc.)
    aiProcessingUsed: v.optional(v.boolean()),
    aiModel: v.optional(v.string()),
    extractedData: v.optional(v.string()), // JSON string of extracted data

    // Results
    resultSummary: v.optional(v.string()),
    outputFileId: v.optional(v.id("_storage")), // For exports

    // Metadata
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_operation", ["operation"])
    .index("by_data_type", ["dataType"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"])
    .index("by_user_and_operation", ["userId", "operation"]),

  // Grade History - Detailed grade tracking
  gradeHistory: defineTable({
    userId: v.string(),
    courseId: v.string(),
    assignmentId: v.optional(v.string()),

    // Grade details
    grade: v.string(), // Letter grade or percentage
    numericGrade: v.optional(v.number()), // Numeric equivalent
    maxPoints: v.optional(v.number()),
    earnedPoints: v.optional(v.number()),
    percentage: v.optional(v.number()),

    // Grade type
    gradeType: v.string(), // "assignment", "exam", "quiz", "project", "participation", "final"
    weight: v.optional(v.number()), // Weight in course grade calculation
    category: v.optional(v.string()), // "homework", "midterm", "final", etc.

    // Feedback and notes
    instructorFeedback: v.optional(v.string()),
    personalNotes: v.optional(v.string()),
    improvementAreas: v.optional(v.array(v.string())),

    // Performance context
    classAverage: v.optional(v.number()),
    classMedian: v.optional(v.number()),
    classHigh: v.optional(v.number()),
    classLow: v.optional(v.number()),
    percentile: v.optional(v.number()),

    // Timeline
    dateAssigned: v.optional(v.number()),
    dateDue: v.optional(v.number()),
    dateSubmitted: v.optional(v.number()),
    dateGraded: v.number(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_course_id", ["courseId"])
    .index("by_assignment_id", ["assignmentId"])
    .index("by_date_graded", ["dateGraded"])
    .index("by_grade_type", ["gradeType"])
    .index("by_user_and_course", ["userId", "courseId"]),

  // College Schedule - Class timetables
  collegeSchedule: defineTable({
    userId: v.string(),
    subject: v.string(), // Course/subject name
    code: v.optional(v.string()), // Course code like "CS101"
    instructor: v.optional(v.string()),
    location: v.optional(v.string()), // Classroom/building
    dayOfWeek: v.string(), // "Monday", "Tuesday", etc.
    startTime: v.string(), // 24-hour format "09:00"
    endTime: v.string(), // 24-hour format "10:30"
    duration: v.optional(v.number()), // Duration in minutes
    semester: v.optional(v.string()), // "Fall 2024", "Spring 2025"
    credits: v.optional(v.number()),
    color: v.optional(v.string()), // For calendar display

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_day_of_week", ["dayOfWeek"])
    .index("by_user_and_day", ["userId", "dayOfWeek"])
    .index("by_semester", ["semester"]),

  // Dining Schedule - Meal timings and preferences
  diningSchedule: defineTable({
    userId: v.string(),
    mealType: v.string(), // "breakfast", "lunch", "dinner", "brunch", "snack"
    location: v.optional(v.string()), // Dining hall name
    dayOfWeek: v.string(), // "Monday", "Tuesday", etc. or "Daily"
    startTime: v.string(), // 24-hour format "07:00"
    endTime: v.string(), // 24-hour format "09:30"
    specialNotes: v.optional(v.string()), // "Weekend Special", etc.
    isEnabled: v.optional(v.boolean()), // User can enable/disable specific meals
    reminderMinutes: v.optional(v.number()), // Minutes before to remind

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_meal_type", ["mealType"])
    .index("by_day_of_week", ["dayOfWeek"])
    .index("by_user_and_day", ["userId", "dayOfWeek"])
    .index("by_user_and_meal", ["userId", "mealType"]),

  // User Schedule Preferences - Global settings for schedule management
  schedulePreferences: defineTable({
    userId: v.string(),

    // Dining preferences
    defaultMealCount: v.optional(v.number()), // How many meals per day (2, 3, 4, etc.)
    mealTypes: v.optional(v.array(v.string())), // ["breakfast", "lunch", "dinner"]
    mealRemindersEnabled: v.optional(v.boolean()),
    defaultMealReminderMinutes: v.optional(v.number()),

    // College schedule preferences
    scheduleViewMode: v.optional(v.string()), // "week", "month", "day"
    classRemindersEnabled: v.optional(v.boolean()),
    defaultClassReminderMinutes: v.optional(v.number()),

    // Calendar integration
    showDiningInCalendar: v.optional(v.boolean()),
    showClassesInCalendar: v.optional(v.boolean()),
    calendarStartTime: v.optional(v.string()), // "06:00"
    calendarEndTime: v.optional(v.string()), // "22:00"

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),
});
