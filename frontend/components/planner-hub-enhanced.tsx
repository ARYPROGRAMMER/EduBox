"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { enUS } from "date-fns/locale";
import { useFeatureGate } from "@/components/feature-gate";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  BookOpen,
  FileText,
  GraduationCap,
  Users,
  Target,
  UtensilsCrossed,
  Timer,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";
import {
  TaskBoard,
  TaskBoardChangeEvent,
} from "@progress/kendo-react-taskboard";
import { CourseCreationDialog } from "@/components/dialogs/course-creation-dialog";
import { AssignmentCreationDialog } from "@/components/dialogs/assignment-creation-dialog";
import { StudySessionTimer } from "@/components/dialogs/study-session-timer";
import { ScheduleEnhancerModal } from "@/components/schedule-enhancer-modal";
import { toast as sonnerToast } from "sonner";

interface Event {
  id: number;
  title: string;
  type: "exam" | "assignment" | "class" | "study" | "event";
  date: string;
  time: string;
  duration?: string;
  location: string;
  priority: "high" | "medium" | "low";
  color: string;
}

// Type definitions for optimized schedule
interface OptimizedScheduleItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  duration: number;
  startTime: number | string;
  description?: string;
}

interface OptimizedScheduleData {
  scheduleItems?: OptimizedScheduleItem[];
  optimized?: boolean;
  optimizationDate?: string;
  notes?: string;
  [key: string]: any;
}

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate: string;
  category: string;
}

export function PlannerHubEnhanced() {
  const { user: clerkUser } = useUser();
  const { user: convexUser } = useConvexUser();
  const { canUse: canUsePlanner } = useFeatureGate(
    FeatureFlag.SCHEDULE_PLANNING
  );
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [followedItems, setFollowedItems] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    type: "",
    location: "",
  });

  // Fetch real data from Convex
  const eventsArgs = useMemo(
    () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
    [convexUser?.clerkId]
  );
  const events = useQuery(api.events.getEvents, eventsArgs);
  const upcomingAssignments = useQuery(
    api.assignments.getUpcomingAssignments,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
      [convexUser?.clerkId]
    )
  );
  // Also fetch all assignments (history) so we can show past/completed items reliably
  const allAssignments = useQuery(
    api.assignments.getAssignments,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId, limit: 200 } : "skip"),
      [convexUser?.clerkId]
    )
  );

  const [optimisticAssignments, setOptimisticAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (allAssignments) {
      setOptimisticAssignments(allAssignments);
    }
  }, [allAssignments]);
  const courses = useQuery(
    api.courses.getCourses,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
      [convexUser?.clerkId]
    )
  );

  // Fetch schedule data
  const scheduleArgs = useMemo(
    () =>
      convexUser
        ? {
            userId: convexUser.clerkId,
            includeClasses: true,
            includeDining: true,
          }
        : "skip",
    [convexUser?.clerkId]
  );
  const scheduleData = useQuery(
    api.schedules.getCombinedSchedule,
    scheduleArgs
  );
  const schedulePreferences = useQuery(
    api.schedules.getSchedulePreferences,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
      [convexUser?.clerkId]
    )
  );

  // Fetch optimized schedules
  const optimizedSchedules = useQuery(
    api.schedules.getOptimizedSchedules,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
      [convexUser?.clerkId]
    )
  );
  const activeOptimizedSchedule = useQuery(
    api.schedules.getActiveOptimizedSchedule,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
      [convexUser?.clerkId]
    )
  );

  // Mutations
  const createEvent = useMutation(api.events.createEvent);
  const createAssignment = useMutation(api.assignments.createAssignment);
  const updateAssignment = useMutation(api.assignments.updateAssignment);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const deleteAssignment = useMutation(api.assignments.deleteAssignment);
  const markAssignment = useMutation(api.assignments.updateAssignment);
  const createStudySessionMutation = useMutation(
    api.analytics.createStudySession
  );
  const updateStudySession = useMutation(api.analytics.updateStudySession);
  const createCourse = useMutation(api.courses.createCourse);
  const updateCourse = useMutation(api.courses.updateCourse);
  const deleteCourse = useMutation(api.courses.deleteCourse);
  const applyOptimizedSchedule = useMutation(
    api.schedules.applyOptimizedSchedule
  );
  const deleteOptimizedSchedule = useMutation(
    api.schedules.deleteOptimizedSchedule
  );
  const dismissNotificationsByRelatedId = useMutation(
    api.notifications.dismissNotificationsByRelatedId
  );
  const createNotification = useMutation(api.notifications.createNotification);

  // Use simple loading state instead of useAsyncOperation
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
    try {
      const raw = localStorage.getItem("edubox.followedItems");
      if (raw) setFollowedItems(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const container = document.querySelector(
          "[data-taskboard-container]"
        ) as HTMLElement;
        if (container) {
          container.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .k-taskboard .k-taskboard-content {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .k-taskboard .k-taskboard-column {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .k-taskboard .k-taskboard-card {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      .k-taskboard.dragging {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Safe date formatting function to prevent hydration issues
  const formatDate = (date: Date) => {
    if (!mounted) return "";
    return date.toLocaleDateString();
  };

  const formatDateString = (dateString: string) => {
    if (!mounted) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateEvent = async () => {
    if (!convexUser || !newEvent.title || !newEvent.startTime) return;

    setIsCreatingEvent(true);
    try {
      const startTime = new Date(newEvent.startTime).getTime();
      const endTime = newEvent.endTime
        ? new Date(newEvent.endTime).getTime()
        : startTime + 60 * 60 * 1000; // Default 1 hour

      await createEvent({
        userId: convexUser.clerkId,
        title: newEvent.title,
        description: newEvent.description,
        startTime,
        endTime,
        type: newEvent.type || "personal",
        location: newEvent.location,
      });

      setNewEvent({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        type: "",
        location: "",
      });
      setShowEventModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const toggleFollow = (key: string) => {
    setFollowedItems((prev) => {
      const idx = prev.indexOf(key);
      let next: string[];
      if (idx === -1) next = [...prev, key];
      else next = prev.filter((p) => p !== key);
      try {
        localStorage.setItem("edubox.followedItems", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Helper function to convert schedule items to calendar events
  const convertScheduleToEvents = () => {
    if (!scheduleData || !schedulePreferences) return [];

    const scheduleEvents: any[] = [];
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

    // Generate events for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const eventDate = new Date(currentWeekStart);
        eventDate.setDate(currentWeekStart.getDate() + week * 7 + day);

        const dayName = eventDate.toLocaleDateString("en-US", {
          weekday: "long",
        });

        // Add college classes if enabled
        if (
          schedulePreferences.showClassesInCalendar !== false &&
          scheduleData.classes
        ) {
          scheduleData.classes
            .filter((cls: any) => cls.dayOfWeek === dayName)
            .forEach((cls: any) => {
              const startDateTime = new Date(eventDate);
              const [startHour, startMin] = cls.startTime.split(":");
              startDateTime.setHours(
                parseInt(startHour),
                parseInt(startMin),
                0,
                0
              );

              const endDateTime = new Date(eventDate);
              const [endHour, endMin] = cls.endTime.split(":");
              endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

              scheduleEvents.push({
                _id: `class-${cls._id}-${week}-${day}`,
                title: cls.subject,
                description: `${cls.code ? cls.code + " - " : ""}${
                  cls.instructor ? "Prof. " + cls.instructor : ""
                }`,
                startTime: startDateTime.getTime(),
                endTime: endDateTime.getTime(),
                type: "class",
                location: cls.location || "",
                color: cls.color || "#3b82f6",
                isSchedule: true,
                scheduleType: "class",
              });
            });
        }

        // Add dining times if enabled
        if (
          schedulePreferences.showDiningInCalendar !== false &&
          scheduleData.dining
        ) {
          scheduleData.dining
            .filter(
              (meal: any) =>
                meal.dayOfWeek === dayName || meal.dayOfWeek === "Daily"
            )
            .filter((meal: any) => meal.isEnabled !== false)
            .forEach((meal: any) => {
              const startDateTime = new Date(eventDate);
              const [startHour, startMin] = meal.startTime.split(":");
              startDateTime.setHours(
                parseInt(startHour),
                parseInt(startMin),
                0,
                0
              );

              const endDateTime = new Date(eventDate);
              const [endHour, endMin] = meal.endTime.split(":");
              endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

              scheduleEvents.push({
                _id: `meal-${meal._id}-${week}-${day}`,
                title: `${
                  meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)
                }`,
                description: meal.location
                  ? `at ${meal.location}`
                  : "Meal time",
                startTime: startDateTime.getTime(),
                endTime: endDateTime.getTime(),
                type: "dining",
                location: meal.location || "",
                color: "#10b981",
                isSchedule: true,
                scheduleType: "dining",
                specialNotes: meal.specialNotes,
              });
            });
        }
      }
    }

    return scheduleEvents;
  };

  // Convert events and assignments to calendar format
  const baseEvents = events || [];
  const scheduleEvents = convertScheduleToEvents();
  // Fetch recent study sessions to show in calendar/upcoming events
  const studySessionsArgs = useMemo(
    () =>
      convexUser
        ? {
            userId: convexUser.clerkId,
            startDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago for history
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days in future for upcoming
            limit: 200, // Increase limit for more history
          }
        : "skip",
    [convexUser?.clerkId]
  );
  const studySessions = useQuery(
    api.analytics.getStudySessions,
    studySessionsArgs
  );
  // Map study sessions to calendar event shape
  const studySessionEvents = (studySessions || []).map((s: any) => ({
    _id: s._id,
    title: s.title || s.subject || "Study Session",
    description: s.description || "",
    startTime: s.startTime,
    endTime:
      s.endTime ||
      s.startTime + (s.duration || s.plannedDuration || 0) * 60 * 1000,
    type: "study",
    location: s.location || "",
    duration: s.duration || s.plannedDuration || undefined,
    audioQueue: s.audioQueue || [],
    isStudySession: true,
  }));

  const calendarEvents = [
    ...baseEvents,
    ...scheduleEvents,
    ...studySessionEvents,
  ];
  // Prefer upcomingAssignments for the immediate UI; for history and task management use the full allAssignments list.
  const assignments =
    Array.isArray(upcomingAssignments) && upcomingAssignments.length > 0
      ? upcomingAssignments
      : Array.isArray(allAssignments)
      ? allAssignments
      : [];

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];

    const dayEvents = calendarEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime).toISOString().split("T")[0];
      return eventDate === dateString;
    });

    const dayAssignments = assignments.filter((assignment: any) => {
      const assignmentDate = new Date(assignment.dueDate)
        .toISOString()
        .split("T")[0];
      return assignmentDate === dateString;
    });

    return [...dayEvents, ...dayAssignments];
  };

  const upcomingEvents =
    mounted && calendarEvents
      ? calendarEvents
          .filter((event: any) => new Date(event.startTime) >= new Date())
          .sort(
            (a: any, b: any) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          .slice(0, 5)
      : [];

  // Group assignments into pending, completed and overdue
  const pendingAssignments = (assignments || []).filter(
    (assignment: any) => assignment.status === "pending"
  );
  const completedAssignments = (assignments || []).filter(
    (assignment: any) => assignment.status === "completed"
  );
  const overdueAssignments = (assignments || []).filter((assignment: any) => {
    if (assignment.status === "completed") return false;
    try {
      return Date.now() > new Date(assignment.dueDate).getTime();
    } catch (e) {
      return false;
    }
  });

  // Process courses
  const upcomingCourses = (courses || []).filter(
    (course: any) => course.status === "active" || !course.status
  );
  const completedCourses = (courses || []).filter(
    (course: any) => course.status === "completed"
  );

  // Process study sessions
  const upcomingSessions = (studySessions || []).filter(
    (session: any) => !session.isCompleted && session.startTime
  );
  const completedSessions = (studySessions || []).filter(
    (session: any) => session.isCompleted
  );

  // Calculate exams this week
  const getExamsThisWeek = () => {
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const examsThisWeek = calendarEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return (
        event.type === "exam" &&
        eventDate >= today &&
        eventDate <= oneWeekFromNow
      );
    });

    return examsThisWeek.length;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return <BookOpen className="w-4 h-4" />;
      case "assignment":
        return <FileText className="w-4 h-4" />;
      case "class":
        return <GraduationCap className="w-4 h-4" />;
      case "dining":
        return <UtensilsCrossed className="w-4 h-4" />;
      case "study":
        return <Users className="w-4 h-4" />;
      case "event":
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  // Read ?session=<id> and fetch that session to focus in the calendar
  const searchParams = useSearchParams();
  const sessionParam = searchParams ? searchParams.get("session") : null;
  const fetchedSessionArgs = useMemo(
    () =>
      sessionParam
        ? { sessionId: sessionParam as unknown as Id<"studySessions"> }
        : "skip",
    [sessionParam]
  );
  const fetchedSession = useQuery(
    api.analytics.getStudySession,
    fetchedSessionArgs
  );

  const router = useRouter();

  // Local state for inline Task modal (Task Management area)
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [taskDueDate, setTaskDueDate] = useState("");
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  // Selected assignment for details dialog
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(
    null
  );

  // If the user has active timers, show them in the planner for quick access
  const activeTimers = useQuery(
    api.analytics.getActiveStudySessionsForUser,
    useMemo(
      () => (convexUser ? { userId: convexUser.clerkId } : "skip"),
      [convexUser?.clerkId]
    )
  );

  const deleteStudySession = useMutation(api.analytics.deleteStudySession);
  // Mutation to delete expired sessions (cleanup)
  const deleteExpiredStudySessions = useMutation(
    api.analytics.deleteExpiredStudySessions
  );
  const deleteAssignmentMutation = useMutation(
    api.assignments.deleteAssignment
  );

  // Run a one-time cleanup when the planner mounts to remove expired lingering sessions
  useEffect(() => {
    if (!convexUser) return;
    let mounted = true;
    (async () => {
      try {
        const res = await deleteExpiredStudySessions({
          userId: convexUser.clerkId,
        });
        if (!mounted) return;
        if (res && res.deleted && res.deleted > 0) {
          try {
            sonnerToast.success(
              `Cleaned up ${res.deleted} expired study session${
                res.deleted > 1 ? "s" : ""
              }.`
            );
            // Refresh the page to update any active timers shown
            router.refresh();
          } catch (e) {
            // ignore toast failures
          }
        }
      } catch (e) {
        // non-fatal; log in dev
        if (process.env.NODE_ENV !== "production")
          console.debug("deleteExpiredStudySessions failed", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [convexUser?.clerkId]);

  // Auto-mark overdue assignments (best-effort, non-blocking)
  useEffect(() => {
    if (!convexUser || !Array.isArray(allAssignments)) return;
    (async () => {
      try {
        const now = Date.now();
        for (const a of allAssignments) {
          if (!a.dueDate) continue;
          if (a.status !== "completed" && new Date(a.dueDate).getTime() < now) {
            try {
              await markAssignment({
                assignmentId: a._id,
                userId: convexUser.clerkId,
                updates: { status: "overdue" },
              });
            } catch (e) {
              // ignore per-item failures
            }
          }
        }
      } catch (e) {}
    })();
  }, [convexUser?.clerkId, allAssignments]);

  const handleDeleteAssignment = async (assignment: any) => {
    if (!convexUser) return;
    try {
      await deleteAssignment({
        assignmentId: assignment._id as Id<"assignments">,
        userId: convexUser.clerkId,
      });
      sonnerToast.success("Assignment deleted");
      setSelectedAssignment(null);
    } catch (e) {
      sonnerToast.error("Failed to delete assignment");
    }
  };

  const handleToggleAssignmentComplete = async (assignment: any) => {
    if (!convexUser) return;
    try {
      const newStatus =
        assignment.status === "completed" ? "pending" : "completed";
      await markAssignment({
        assignmentId: assignment._id,
        userId: convexUser.clerkId,
        updates: {
          status: newStatus,
          submittedDate: newStatus === "completed" ? Date.now() : undefined,
        },
      });

      // #codebase: Add notifications for assignment completion
      if (newStatus === "completed") {
        try {
          // Dismiss any previous assignment notifications
          await dismissNotificationsByRelatedId({
            userId: convexUser.clerkId,
            relatedId: assignment._id,
            relatedType: "assignment",
            excludeType: "assignment_completed",
          });

          // Create completion notification
          await createNotification({
            userId: convexUser.clerkId,
            title: "Assignment completed! ✅",
            message: `Great work! You've completed "${assignment.title}".`,
            type: "assignment_completed",
            relatedId: assignment._id,
            relatedType: "assignment",
            priority: "low",
            actionUrl: `/dashboard/planner`,
            actionLabel: "View Planner",
          });
        } catch (notificationError) {
          console.warn(
            "Failed to create assignment completion notification:",
            notificationError
          );
        }
      }

      sonnerToast.success("Assignment updated");
      setSelectedAssignment(null);
    } catch (e) {
      sonnerToast.error("Failed to update assignment");
    }
  };

  const handleSaveAssignment = async (updates: any) => {
    if (!convexUser || !selectedAssignment) return;
    try {
      await updateAssignment({
        assignmentId: selectedAssignment._id,
        userId: convexUser.clerkId,
        updates,
      });
      sonnerToast.success("Assignment saved");
      setSelectedAssignment(null);
    } catch (e) {
      console.error("Failed to save assignment", e);
      sonnerToast.error("Failed to save assignment");
    }
  };

  // Course handlers
  const handleDeleteCourse = async (courseId: string) => {
    if (!convexUser) return;
    try {
      await deleteCourse({
        courseId: courseId as Id<"courses">,
        userId: convexUser.clerkId,
      });
      sonnerToast.success("Course deleted");
      try {
        router.refresh();
      } catch (e) {}
    } catch (e) {
      sonnerToast.error("Failed to delete course");
    }
  };

  // Study session handlers
  const handleCompleteSession = async (sessionId: string) => {
    if (!convexUser) return;
    try {
      await updateStudySession({
        sessionId: sessionId as Id<"studySessions">,
        isCompleted: true,
        endTime: Date.now(),
      });

      // #codebase: Dismiss previous study session started notifications and create completion notification
      try {
        // Dismiss any previous "started" notifications for this session
        await dismissNotificationsByRelatedId({
          userId: convexUser.clerkId,
          relatedId: sessionId,
          relatedType: "study_session",
          excludeType: "study_session_completed", // Don't dismiss completion notifications
        });

        // Create completion notification
        await createNotification({
          userId: convexUser.clerkId,
          title: "Study session completed! 🎉",
          message: `Great job! You've successfully completed your study session.`,
          type: "study_session_completed",
          relatedId: sessionId,
          relatedType: "study_session",
          priority: "low",
          actionUrl: `/dashboard/planner`,
          actionLabel: "View Planner",
        });
      } catch (notificationError) {
        console.warn("Failed to update notifications:", notificationError);
      }

      sonnerToast.success("Study session completed");
    } catch (e) {
      sonnerToast.error("Failed to complete session");
      console.error("Error completing session:", e);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!convexUser) return;
    try {
      await deleteStudySession({
        sessionId: sessionId as Id<"studySessions">,
      });
      sonnerToast.success("Study session deleted");
      try {
        router.refresh();
      } catch (e) {}
    } catch (e) {
      sonnerToast.error("Failed to delete session");
    }
  };

  const [showEnhancerModal, setShowEnhancerModal] = useState(false);

  // Diagnostic: count renders to help find infinite render loops
  const _renderCountRef = useRef(0);
  _renderCountRef.current += 1;
  // Log basic diagnostics in development only
  if (process.env.NODE_ENV !== "production") {
    try {
      // eslint-disable-next-line no-console
      console.debug("[PlannerHubEnhanced] render", _renderCountRef.current, {
        fetchedSessionId: (fetchedSession as any)?._id,
        selectedDate: selectedDate ? selectedDate.toISOString() : null,
      });
    } catch (e) {
      // ignore logging errors
    }
  }

  // Avoid render loops: track the last focused session id in a stable React ref
  const lastFocusedSessionIdRef = useRef<string | null>(null);

  // More detailed diagnostics: track key hook outputs and compare between renders
  const _prevDiagRef = useRef<any>(null);
  if (process.env.NODE_ENV !== "production") {
    const diag = {
      canUsePlanner,
      mounted,
      convexUserId: (convexUser as any)?.clerkId,
      eventsCount: Array.isArray(events)
        ? events.length
        : events
        ? "obj"
        : null,
      scheduleDataPresent: !!scheduleData,
      studySessionsCount: Array.isArray(studySessions)
        ? studySessions.length
        : studySessions
        ? "obj"
        : null,
      activeTimersCount: Array.isArray(activeTimers)
        ? activeTimers.length
        : activeTimers
        ? "obj"
        : null,
      fetchedSessionId: (fetchedSession as any)?._id,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
    };

    try {
      const prev = _prevDiagRef.current;
      if (!prev) {
        // first render
        // eslint-disable-next-line no-console
        console.debug("[PlannerHubEnhanced] initial diag", diag);
      } else {
        const diffs: any = {};
        Object.keys(diag).forEach((k) => {
          if (String(prev[k]) !== String((diag as any)[k]))
            diffs[k] = { before: prev[k], after: (diag as any)[k] };
        });
        if (Object.keys(diffs).length > 0) {
          // eslint-disable-next-line no-console
          console.debug("[PlannerHubEnhanced] diag diffs", diffs);
        }
      }
      _prevDiagRef.current = diag;
    } catch (e) {
      // ignore diagnostics errors
    }
  }

  useEffect(() => {
    if (!fetchedSession) return;

    const fetchedId = (fetchedSession as any)?._id;
    if (!fetchedId) return;

    // Diagnostic log when effect runs
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[PlannerHubEnhanced] fetchedSession effect run", {
        fetchedId,
        lastFocused: lastFocusedSessionIdRef.current,
      });
    }

    // Only run the focus logic when the fetched session id actually changes.
    if (lastFocusedSessionIdRef.current === fetchedId) return;
    lastFocusedSessionIdRef.current = fetchedId;

    // set the selected date to the session start date
    const date = fetchedSession.startTime
      ? new Date(fetchedSession.startTime)
      : undefined;
    if (date) {
      if (!selectedDate || date.getTime() !== selectedDate.getTime()) {
        setSelectedDate(date);
      }
    }

    // Scroll the specific session card into view so users notice the selection
    try {
      const sel = document.querySelector(`[data-session-id="${fetchedId}"]`);
      if (sel && typeof (sel as any).scrollIntoView === "function")
        (sel as any).scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      // ignore
    }
    // Note: intentionally do not include selectedDate in deps to avoid loops.
  }, [fetchedSession]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200";
    }
  };

  // Diagnostic: log feature gate state
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[PlannerHubEnhanced] canUsePlanner", canUsePlanner);
  }

  // If the user can't use the planner feature, render the LockedFeature wrapper
  // so it can show upgrade UI. Otherwise render the planner UI directly. This
  // avoids potential side-effects in LockedFeature causing repeated remounts.
  if (!canUsePlanner) {
    return (
      <LockedFeature
        feature={FeatureFlag.SCHEDULE_PLANNING}
        requiredPlan="STARTER"
      >
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {upcomingEvents.length}
                    </p>
                    <p className="text-sm text-blue-600/70">Upcoming Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* ... keep LockedFeature placeholder minimal; we reuse original UI below when enabled */}
          </div>
        </div>
      </LockedFeature>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {upcomingEvents.length}
                  </p>
                  <p className="text-sm text-blue-600/70">Upcoming Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* assignments summary removed from top; assignments are shown in Task Management below */}

          {/* Diagnostic: show assignment counts so we can see whether assignments are being fetched */}
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">
                <div>
                  Upcoming:{" "}
                  {Array.isArray(upcomingAssignments)
                    ? upcomingAssignments.length
                    : "—"}
                </div>
                <div>
                  All:{" "}
                  {Array.isArray(allAssignments) ? allAssignments.length : "—"}
                </div>
                <div>Pending: {pendingAssignments.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    {getExamsThisWeek()}
                  </p>
                  <p className="text-sm text-red-600/70">Exams This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(
                      (completedAssignments.length / assignments.length) * 100
                    ) || 0}
                    %
                  </p>
                  <p className="text-sm text-green-600/70">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active persistent timer banner (handles multiple active timers) */}
        {activeTimers && activeTimers.length > 0 && (
          <div className="space-y-2">
            {activeTimers.map((t: any) => (
              <div
                key={t._id}
                className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 rounded p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Timer className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {t.title || "Active Study Session"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Started{" "}
                      {mounted
                        ? new Date(t.startTime).toLocaleTimeString()
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <StudySessionTimer editSessionId={t._id}>
                    <button className="btn btn-sm px-3 py-1 border">
                      Edit
                    </button>
                  </StudySessionTimer>
                  <button
                    onClick={async () => {
                      try {
                        await deleteStudySession({ sessionId: t._id });
                      } catch (e) {
                        console.error("delete failed", e);
                      }
                    }}
                    className="btn btn-sm px-3 py-1 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CourseCreationDialog>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Add Course</h4>
                    <p className="text-sm text-muted-foreground">
                      Create new course
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </CourseCreationDialog>

          <AssignmentCreationDialog>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Add Assignment</h4>
                    <p className="text-sm text-muted-foreground">
                      Track due dates
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </AssignmentCreationDialog>

          <StudySessionTimer>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Timer className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Study Session</h4>
                    <p className="text-sm text-muted-foreground">
                      Track study time
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </StudySessionTimer>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="xl:col-span-2 space-y-6">
            <Card data-session-id={fetchedSession?._id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Academic Calendar</CardTitle>
                    <CardDescription>
                      Manage your schedule and important dates
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={viewMode === "month" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("month")}
                    >
                      Month
                    </Button>
                    <Button
                      variant={viewMode === "week" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("week")}
                    >
                      Week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open("/dashboard/profile#schedules", "_blank")
                      }
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Manage Schedule
                    </Button>
                    <Dialog
                      open={showEventModal}
                      onOpenChange={setShowEventModal}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Event</DialogTitle>
                          <DialogDescription>
                            Create a new event in your academic calendar
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Event title"
                            value={newEvent.title}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                title: e.target.value,
                              })
                            }
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              placeholder="Start time"
                              value={newEvent.startTime}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  startTime: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="datetime-local"
                              placeholder="End time"
                              value={newEvent.endTime}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  endTime: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Select
                            value={newEvent.type}
                            onValueChange={(value) =>
                              setNewEvent({ ...newEvent, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Event type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="assignment">
                                Assignment
                              </SelectItem>
                              <SelectItem value="class">Class</SelectItem>
                              <SelectItem value="study">
                                Study Session
                              </SelectItem>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="event">
                                Campus Event
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Location"
                            value={newEvent.location}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                location: e.target.value,
                              })
                            }
                          />
                          <Textarea
                            placeholder="Description (optional)"
                            value={newEvent.description}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                description: e.target.value,
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={handleCreateEvent}
                              disabled={isCreatingEvent}
                            >
                              {isCreatingEvent ? "Creating..." : "Save Event"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowEventModal(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {mounted ? (
                  <div>
                    {viewMode === "month" ? (
                      <div data-planner-calendar>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-md border w-full"
                          locale={enUS}
                          showOutsideDays={true}
                          // Provide visual markers for events, assignments and study sessions
                          events={[
                            ...(calendarEvents || []).map((ev: any) => ({
                              date: ev.startTime || ev.dueDate,
                              type:
                                ev.type ||
                                (ev.isStudySession ? "study" : "event"),
                            })),
                            ...(assignments || []).map((a: any) => ({
                              date: a.dueDate,
                              type: "assignment",
                            })),
                          ]}
                        />
                      </div>
                    ) : (
                      // Week view implementation
                      <div className="rounded-md border w-full">
                        <div className="grid grid-cols-7 gap-1 p-4">
                          {[
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].map((day) => (
                            <div
                              key={day}
                              className="font-medium text-center p-2 text-sm"
                            >
                              {day}
                            </div>
                          ))}
                          {(() => {
                            const startOfWeek = new Date(
                              selectedDate || new Date()
                            );
                            startOfWeek.setDate(
                              startOfWeek.getDate() - startOfWeek.getDay()
                            );

                            return Array.from({ length: 7 }, (_, i) => {
                              const date = new Date(startOfWeek);
                              date.setDate(startOfWeek.getDate() + i);
                              const isSelected =
                                selectedDate &&
                                date.toDateString() ===
                                  selectedDate.toDateString();
                              const hasEvents =
                                getEventsForDate(date).length > 0;

                              return (
                                <button
                                  key={i}
                                  onClick={() => setSelectedDate(date)}
                                  className={`
                                    p-3 text-center rounded-lg border transition-colors min-h-[80px] flex flex-col justify-between
                                    ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                    }
                                    ${hasEvents ? "border-blue-300" : ""}
                                  `}
                                >
                                  <span className="font-medium">
                                    {date.getDate()}
                                  </span>
                                  {hasEvents && (
                                    <div className="flex items-center justify-center gap-1 mt-2">
                                      {getEventsForDate(date)
                                        .slice(0, 3)
                                        .map((event: any, idx: number) => (
                                          <span
                                            key={idx}
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                              background:
                                                event.type === "assignment"
                                                  ? "#f59e0b"
                                                  : event.type === "study"
                                                  ? "#10b981"
                                                  : "#3b82f6",
                                            }}
                                          />
                                        ))}
                                      {getEventsForDate(date).length > 3 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{getEventsForDate(date).length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border w-full h-64 bg-muted animate-pulse" />
                )}

                {fetchedSession && (
                  <div className="mt-4" data-session-id={fetchedSession._id}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Focused Study Session
                        </CardTitle>
                        <CardDescription>
                          {fetchedSession.title || fetchedSession.subject}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">
                              Date:{" "}
                              {mounted
                                ? new Date(
                                    fetchedSession.startTime
                                  ).toLocaleDateString()
                                : ""}
                            </p>
                            <p className="text-sm">
                              Planned:{" "}
                              {fetchedSession.plannedDuration
                                ? `${fetchedSession.plannedDuration} min`
                                : `${Math.round(
                                    fetchedSession.duration || 0
                                  )} min`}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Events for Selected Date */}
                {selectedDate && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">
                      Events for{" "}
                      {selectedDate && mounted
                        ? formatDate(selectedDate)
                        : "Selected Date"}
                    </h4>
                    <div className="space-y-2">
                      {mounted && selectedDate
                        ? getEventsForDate(selectedDate).map((event: any) => (
                            <div
                              key={event._id || event.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(
                                  event.priority
                                )}`}
                              >
                                {getEventTypeIcon(event.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{event.title}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={getPriorityColor(event.priority)}
                                >
                                  {event.priority}
                                </Badge>
                                {event.isStudySession && (
                                  <StudySessionTimer editSessionId={event._id}>
                                    <button className="btn btn-sm border">
                                      View
                                    </button>
                                  </StudySessionTimer>
                                )}
                              </div>
                            </div>
                          ))
                        : []}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle className="text-xl">Task Management</CardTitle>
                    <CardDescription>
                      Track your assignments and todos with drag-and-drop
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Dialog
                      open={showTaskModal}
                      onOpenChange={setShowTaskModal}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>
                            Create a new task to track your progress
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Task title"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                          />
                          <Select
                            value={taskPriority}
                            onValueChange={(v: any) => setTaskPriority(v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">
                                High Priority
                              </SelectItem>
                              <SelectItem value="medium">
                                Medium Priority
                              </SelectItem>
                              <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            placeholder="Due date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={async () => {
                                // Inline create a lightweight assignment when user saves a task
                                if (!convexUser) {
                                  sonnerToast.error(
                                    "You must be logged in to create a task."
                                  );
                                  return;
                                }
                                if (!taskTitle.trim() || !taskDueDate) {
                                  sonnerToast.error(
                                    "Please provide a title and due date for the task."
                                  );
                                  return;
                                }
                                try {
                                  setIsTaskSubmitting(true);
                                  const due = new Date(
                                    `${taskDueDate}T23:59`
                                  ).getTime();
                                  await createAssignment({
                                    userId: convexUser.clerkId,
                                    title: taskTitle.trim(),
                                    dueDate: due,
                                    priority: taskPriority,
                                    assignedDate: Date.now(),
                                  });
                                  sonnerToast.success(
                                    `Task "${taskTitle}" created.`
                                  );
                                  // Reset local form
                                  setTaskTitle("");
                                  setTaskPriority("medium");
                                  setTaskDueDate("");
                                  setShowTaskModal(false);
                                } catch (e) {
                                  console.error("Failed to create task", e);
                                  sonnerToast.error("Failed to create task.");
                                } finally {
                                  setIsTaskSubmitting(false);
                                }
                              }}
                              disabled={isTaskSubmitting}
                            >
                              {isTaskSubmitting ? "Saving..." : "Save Task"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowTaskModal(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEnhancerModal(true)}
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      Enhance Schedule
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>
                      {completedAssignments.length}/{assignments.length}{" "}
                      completed
                    </span>
                  </div>
                  <Progress
                    value={
                      (completedAssignments.length / assignments.length) *
                        100 || 0
                    }
                    className="h-2"
                  />
                </div>

                {(() => {
                  // Define assignments and completedAssignments from optimistic state
                  const assignments = optimisticAssignments || [];
                  const completedAssignments = assignments.filter(
                    (a: any) => a.status === "completed"
                  );

                  if (allAssignments === undefined || courses === undefined) {
                    return (
                      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-center h-64">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-muted-foreground">
                              Loading your tasks...
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const columnData = [
                    {
                      id: 1,
                      title: "To Do",
                      status: "pending",
                      color: "#64748b",
                    },
                    {
                      id: 2,
                      title: "In Progress",
                      status: "in-progress",
                      color: "#f59e0b",
                    },
                    {
                      id: 3,
                      title: "Done",
                      status: "completed",
                      color: "#10b981",
                    },
                    {
                      id: 4,
                      title: "Overdue",
                      status: "overdue",
                      color: "#ef4444",
                    },
                  ];

                  const cardData =
                    assignments?.map((assignment: any) => ({
                      id: assignment._id,
                      title: assignment.title,
                      description: assignment.description || "",
                      status: assignment.status,
                      priority: assignment.priority,
                      dueDate: assignment.dueDate,
                      courseId: assignment.courseId,
                      courseName: assignment.courseId
                        ? courses?.find(
                            (c: any) => c._id === assignment.courseId
                          )?.courseName
                        : null,
                    })) || [];

                  interface TaskBoardTask {
                    id: string | number | undefined;
                    title: string;
                    description: string;
                    status: string;
                    priority: string;
                    dueDate?: string;
                    courseId?: string;
                    courseName?: string;
                  }

                  interface TaskBoardColumn {
                    id: number;
                    title: string;
                    status: string;
                    color: string;
                  }

                  const handleTaskBoardChange = async (
                    event: TaskBoardChangeEvent
                  ) => {
                    console.log("TaskBoard change event:", event);

                    if (!event || typeof event !== "object") {
                      console.error("Invalid event object:", event);
                      sonnerToast.error("Failed to move task", {
                        description: "Invalid event data received.",
                        duration: 5000,
                      });
                      return;
                    }

                    let card: TaskBoardTask | null = null;
                    let column: TaskBoardColumn | null = null;
                    let newStatus: string | null = null;

                    if (
                      event.type === "task" &&
                      event.item &&
                      !event.previousItem
                    ) {
                      console.log("Task creation event detected");

                      sonnerToast.info(
                        "Use the 'Add Task' button above to add new tasks",
                        {
                          description:
                            "Click the button above the TaskBoard to create a new tasks/assignments.",
                          duration: 4000,
                        }
                      );
                      return;
                    }

                    if (
                      event.type === "task" &&
                      !event.item &&
                      event.previousItem
                    ) {
                      console.log("Task deletion event detected");
                      const deletedTask = event.previousItem as any;
                      if (deletedTask && deletedTask.id) {
                        try {
                          await deleteAssignment({
                            assignmentId: deletedTask.id as Id<"assignments">,
                            userId: convexUser?.clerkId || "",
                          });
                          sonnerToast.success("Task deleted successfully", {
                            description: `${deletedTask.title} has been removed.`,
                            duration: 3000,
                          });
                          return;
                        } catch (err) {
                          console.error("Failed to delete task:", err);
                          sonnerToast.error("Failed to delete task", {
                            description:
                              "Please try again or contact support if the issue persists.",
                            duration: 5000,
                          });
                          return;
                        }
                      }
                    }

                    // Check if this is a task selection event (task clicked but not moved)
                    if (
                      event.type === "task" &&
                      event.item &&
                      event.previousItem &&
                      event.item.id === event.previousItem.id &&
                      event.item.status === event.previousItem.status
                    ) {
                      // This is a task selection/click event
                      console.log("Task selection event detected");
                      const selectedTask = event.item as any;
                      if (selectedTask && selectedTask.id) {
                        // Find the full assignment object
                        const assignment = assignments?.find(
                          (a: any) => a._id === selectedTask.id
                        );
                        if (assignment) {
                          setSelectedAssignment(assignment);
                          sonnerToast.info(`Selected: ${assignment.title}`, {
                            description: "Press Delete key to remove this task",
                            duration: 2000,
                          });
                          return;
                        }
                      }
                    }

                    // Check if this is a task change event
                    if (
                      event.type === "task" &&
                      event.item &&
                      event.previousItem &&
                      typeof event.item === "object" &&
                      "status" in event.item
                    ) {
                      // Task move event - item contains the moved task with updated status
                      const kendoTask = event.item as any; // Use any to bypass strict typing for Kendo model
                      card = {
                        id: kendoTask.id,
                        title: kendoTask.title,
                        description: kendoTask.description || "",
                        status: kendoTask.status,
                        priority:
                          typeof kendoTask.priority === "object"
                            ? kendoTask.priority.priority
                            : kendoTask.priority,
                        dueDate: kendoTask.dueDate,
                        courseId: kendoTask.courseId,
                        courseName: kendoTask.courseName,
                      };
                      // Find the target column based on the card's new status
                      const targetColumn = columnData.find(
                        (col: TaskBoardColumn) => col.status === card!.status
                      );
                      if (targetColumn) {
                        column = targetColumn;
                        newStatus = targetColumn.status;
                      }
                    } else if (
                      event.data &&
                      Array.isArray(event.data) &&
                      event.data.length > 0
                    ) {
                      // Fallback: use the first item from data array
                      const firstItem = event.data[0];
                      if (
                        firstItem &&
                        typeof firstItem === "object" &&
                        "id" in firstItem &&
                        "title" in firstItem &&
                        "status" in firstItem
                      ) {
                        // Convert Kendo TaskBoardTaskModel to our TaskBoardTask interface
                        const kendoTask = firstItem as any; // Use any to bypass strict typing for Kendo model
                        card = {
                          id: kendoTask.id,
                          title: kendoTask.title,
                          description: kendoTask.description || "",
                          status: kendoTask.status,
                          priority:
                            typeof kendoTask.priority === "object"
                              ? kendoTask.priority.priority
                              : kendoTask.priority,
                          dueDate: kendoTask.dueDate,
                          courseId: kendoTask.courseId,
                          courseName: kendoTask.courseName,
                        };
                        const targetColumn = columnData.find(
                          (col: TaskBoardColumn) => col.status === card!.status
                        );
                        if (targetColumn) {
                          column = targetColumn;
                          newStatus = targetColumn.status;
                        }
                      }
                    }

                    // Validate extracted data
                    if (!card || !card.id || !card.title) {
                      console.error("Invalid card object:", card);
                      sonnerToast.error("Failed to move task", {
                        description: "Invalid card data received.",
                        duration: 5000,
                      });
                      return;
                    }

                    if (!column || !column.title || !newStatus) {
                      console.error(
                        "Invalid column object or status:",
                        column,
                        newStatus
                      );
                      sonnerToast.error("Failed to move task", {
                        description: "Invalid column data received.",
                        duration: 5000,
                      });
                      return;
                    }

                    try {
                      // Process task movement in background without loading state
                      // Get the previous status from previousItem if available
                      const previousStatus =
                        event.previousItem &&
                        typeof event.previousItem === "object" &&
                        "status" in event.previousItem
                          ? event.previousItem.status
                          : card.status;

                      if (previousStatus !== newStatus) {
                        // Update local state immediately for instant UI feedback
                        setOptimisticAssignments((prev) =>
                          prev.map((assignment) =>
                            assignment._id === card.id
                              ? { ...assignment, status: newStatus }
                              : assignment
                          )
                        );

                        // Convert string ID to Convex ID type
                        const assignmentId = card.id as Id<"assignments">;

                        // Sync with server in background (don't await)
                        markAssignment({
                          assignmentId,
                          userId: convexUser?.clerkId || "",
                          updates: {
                            status: newStatus,
                            ...(newStatus === "completed" && {
                              submittedDate: Date.now(),
                            }),
                          },
                        }).catch((error) => {
                          // If server update fails, revert the optimistic update
                          console.error(
                            "Failed to update assignment on server:",
                            error
                          );
                          setOptimisticAssignments((prev) =>
                            prev.map((assignment) =>
                              assignment._id === card.id
                                ? { ...assignment, status: previousStatus }
                                : assignment
                            )
                          );
                          sonnerToast.error("Failed to move task", {
                            description:
                              "Please try again or contact support if the issue persists.",
                            duration: 5000,
                          });
                        });

                        // Show subtle success notification
                        sonnerToast.success(`✓ Moved to ${column.title}`, {
                          id: `move-${card.id}`,
                          duration: 1500,
                        });
                      }
                    } catch (err) {
                      console.error("Failed to move task:", err);
                      sonnerToast.error("Failed to move task", {
                        id: `move-${card.id}`,
                        description:
                          "Please try again or contact support if the issue persists.",
                        duration: 5000,
                      });
                    }
                  };

                  const priorities = [
                    { priority: "high", color: "#ef4444" },
                    { priority: "medium", color: "#f59e0b" },
                    { priority: "low", color: "#10b981" },
                  ];

                  return (
                    <div className="relative">
                      {/* TaskBoard Header with Stats */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {assignments?.length || 0} Total Tasks
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {assignments?.filter(
                                (a: any) => a.status === "completed"
                              ).length || 0}{" "}
                              Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {assignments?.filter(
                                (a: any) => a.status === "in-progress"
                              ).length || 0}{" "}
                              In Progress
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced TaskBoard Container */}
                      <div
                        className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50"
                        onKeyDown={async (e) => {
                          // Prevent default behavior for all keys during task operations
                          e.preventDefault();
                          e.stopPropagation();

                          if (e.key === "Delete" && selectedAssignment) {
                            try {
                              await deleteAssignment({
                                assignmentId:
                                  selectedAssignment._id as Id<"assignments">,
                                userId: convexUser?.clerkId || "",
                              });
                              sonnerToast.success("Task deleted successfully", {
                                description: `${selectedAssignment.title} has been removed.`,
                                duration: 3000,
                              });
                              setSelectedAssignment(null);
                            } catch (err) {
                              console.error("Failed to delete task:", err);
                              sonnerToast.error("Failed to delete task", {
                                description:
                                  "Please try again or contact support if the issue persists.",
                                duration: 5000,
                              });
                            }
                          }
                        }}
                        onKeyUp={(e) => {
                          // Allow other keys to work normally but prevent bubbling
                          e.stopPropagation();
                        }}
                        onFocus={() => {
                          // Ensure container stays focused
                          const container = document.querySelector(
                            "[data-taskboard-container]"
                          ) as HTMLElement;
                          if (container) {
                            container.focus();
                          }
                        }}
                        tabIndex={0} // Make the div focusable for keyboard events
                        style={{
                          userSelect: "none", // Prevent text selection
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                          outline: "none", // Remove focus outline
                        }}
                        onClick={() => {
                          // Ensure the container gets focus when clicked
                          const container = document.querySelector(
                            "[data-taskboard-container]"
                          ) as HTMLElement;
                          if (container) {
                            container.focus();
                          }
                        }}
                        onMouseDown={(e) => {
                          // Prevent text selection on mouse down
                          e.preventDefault();
                        }}
                        onDragStart={(e) => {
                          // Prevent text selection during drag
                          e.preventDefault();
                          document.body.style.userSelect = "none";
                          (document.body.style as any).webkitUserSelect =
                            "none";
                          (document.body.style as any).MozUserSelect = "none";
                          (document.body.style as any).MsUserSelect = "none";
                        }}
                        onDragEnd={() => {
                          // Restore text selection after drag
                          document.body.style.userSelect = "";
                          (document.body.style as any).webkitUserSelect = "";
                          (document.body.style as any).MozUserSelect = "";
                          (document.body.style as any).MsUserSelect = "";
                        }}
                        data-taskboard-container
                      >
                        <TaskBoard
                          taskData={cardData}
                          columnData={columnData}
                          priorities={priorities}
                          onChange={handleTaskBoardChange}
                          style={
                            {
                              height:
                                window.innerWidth < 768
                                  ? "500px"
                                  : window.innerWidth < 1024
                                  ? "600px"
                                  : "650px",
                              background: "transparent",
                              borderRadius: "12px",
                              userSelect: "none",
                              webkitUserSelect: "none",
                              MozUserSelect: "none",
                              msUserSelect: "none",
                            } as any
                          }
                        />
                      </div>

                      {/* TaskBoard Footer with Quick Actions */}
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Drag tasks between columns</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Click to select task</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Delete key to remove</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Trigger a refresh of Convex queries
                              router.refresh();
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Target className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Tasks & Upcoming Events */}
          <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
                <CardDescription>Your next important dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event: any) => (
                  <div
                    key={event._id || event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(
                        event.priority
                      )}`}
                    >
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {mounted
                          ? new Date(event.startTime).toLocaleString()
                          : ""}
                        {event.duration ? ` • ${event.duration} min` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={
                          followedItems.includes(`event:${event._id}`)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => toggleFollow(`event:${event._id}`)}
                      >
                        {followedItems.includes(`event:${event._id}`)
                          ? "Following"
                          : "Follow"}
                      </Button>
                    </div>
                    {event.type === "study" && (
                      <div className="flex items-center gap-2">
                        <StudySessionTimer editSessionId={event._id}>
                          <button className="btn btn-xs border">Edit</button>
                        </StudySessionTimer>
                        <button
                          className="btn btn-xs text-red-600"
                          onClick={async () => {
                            try {
                              if (event.isStudySession) {
                                await deleteStudySession({
                                  sessionId: event._id,
                                });
                              } else {
                                // Ensure convexUser is present so userId is a string (Convex API requires string)
                                if (!convexUser) {
                                  console.warn(
                                    "Unable to delete event: no convex user available"
                                  );
                                  return;
                                }
                                await deleteEvent({
                                  eventId: event._id,
                                  userId: convexUser.clerkId,
                                });
                              }
                            } catch (e) {
                              console.error(
                                "Failed to delete upcoming event/session",
                                e
                              );
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Course Management */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle className="text-lg">Course Management</CardTitle>
                    <CardDescription>
                      Manage your courses and academic schedule
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowCourseDialog(true)}
                    size="sm"
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">Upcoming Courses</TabsTrigger>
                    <TabsTrigger value="history">Course History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upcoming" className="space-y-4">
                    <div className="space-y-2">
                      {upcomingCourses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No upcoming courses scheduled
                        </div>
                      ) : (
                        upcomingCourses.map((course: any) => (
                          <div
                            key={course._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {course.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {course.code} • {course.instructor}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {course.schedule?.days?.join(", ")} at{" "}
                                {course.schedule?.time}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {course.credits} credits
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCourse(course);
                                  setShowCourseDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCourse(course._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="history" className="space-y-4">
                    <div className="space-y-2">
                      {completedCourses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No completed courses yet
                        </div>
                      ) : (
                        completedCourses.map((course: any) => (
                          <div
                            key={course._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {course.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {course.code} • {course.instructor}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Completed • Grade: {course.grade || "N/A"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {course.credits} credits
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCourse(course);
                                  setShowCourseDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCourse(course._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Study Sessions */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle className="text-lg">Study Sessions</CardTitle>
                    <CardDescription>
                      Track your study time and sessions
                    </CardDescription>
                  </div>
                  <StudySessionTimer>
                    <Button
                      size="sm"
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Add Session
                    </Button>
                  </StudySessionTimer>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">
                      Upcoming Sessions
                    </TabsTrigger>
                    <TabsTrigger value="history">Session History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upcoming" className="space-y-4">
                    <div className="space-y-2">
                      {upcomingSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No upcoming study sessions scheduled
                        </div>
                      ) : (
                        upcomingSessions.map((session: any) => (
                          <div
                            key={session._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {session.title ||
                                  session.subject ||
                                  "Active Study Session"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.subject || "Study Session"} •{" "}
                                {session.plannedDuration ||
                                  session.duration ||
                                  0}{" "}
                                minutes
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Started:{" "}
                                {mounted
                                  ? new Date(session.startTime).toLocaleString()
                                  : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                Active
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCompleteSession(session._id)
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <StudySessionTimer editSessionId={session._id}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </StudySessionTimer>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSession(session._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="history" className="space-y-4">
                    <div className="space-y-2">
                      {completedSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No completed study sessions yet
                        </div>
                      ) : (
                        completedSessions.map((session: any) => (
                          <div
                            key={session._id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {session.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.subject || "Study Session"} •{" "}
                                {session.duration ||
                                  session.plannedDuration ||
                                  0}{" "}
                                minutes
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Completed on{" "}
                                {mounted
                                  ? new Date(
                                      session.endTime || session.startTime
                                    ).toLocaleDateString()
                                  : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                              <StudySessionTimer editSessionId={session._id}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </StudySessionTimer>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSession(session._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Optimized Schedules */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      Optimized Schedules
                    </CardTitle>
                    <CardDescription>
                      AI-optimized schedules and schedule history
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="flex items-center gap-2 w-full sm:w-auto"
                    onClick={() => setShowEnhancerModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Optimize Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">Current Optimized</TabsTrigger>
                    <TabsTrigger value="history">Schedule History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="current" className="space-y-4">
                    {activeOptimizedSchedule ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-green-800 dark:text-green-200">
                              Active Optimized Schedule
                            </h4>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                            {activeOptimizedSchedule.description ||
                              "AI-optimized schedule for better productivity"}
                          </p>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Created:{" "}
                            {mounted
                              ? new Date(
                                  activeOptimizedSchedule.createdAt
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="font-medium">Schedule Items:</h5>
                          {(
                            activeOptimizedSchedule.optimizedSchedule as OptimizedScheduleData
                          )?.scheduleItems?.map(
                            (item: OptimizedScheduleItem, index: number) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {item.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.type} • {item.duration} minutes
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {mounted
                                        ? new Date(
                                            item.startTime
                                          ).toLocaleString()
                                        : ""}
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    {item.priority || "medium"}
                                  </Badge>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="mb-4">
                          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        </div>
                        <p>No active optimized schedule</p>
                        <p className="text-sm">
                          Use the "Optimize Schedule" button to create one
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="space-y-4">
                    <div className="space-y-2">
                      {optimizedSchedules && optimizedSchedules.length > 0 ? (
                        optimizedSchedules.map((schedule: any) => (
                          <div
                            key={schedule._id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium">
                                  {schedule.name || "Optimized Schedule"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {schedule.description ||
                                    "AI-generated optimized schedule"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {schedule.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    applyOptimizedSchedule({
                                      scheduleId: schedule._id,
                                    })
                                  }
                                >
                                  Apply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    deleteOptimizedSchedule({
                                      scheduleId: schedule._id,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created:{" "}
                              {mounted
                                ? new Date(
                                    schedule.createdAt
                                  ).toLocaleDateString()
                                : ""}
                              {schedule.appliedAt && (
                                <>
                                  {" "}
                                  • Applied:{" "}
                                  {mounted
                                    ? new Date(
                                        schedule.appliedAt
                                      ).toLocaleDateString()
                                    : ""}
                                </>
                              )}
                            </div>
                            <div className="mt-2 text-sm">
                              {(
                                schedule.optimizedSchedule as OptimizedScheduleData
                              )?.scheduleItems?.length || 0}{" "}
                              items optimized
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="mb-4">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          </div>
                          <p>No optimized schedules yet</p>
                          <p className="text-sm">
                            Create your first optimized schedule above
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Reminders Sidebar (sticky) - show all reminders by default, pinned shown separately below */}
            <aside className="sticky top-20">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Reminders</CardTitle>
                  <CardDescription>
                    Upcoming assignments, sessions and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Build a combined reminders list: pending assignments, upcoming events, active sessions */}
                    {(() => {
                      const rems: any[] = [];
                      // assignments
                      pendingAssignments.forEach((a: any) => {
                        rems.push({
                          key: `assignment:${a._id}`,
                          type: "assignment",
                          id: a._id,
                          title: a.title,
                          date: a.dueDate,
                          raw: a,
                        });
                      });
                      // events
                      upcomingEvents.forEach((e: any) => {
                        rems.push({
                          key: `event:${e._id}`,
                          type: "event",
                          id: e._id,
                          title: e.title,
                          date: e.startTime,
                          raw: e,
                        });
                      });
                      // active timers / sessions
                      (activeTimers || []).forEach((s: any) => {
                        rems.push({
                          key: `session:${s._id}`,
                          type: "session",
                          id: s._id,
                          title: s.title || s.subject || "Study Session",
                          date: s.startTime,
                          raw: s,
                        });
                      });

                      // sort by date asc and unique by key
                      const uniq: Record<string, any> = {};
                      rems
                        .sort((a, b) => (a.date || 0) - (b.date || 0))
                        .forEach((r) => {
                          uniq[r.key] = r;
                        });
                      const out = Object.values(uniq);

                      if (out.length === 0)
                        return (
                          <div className="text-sm text-muted-foreground">
                            No upcoming reminders
                          </div>
                        );

                      return out.slice(0, 8).map((it: any) => (
                        <div
                          key={it.key}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {it.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {mounted
                                ? new Date(it.date).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={
                                followedItems.includes(it.key)
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => toggleFollow(it.key)}
                            >
                              {followedItems.includes(it.key)
                                ? "Pinned"
                                : "Pin"}
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Pinned Reminders (separate) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pinned Reminders</CardTitle>
                  <CardDescription>
                    Followed assignments, sessions and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {followedItems.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No pinned items — click Pin on a reminder to pin it
                        here.
                      </div>
                    )}
                    {followedItems.map((key) => {
                      const [type, id] = key.split(":");
                      let item: any = null;
                      if (type === "event")
                        item = events?.find((e: any) => e._id === id);
                      if (type === "assignment")
                        item =
                          upcomingAssignments?.find((a: any) => a._id === id) ||
                          assignments?.find?.((a: any) => a._id === id);
                      if (type === "session")
                        item = activeTimers?.find?.((s: any) => s._id === id);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {item?.title || item?.name || `${type} ${id}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item?.startTime
                                ? mounted
                                  ? new Date(item.startTime).toLocaleString()
                                  : ""
                                : item?.dueDate
                                ? mounted
                                  ? new Date(item.dueDate).toLocaleString()
                                  : ""
                                : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFollow(key)}
                            >
                              Unpin
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
      {selectedAssignment && (
        <AssignmentDetailsDialog
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onDelete={handleDeleteAssignment}
          onToggleComplete={handleToggleAssignmentComplete}
          onSave={handleSaveAssignment}
        />
      )}
      <ScheduleEnhancerModal
        open={showEnhancerModal}
        onOpenChange={setShowEnhancerModal}
        schedule={scheduleData || []}
        assignments={assignments || []}
        events={calendarEvents || []}
        tasks={[]} // TODO: pass tasks if available
        studySessions={studySessions || []}
        onOptimizeSchedule={async (optimizedSchedule, scheduleId) => {
          try {
            console.log("Applying optimized schedule:", optimizedSchedule, "with ID:", scheduleId);

            if (convexUser && scheduleId) {
              const result = await applyOptimizedSchedule({
                scheduleId: scheduleId,
              });

              console.log("Applied optimized schedule result:", result);

              sonnerToast.success("Optimized schedule applied successfully!");

              // Close the modal
              setShowEnhancerModal(false);
            } else {
              console.error("Missing convexUser or scheduleId:", { convexUser, scheduleId });
              sonnerToast.error("Failed to apply optimized schedule. Missing user or schedule data.");
            }
          } catch (error) {
            console.error("Failed to apply optimized schedule:", error);
            sonnerToast.error("Failed to apply optimized schedule. Please try again.");
          }
        }}
      />
      <CourseDialog
        open={showCourseDialog}
        onOpenChange={(open: boolean) => {
          setShowCourseDialog(open);
          if (!open) setEditingCourse(null);
        }}
        editingCourse={editingCourse}
        onSave={{ createCourse, updateCourse }}
        convexUser={convexUser}
      />
    </>
  );
}

// Assignment Details Dialog component (simple inline) — rendered from inside PlannerHubEnhanced
function AssignmentDetailsDialog({
  assignment,
  onClose,
  onDelete,
  onToggleComplete,
  onSave,
}: any) {
  if (!assignment) return null;
  const [title, setTitle] = useState(assignment.title || "");
  const [description, setDescription] = useState(assignment.description || "");
  const [dueDate, setDueDate] = useState(() => {
    try {
      return new Date(assignment.dueDate).toISOString().split("T")[0];
    } catch {
      return "";
    }
  });
  const [priority, setPriority] = useState(assignment.priority || "medium");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Change details, mark complete, or remove this assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() =>
              onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                dueDate: dueDate
                  ? new Date(`${dueDate}T23:59`).getTime()
                  : undefined,
                priority,
              })
            }
          >
            Save
          </Button>
          <Button onClick={() => onToggleComplete(assignment)}>
            {assignment.status === "completed"
              ? "Mark Uncomplete"
              : "Mark Complete"}
          </Button>
          <Button variant="destructive" onClick={() => onDelete(assignment)}>
            Delete
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Course Dialog component
function CourseDialog({
  open,
  onOpenChange,
  editingCourse,
  onSave,
  convexUser,
}: any) {
  const [name, setName] = useState(editingCourse?.name || "");
  const [code, setCode] = useState(editingCourse?.code || "");
  const [instructor, setInstructor] = useState(editingCourse?.instructor || "");
  const [credits, setCredits] = useState(editingCourse?.credits || 3);
  const [description, setDescription] = useState(
    editingCourse?.description || ""
  );
  const [schedule, setSchedule] = useState(
    editingCourse?.schedule || {
      days: [],
      time: "",
    }
  );
  const [grade, setGrade] = useState(editingCourse?.grade || "");

  const handleSave = async () => {
    if (!convexUser || !name.trim()) return;

    try {
      const courseData = {
        name: name.trim(),
        code: code.trim(),
        instructor: instructor.trim(),
        credits: parseInt(credits) || 3,
        description: description.trim(),
        schedule,
        grade: grade.trim(),
        status: editingCourse ? editingCourse.status : "active",
      };

      if (editingCourse) {
        await onSave.updateCourse({
          courseId: editingCourse._id,
          userId: convexUser.clerkId,
          updates: courseData,
        });
        sonnerToast.success("Course updated");
      } else {
        await onSave.createCourse({
          userId: convexUser.clerkId,
          ...courseData,
        });
        sonnerToast.success("Course created");
      }

      onOpenChange(false);
      // Reset form
      setName("");
      setCode("");
      setInstructor("");
      setCredits(3);
      setDescription("");
      setSchedule({ days: [], time: "" });
      setGrade("");
    } catch (e) {
      sonnerToast.error("Failed to save course");
    }
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCourse ? "Edit Course" : "Add New Course"}
          </DialogTitle>
          <DialogDescription>
            {editingCourse
              ? "Update your course information"
              : "Add a new course to your academic schedule"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Course Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Introduction to Computer Science"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Course Code</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., CS101"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Credits</label>
              <Input
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                min="1"
                max="6"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Instructor</label>
            <Input
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="e.g., Prof. Smith"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Schedule</label>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Days</label>
                <div className="flex flex-wrap gap-1">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={
                        schedule.days?.includes(day) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        const newDays = schedule.days?.includes(day)
                          ? schedule.days.filter((d: string) => d !== day)
                          : [...(schedule.days || []), day];
                        setSchedule({ ...schedule, days: newDays });
                      }}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                value={schedule.time || ""}
                onChange={(e) =>
                  setSchedule({ ...schedule, time: e.target.value })
                }
                placeholder="e.g., 10:00 AM - 11:30 AM"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description..."
              rows={2}
            />
          </div>

          {editingCourse && (
            <div>
              <label className="text-sm font-medium">Grade (optional)</label>
              <Input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., A, B+, 95%"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editingCourse ? "Update Course" : "Create Course"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
