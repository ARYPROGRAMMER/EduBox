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
import { ButtonLoader, CardSkeleton } from "@/components/ui/loader";
import { useAsyncOperation } from "@/components/ui/loading-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle,
  AlertCircle,
  Target,
  UtensilsCrossed,
  Timer,
} from "lucide-react";
import { CourseCreationDialog } from "@/components/dialogs/course-creation-dialog";
import { AssignmentCreationDialog } from "@/components/dialogs/assignment-creation-dialog";
import { StudySessionTimer } from "@/components/dialogs/study-session-timer";
import { toast as sonnerToast } from 'sonner';

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

  // Mutations
  const createEvent = useMutation(api.events.createEvent);
  const createAssignment = useMutation(api.assignments.createAssignment);
  const updateAssignment = useMutation(api.assignments.updateAssignment);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const deleteAssignment = useMutation(api.assignments.deleteAssignment);

  // Use simple loading state instead of useAsyncOperation
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
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
            startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
            endDate: Date.now(),
            limit: 50,
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
    isStudySession: true,
  }));

  const calendarEvents = [
    ...baseEvents,
    ...scheduleEvents,
    ...studySessionEvents,
  ];
  const assignments = upcomingAssignments || [];

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

  const pendingAssignments = assignments.filter(
    (assignment: any) => assignment.status === "pending"
  );
  const completedAssignments = assignments.filter(
    (assignment: any) => assignment.status === "completed"
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

  // Run a one-time cleanup when the planner mounts to remove expired lingering sessions
  useEffect(() => {
    if (!convexUser) return;
    let mounted = true;
    (async () => {
      try {
        const res = await deleteExpiredStudySessions({ userId: convexUser.clerkId });
        if (!mounted) return;
        if (res && res.deleted && res.deleted > 0) {
          try {
            sonnerToast.success(`Cleaned up ${res.deleted} expired study session${res.deleted > 1 ? 's' : ''}.`);
            // Refresh the page to update any active timers shown
            router.refresh();
            
          } catch (e) {
            // ignore toast failures
          }
        }
      } catch (e) {
        // non-fatal; log in dev
        if (process.env.NODE_ENV !== 'production') console.debug('deleteExpiredStudySessions failed', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [convexUser?.clerkId]);

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

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {pendingAssignments.length}
                  </p>
                  <p className="text-sm text-orange-600/70">Pending Tasks</p>
                </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card data-session-id={fetchedSession?._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Academic Calendar</CardTitle>
                    <CardDescription>
                      Manage your schedule and important dates
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
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
                                    <div className="flex flex-wrap gap-1">
                                      {getEventsForDate(date)
                                        .slice(0, 2)
                                        .map((event: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="w-2 h-2 bg-blue-500 rounded-full"
                                          />
                                        ))}
                                      {getEventsForDate(date).length > 2 && (
                                        <span className="text-xs">
                                          +{getEventsForDate(date).length - 2}
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
                              <Badge
                                className={getPriorityColor(event.priority)}
                              >
                                {event.priority}
                              </Badge>
                            </div>
                          ))
                        : []}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tasks & Upcoming Events */}
          <div className="space-y-6">
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

            {/* Task Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Task Management</CardTitle>
                    <CardDescription>
                      Track your assignments and todos
                    </CardDescription>
                  </div>
                  <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
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
                        <Input placeholder="Task title" />
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High Priority</SelectItem>
                            <SelectItem value="medium">
                              Medium Priority
                            </SelectItem>
                            <SelectItem value="low">Low Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="date" placeholder="Due date" />
                        <div className="flex gap-2">
                          <Button className="flex-1">Save Task</Button>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
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

                <div className="space-y-3 mt-4">
                  {pendingAssignments.slice(0, 5).map((assignment: any) => (
                    <div
                      key={assignment._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDateString(assignment.dueDate)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(assignment.priority)}
                      >
                        {assignment.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
