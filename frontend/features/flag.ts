export enum FeatureFlag {
  // Core Features
  AI_CHAT_ASSISTANT = "ai-chat-assistant",
  FILE_MANAGEMENT = "file-management",
  ASSIGNMENT_TRACKING = "assignment-tracking",
  SCHEDULE_PLANNING = "schedule-planning",

  // Analytics and Insights
  COURSE_ANALYTICS = "course-analytics",
  STUDY_REMINDERS = "study-reminders",
  CAMPUS_INTEGRATION = "campus-integration",

  // Advanced Features
  ADVANCED_SEARCH = "advanced-search",
  COLLABORATION_TOOLS = "collaboration-tools",
  PRIORITY_SUPPORT = "priority-support",

  // AI-Powered Features
  AI_STUDY_ASSISTANT = "ai-study-assistant",
  AI_CONTENT_GENERATION = "ai-content-generation",
  AI_PERFORMANCE_INSIGHTS = "ai-performance-insights",

  // Storage and Integration
  UNLIMITED_STORAGE = "unlimited-storage",
  THIRD_PARTY_INTEGRATIONS = "third-party-integrations",
  API_ACCESS = "api-access",
  DATA_IMPORT_EXPORT = "data-import-export",
}

export const featureFlagEvents: Record<FeatureFlag, { event: string }> = {
  [FeatureFlag.AI_CHAT_ASSISTANT]: {
    event: "use-ai-assistant",
  },
  [FeatureFlag.FILE_MANAGEMENT]: {
    event: "manage-files",
  },
  [FeatureFlag.ASSIGNMENT_TRACKING]: {
    event: "track-assignments",
  },
  [FeatureFlag.SCHEDULE_PLANNING]: {
    event: "plan-schedule",
  },
  [FeatureFlag.COURSE_ANALYTICS]: {
    event: "view-analytics",
  },
  [FeatureFlag.STUDY_REMINDERS]: {
    event: "set-reminders",
  },
  [FeatureFlag.CAMPUS_INTEGRATION]: {
    event: "access-campus-features",
  },
  [FeatureFlag.ADVANCED_SEARCH]: {
    event: "advanced-search",
  },
  [FeatureFlag.COLLABORATION_TOOLS]: {
    event: "use-collaboration",
  },
  [FeatureFlag.PRIORITY_SUPPORT]: {
    event: "priority-support",
  },
  [FeatureFlag.AI_STUDY_ASSISTANT]: {
    event: "use-ai-study-assistant",
  },
  [FeatureFlag.AI_CONTENT_GENERATION]: {
    event: "generate-ai-content",
  },
  [FeatureFlag.AI_PERFORMANCE_INSIGHTS]: {
    event: "view-ai-insights",
  },
  [FeatureFlag.UNLIMITED_STORAGE]: {
    event: "unlimited-storage",
  },
  [FeatureFlag.THIRD_PARTY_INTEGRATIONS]: {
    event: "use-integrations",
  },
  [FeatureFlag.API_ACCESS]: {
    event: "api-access",
  },
  [FeatureFlag.DATA_IMPORT_EXPORT]: {
    event: "use-data-import-export",
  },
};

// Plan configurations
export const PLAN_FEATURES = {
  FREE: {
    name: "Free",
    description: "Perfect for getting started",
    features: [
      FeatureFlag.AI_CHAT_ASSISTANT,
      FeatureFlag.FILE_MANAGEMENT,
      FeatureFlag.ASSIGNMENT_TRACKING,
    ],
    limits: {
      [FeatureFlag.AI_CHAT_ASSISTANT]: 10, // 10 messages per day
      [FeatureFlag.FILE_MANAGEMENT]: 100, // 100MB storage
      [FeatureFlag.ASSIGNMENT_TRACKING]: 5, // 5 assignments
    },
  },
  STARTER: {
    name: "Starter",
    description: "Great for active students",
    features: [
      FeatureFlag.AI_CHAT_ASSISTANT,
      FeatureFlag.FILE_MANAGEMENT,
      FeatureFlag.ASSIGNMENT_TRACKING,
      FeatureFlag.SCHEDULE_PLANNING,
      FeatureFlag.COURSE_ANALYTICS,
      FeatureFlag.STUDY_REMINDERS,
      FeatureFlag.ADVANCED_SEARCH,
      FeatureFlag.DATA_IMPORT_EXPORT,
    ],
    limits: {
      [FeatureFlag.AI_CHAT_ASSISTANT]: 100, // 100 messages per day
      [FeatureFlag.FILE_MANAGEMENT]: 1000, // 1GB storage
      [FeatureFlag.ASSIGNMENT_TRACKING]: 50, // 50 assignments
      [FeatureFlag.ADVANCED_SEARCH]: 20, // 20 searches per day
    },
  },
  PRO: {
    name: "Pro",
    description: "Everything you need to excel",
    features: [
      FeatureFlag.AI_CHAT_ASSISTANT,
      FeatureFlag.FILE_MANAGEMENT,
      FeatureFlag.ASSIGNMENT_TRACKING,
      FeatureFlag.SCHEDULE_PLANNING,
      FeatureFlag.COURSE_ANALYTICS,
      FeatureFlag.STUDY_REMINDERS,
      FeatureFlag.CAMPUS_INTEGRATION,
      FeatureFlag.ADVANCED_SEARCH,
      FeatureFlag.COLLABORATION_TOOLS,
      FeatureFlag.PRIORITY_SUPPORT,
      FeatureFlag.AI_STUDY_ASSISTANT,
      FeatureFlag.AI_CONTENT_GENERATION,
      FeatureFlag.AI_PERFORMANCE_INSIGHTS,
      FeatureFlag.UNLIMITED_STORAGE,
      FeatureFlag.THIRD_PARTY_INTEGRATIONS,
      FeatureFlag.API_ACCESS,
      FeatureFlag.DATA_IMPORT_EXPORT,
    ],
    limits: {
      [FeatureFlag.AI_CHAT_ASSISTANT]: -1, // Unlimited
      [FeatureFlag.FILE_MANAGEMENT]: -1, // Unlimited storage
      [FeatureFlag.ASSIGNMENT_TRACKING]: -1, // Unlimited assignments
      [FeatureFlag.ADVANCED_SEARCH]: -1, // Unlimited searches
      [FeatureFlag.AI_STUDY_ASSISTANT]: 50, // 50 AI study sessions per day
      [FeatureFlag.AI_CONTENT_GENERATION]: 25, // 25 content generations per day
      [FeatureFlag.AI_PERFORMANCE_INSIGHTS]: 10, // 10 insights per week
    },
  },
} as const;
