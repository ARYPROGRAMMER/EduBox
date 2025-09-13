import { Id } from "@/convex/_generated/dataModel";

// Base types
export interface BaseEntity {
  _id: Id<any>;
  _creationTime: number;
  createdAt: number;
  updatedAt: number;
}

// User and Authentication types
export interface User extends BaseEntity {
  userId: string; // Clerk user ID
  email: string;
  name: string;
  imageUrl?: string;
  isOnline: boolean;
  lastActiveAt: number;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  fullName?: string;
  major?: string;
  year?: string;
  graduationYear?: number;
  gpa?: number;
  bio?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: string;
  profilePicture?: string;
}

export interface UserPreferences extends BaseEntity {
  userId: string;
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    assignments: boolean;
    events: boolean;
    grades: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    showGrades: boolean;
  };
  dashboardLayout: Record<string, any>;
}

// Academic types
export interface Course extends BaseEntity {
  userId: string;
  courseCode: string;
  title: string;
  instructor: string;
  credits: number;
  semester: string;
  year: number;
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    location?: string;
  };
  description?: string;
  gradeScale?: Record<string, number>;
  currentGrade?: number;
  targetGrade?: number;
  color?: string;
  isActive: boolean;
  syllabus?: string;
}

export interface Assignment extends BaseEntity {
  userId: string;
  courseId: Id<"courses">;
  courseName?: string;
  title: string;
  description?: string;
  type:
    | "homework"
    | "quiz"
    | "exam"
    | "project"
    | "lab"
    | "essay"
    | "presentation"
    | "other";
  priority: "low" | "medium" | "high";
  status:
    | "pending"
    | "in-progress"
    | "completed"
    | "submitted"
    | "graded"
    | "overdue";
  dueDate: number;
  submittedAt?: number;
  grade?: number;
  maxPoints?: number;
  feedback?: string;
  attachments?: Id<"files">[];
  estimatedHours?: number;
  actualHours?: number;
  reminderSet?: boolean;
}

export interface Event extends BaseEntity {
  userId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  isAllDay: boolean;
  location?: string;
  type:
    | "class"
    | "exam"
    | "assignment"
    | "study"
    | "personal"
    | "social"
    | "work"
    | "other";
  courseId?: Id<"courses">;
  color?: string;
  isRecurring: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEnd?: number;
  reminders?: number[]; // Array of minutes before event
  attendees?: string[];
  meetingLink?: string;
}

// File management types
export interface File extends BaseEntity {
  userId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  url: string;
  storageId: Id<"_storage">;
  category: "document" | "image" | "video" | "audio" | "other";
  tags: string[];
  description?: string;
  courseId?: Id<"courses">;
  assignmentId?: Id<"assignments">;
  isFavorite: boolean;
  isShared: boolean;
  sharedWith?: string[];
  accessLevel: "private" | "course" | "public";
  thumbnailUrl?: string;
  lastAccessedAt: number;
}

// Chat and AI types
export interface ChatSession extends BaseEntity {
  userId: string;
  sessionId: string;
  title: string;
  isActive: boolean;
  lastMessageAt: number;
  messageCount: number;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ChatMessage extends BaseEntity {
  sessionId: Id<"chatSessions">;
  userId: string;
  content: string;
  role: "user" | "assistant" | "system";
  messageType: "text" | "file" | "image" | "code" | "table";
  attachments?: {
    fileId?: Id<"files">;
    fileName?: string;
    fileType?: string;
    url?: string;
  }[];
  metadata?: {
    functionCalls?: string[];
    sources?: string[];
    confidence?: number;
    processingTime?: number;
  };
  isEdited: boolean;
  editedAt?: number;
  replyTo?: Id<"chatMessages">;
}

// Chat API types
export interface ChatRequest {
  message: string;
  sessionId: string;
  context?: Record<string, any>;
  attachments?: {
    type: string;
    content: string;
    metadata?: Record<string, any>;
  }[];
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
  actions?: {
    type: string;
    data: any;
  }[];
  metadata?: Record<string, any>;
}

// API and form types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

// Form validation types
export interface CourseFormData {
  courseCode: string;
  title: string;
  instructor: string;
  credits: number;
  semester: string;
  year: number;
  description?: string;
  color?: string;
}

export interface AssignmentFormData {
  title: string;
  description?: string;
  courseId: Id<"courses">;
  type: Assignment["type"];
  priority: Assignment["priority"];
  dueDate: string;
  estimatedHours?: number;
  reminderSet?: boolean;
}

export interface EventFormData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location?: string;
  type: Event["type"];
  courseId?: Id<"courses">;
  isRecurring: boolean;
  recurrencePattern?: Event["recurrencePattern"];
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Export all types for easy importing
export type { Id };
