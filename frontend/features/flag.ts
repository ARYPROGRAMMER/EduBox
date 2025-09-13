// export enum FeatureFlag {
//   AI_CHAT_ASSISTANT = "ai-chat-assistant",
//   FILE_MANAGEMENT = "file-management",
//   ASSIGNMENT_TRACKING = "assignment-tracking",
//   SCHEDULE_PLANNING = "schedule-planning",
//   COURSE_ANALYTICS = "course-analytics",
//   STUDY_REMINDERS = "study-reminders",
//   CAMPUS_INTEGRATION = "campus-integration",
// }

// export const featureFlagEvents: Record<FeatureFlag, { event: string }> = {
//   [FeatureFlag.AI_CHAT_ASSISTANT]: {
//     event: "use-ai-assistant",
//   },
//   [FeatureFlag.FILE_MANAGEMENT]: {
//     event: "manage-files",
//   },
//   [FeatureFlag.ASSIGNMENT_TRACKING]: {
//     event: "track-assignments",
//   },
//   [FeatureFlag.SCHEDULE_PLANNING]: {
//     event: "plan-schedule",
//   },
//   [FeatureFlag.COURSE_ANALYTICS]: {
//     event: "view-analytics",
//   },
//   [FeatureFlag.STUDY_REMINDERS]: {
//     event: "set-reminders",
//   },
//   [FeatureFlag.CAMPUS_INTEGRATION]: {
//     event: "access-campus-features",
//   },
// };


export enum FeatureFlag {
  TRANSCRIPTION = "transcription",
  IMAGE_GENERATION = "image-generation",
  ANALYSE_VIDEO = "analyse-video",
  TITLE_GENERATIONS = "title-generations",
  SCRIPT_GENERATION = "script-generation",
}

export const featureFlagEvents: Record<FeatureFlag, { event: string }> = {
  [FeatureFlag.TRANSCRIPTION]: {
    event: "transcribe",
  },
  [FeatureFlag.IMAGE_GENERATION]: {
    event: "generate-image",
  },
  [FeatureFlag.ANALYSE_VIDEO]: {
    event: "analyse-video",
  },
  [FeatureFlag.TITLE_GENERATIONS]: {
    event: "generate-title",
  },
  [FeatureFlag.SCRIPT_GENERATION]: {
    event: "",
  },
};
