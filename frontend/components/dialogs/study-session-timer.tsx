"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/use-convex-user";
import { toast as sonnerToast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Square,
  Timer,
  Coffee,
  Focus,
  BookOpen,
  Target,
  MapPin,
  Volume2,
  VolumeX,
} from "lucide-react";

interface StudySessionTimerProps {
  children: React.ReactNode;
  onSuccess?: () => void;
  preSelectedCourseId?: string;
  editSessionId?: string | null;
}

export function StudySessionTimer({
  children,
  onSuccess,
  preSelectedCourseId,
  editSessionId,
}: StudySessionTimerProps) {
  const { user } = useConvexUser();
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0); // seconds
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const intervalRef = useRef<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState(preSelectedCourseId || "none");
  const [sessionType, setSessionType] = useState("focused");
  const [studyMethod, setStudyMethod] = useState("pomodoro");
  const [location, setLocation] = useState("");
  const [environment, setEnvironment] = useState("quiet");
  const [notes, setNotes] = useState("");

  // Session metrics
  const [focusScore, setFocusScore] = useState(85);
  const [productivityRating, setProductivityRating] = useState(4);
  const [distractionCount, setDistractionCount] = useState(0);
  const [breakCount, setBreakCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSessionId, setCurrentSessionId] =
    useState<Id<"studySessions"> | null>(null);

  // Helper to safely extract an id whether Convex returned an Id branded string or a full object
  const extractId = (val: any) => {
    if (!val && val !== 0) return null;
    return typeof val === "string" ? val : val && (val._id || val);
  };

  // Try to resume any active sessions persisted on the server
  const activeSessions = useQuery(
    api.analytics.getActiveStudySessionsForUser,
    user ? { userId: user.clerkId } : "skip"
  );

  const sessionToEdit = useQuery(
    api.analytics.getStudySession,
    // only fetch when editSessionId provided
    editSessionId
      ? { sessionId: editSessionId as unknown as Id<"studySessions"> }
      : "skip"
  );

  // Queries
  const courses = useQuery(
    api.courses.getCourses,
    user ? { userId: user.clerkId } : "skip"
  );

  // Mutations
  const createStudySession = useMutation(api.analytics.createStudySession);
  const updateStudySession = useMutation(api.analytics.updateStudySession);
  const createNotification = useMutation(api.notifications.createNotification);
  const [isStarting, setIsStarting] = useState(false);

  const sessionTypes = [
    { value: "focused", label: "Focused Study", icon: Focus },
    { value: "review", label: "Review Session", icon: BookOpen },
    { value: "practice", label: "Practice Problems", icon: Target },
    { value: "reading", label: "Reading", icon: BookOpen },
    { value: "research", label: "Research", icon: BookOpen },
  ];

  const studyMethods = [
    { value: "pomodoro", label: "Pomodoro (25min)", defaultMinutes: 25 },
    { value: "timeboxing", label: "Timeboxing", defaultMinutes: 60 },
    { value: "flow", label: "Flow State", defaultMinutes: 90 },
    { value: "custom", label: "Custom Timer", defaultMinutes: 30 },
  ];

  const environments = [
    { value: "quiet", label: "Quiet Environment" },
    { value: "background-music", label: "Background Music" },
    { value: "ambient", label: "Ambient Sounds" },
    { value: "group", label: "Group Study" },
  ];

  useEffect(() => {
    // If another tab set a pending session to open, open this dialog when it matches our editSessionId
    try {
      if (editSessionId) {
        const pending =
          typeof window !== "undefined"
            ? localStorage.getItem("openStudySessionOnLoad")
            : null;
        if (pending && pending === editSessionId) {
          setOpen(true);
          try {
            localStorage.removeItem("openStudySessionOnLoad");
          } catch (e) {}
        }
      }
    } catch (e) {
      // ignore storage access errors
    }

    const storageHandler = (ev: StorageEvent) => {
      if (ev.key !== "openStudySessionOnLoad") return;
      if (!editSessionId) return;
      try {
        const val = ev.newValue;
        if (val && val === editSessionId) {
          setOpen(true);
          try {
            localStorage.removeItem("openStudySessionOnLoad");
          } catch (e) {}
        }
      } catch (e) {}
    };
    window.addEventListener("storage", storageHandler);
    // Local typed aliases to avoid TS errors when Convex generated types are narrower
    const sessionToEditAny = sessionToEdit as any;
    const activeSessionsAny = activeSessions as any[] | undefined;

    // If component is mounted in edit mode, populate form
    if (sessionToEditAny) {
      try {
        setTitle(sessionToEditAny.title || "");
        setDescription(sessionToEditAny.description || "");
        setPlannedMinutes(sessionToEditAny.plannedDuration || 25);
        setCourseId(sessionToEditAny.courseId || preSelectedCourseId || "none");
        setIsCompleted(!!sessionToEditAny.isCompleted);
        setNotes(sessionToEditAny.notes || "");
        // If the session is active (no endTime), set currentSessionId so controls show
        if (!sessionToEditAny.endTime) {
          setCurrentSessionId(extractId(sessionToEditAny) as any);
          setIsActive(true);
          setIsPaused(!!sessionToEditAny.pausedAt);
        }
      } catch (e) {
        // ignore
      }
    }

    // If there's an active persisted session and we don't have a local session id, resume
    if (
      !currentSessionId &&
      activeSessionsAny &&
      activeSessionsAny.length > 0
    ) {
      try {
        // Prefer the session that matches editSessionId (if editing), otherwise pick the first active session
        const preferred = editSessionId
          ? activeSessionsAny.find((s: any) => extractId(s) === editSessionId)
          : null;
        const sessionToResume = preferred || activeSessionsAny[0];
        if (sessionToResume) {
          const resumeId = extractId(sessionToResume);
          setCurrentSessionId(resumeId as any);
          setIsActive(true);
          setIsPaused(
            !!(typeof sessionToResume === "string"
              ? false
              : sessionToResume.pausedAt)
          );
          // Compute elapsed time = now - startTime - accumulatedPausedSeconds
          const now = Date.now();
          const startTime =
            (typeof sessionToResume === "string"
              ? now
              : sessionToResume.startTime) || now;
          const accumulated =
            (typeof sessionToResume === "string"
              ? 0
              : sessionToResume.accumulatedPausedSeconds) || 0;
          let elapsed = Math.floor((now - startTime) / 1000) - accumulated;
          const pausedAt =
            typeof sessionToResume === "string" ? 0 : sessionToResume.pausedAt;
          if (pausedAt) {
            // If paused, subtract time since paused
            elapsed = Math.floor((pausedAt - startTime) / 1000) - accumulated;
          }
          setTime(Math.max(0, elapsed));
        }
      } catch (e) {
        // ignore
      }
    }

    if (isActive && !isPaused) {
      // Tick every second and auto-stop when planned duration reached
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => {
          const next = prevTime + 1;
          // If plannedMinutes set and we've reached or exceeded planned duration, stop
          if (plannedMinutes > 0 && next >= plannedMinutes * 60) {
            // Clear interval here to avoid race where state updates continue
            if (intervalRef.current !== null) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // End the session by calling handleStop asynchronously (don't await here)
            // Use a microtask to avoid updating state mid-render
            Promise.resolve().then(() => {
              handleStop();
            });
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener("storage", storageHandler);
    };
  }, [isActive, isPaused]);

  // Persist pause/resume state when isPaused changes
  useEffect(() => {
    if (!currentSessionId) return;
    const persistPause = async () => {
      try {
        const activeSessionsAny = activeSessions as any[] | undefined;
        if (isPaused) {
          // set pausedAt
          await updateStudySession({
            sessionId: currentSessionId,
            pausedAt: Date.now(),
          });
        } else {
          // resume: calculate additional paused seconds
          const now = Date.now();
          // find the session in the active sessions list (best-effort)
          const session =
            (activeSessionsAny || []).find(
              (s: any) => extractId(s) === currentSessionId
            ) || null;
          const pausedAt = session?.pausedAt || 0;
          const additional = pausedAt ? Math.floor((now - pausedAt) / 1000) : 0;
          const accumulated =
            (session?.accumulatedPausedSeconds || 0) + additional;
          await updateStudySession({
            sessionId: currentSessionId,
            pausedAt: undefined as any,
            accumulatedPausedSeconds: accumulated,
          });
        }
      } catch (err) {
        console.error("Failed to persist pause/resume:", err);
      }
    };
    persistPause();
  }, [isPaused, currentSessionId, activeSessions]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (plannedMinutes === 0) return 0;
    return Math.min((time / (plannedMinutes * 60)) * 100, 100);
  };

  const handleStart = async () => {
    if (!user) {
      sonnerToast.error("You must be logged in to start a study session.");
      return;
    }

    if (!title.trim()) {
      sonnerToast.error("Please provide a session title.");
      return;
    }

    try {
      if (isStarting) return;
      setIsStarting(true);
      const created = await createStudySession({
        userId: user.clerkId,
        courseId: courseId && courseId !== "none" ? courseId : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: Date.now(),
        plannedDuration: plannedMinutes,
        sessionType,
        studyMethod: studyMethod || undefined,
        location: location.trim() || undefined,
        environment,
        notes: notes.trim() || undefined,
      });

      // Convex insert may return either the full created document or just the id string/Id type.
      // Safely derive the session id without accessing `._id` on a string.
      let sessionId: any = null;
      if (created) {
        sessionId = extractId(created) || (created as any);
      }
      setCurrentSessionId(sessionId as any);
      setIsActive(true);
      setIsPaused(false);
      setTime(0);

      if (soundEnabled) {
        // Play start sound (you can implement audio later)
      }

      sonnerToast.success(`"${title}" session is now active.`);
      // create an in-app notification for the started session
      try {
        const sessionId = extractId(created);
        await createNotification({
          userId: user.clerkId,
          title: `Study session: ${title.trim()}`,
          message: `Your study session "${title.trim()}" has started.`,
          type: "study_session_started",
          relatedId: sessionId,
          relatedType: "study_session",
          actionUrl: sessionId
            ? `/dashboard/planner?session=${sessionId}`
            : undefined,
          actionLabel: "Open Planner",
        });
      } catch (e) {
        // non-fatal
      }
    } catch (error) {
      console.error("Error starting study session:", error);
      sonnerToast.error("Failed to start study session. Please try again.");
    }
    setIsStarting(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (soundEnabled) {
      // Play pause sound
    }
  };

  const handleStop = async () => {
    if (!currentSessionId) return;

    try {
      await updateStudySession({
        sessionId: currentSessionId,
        endTime: Date.now(),
        duration: Math.floor(time / 60), // Convert to minutes
        focusScore,
        productivityRating,
        distractionCount,
        breakCount,
        notes: notes.trim() || undefined,
        isCompleted,
        wasInterrupted,
      });

      setIsActive(false);
      setIsPaused(false);
      setTime(0);
      setCurrentSessionId(null);

      if (soundEnabled) {
        // Play completion sound
      }

      sonnerToast.success(
        `Session lasted ${formatTime(time)} and has been saved.`
      );

      // Reset form
      setTitle("");
      setDescription("");
      setCourseId(preSelectedCourseId || "none");
      setSessionType("focused");
      setStudyMethod("pomodoro");
      setLocation("");
      setEnvironment("quiet");
      setNotes("");
      setFocusScore(85);
      setProductivityRating(4);
      setDistractionCount(0);
      setBreakCount(0);
      setIsCompleted(false);
      setWasInterrupted(false);

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error ending study session:", error);
      sonnerToast.error("Failed to save study session. Please try again.");
    }
  };

  // Allow saving edits to metadata when in edit mode (not stopping the session)
  const handleSaveEdits = async () => {
    const sessionToEditAny = sessionToEdit as any;
    if (!sessionToEditAny && !currentSessionId) return;
    const targetId = currentSessionId || extractId(sessionToEditAny);
    if (!targetId) return;
    try {
      await updateStudySession({
        sessionId: targetId as any,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        courseId: courseId && courseId !== "none" ? courseId : undefined,
        plannedDuration: plannedMinutes || undefined,
        sessionType: sessionType || undefined,
        studyMethod: studyMethod || undefined,
        location: location || undefined,
        environment: environment || undefined,
        notes: notes || undefined,
        isCompleted: isCompleted || undefined,
        wasInterrupted: wasInterrupted || undefined,
      });
      sonnerToast.success("Session updated — changes saved.");
      onSuccess?.();
      setOpen(false);
    } catch (err) {
      console.error("Failed to save edits", err);
      sonnerToast.error("Failed to save changes");
    }
  };

  const handleDistraction = () => {
    setDistractionCount((prev) => prev + 1);
    if (soundEnabled) {
      // Play distraction sound
    }
  };

  const handleBreak = () => {
    setBreakCount((prev) => prev + 1);
    setIsPaused(true);
  };

  const handleStudyMethodChange = (method: string) => {
    setStudyMethod(method);
    const methodInfo = studyMethods.find((m) => m.value === method);
    if (methodInfo) {
      setPlannedMinutes(methodInfo.defaultMinutes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Study Session Timer
          </DialogTitle>
          <DialogDescription>
            Track your study time with productivity metrics and focus
            monitoring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-mono font-bold">
              {formatTime(time)}
            </div>

            {plannedMinutes > 0 && (
              <div className="space-y-2">
                <Progress value={getProgressPercentage()} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.floor(time / 60)} / {plannedMinutes} minutes
                </p>
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex justify-center gap-2">
              {!isActive ? (
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="gap-2"
                  disabled={isStarting}
                >
                  <Play className="w-4 h-4" />
                  {isStarting ? "Starting…" : "Start Session"}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    size="lg"
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="lg"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Session Actions (when active) */}
            {isActive && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDistraction}>
                  +1 Distraction
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBreak}
                  className="gap-1"
                >
                  <Coffee className="w-3 h-3" />
                  Take Break
                </Button>
              </div>
            )}
          </div>

          {/* Session Setup */}
          {!isActive && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Math Problem Set, Literature Review"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course selected</SelectItem>
                      {courses?.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.courseCode} - {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              {Icon ? <Icon className="w-4 h-4" /> : null}
                              {type.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studyMethod">Study Method</Label>
                  <Select
                    value={studyMethod}
                    onValueChange={handleStudyMethodChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {studyMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plannedMinutes">
                    Planned Duration (minutes)
                  </Label>
                  <Input
                    id="plannedMinutes"
                    type="number"
                    value={plannedMinutes}
                    onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                    min="5"
                    max="300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Library, Dorm, Coffee Shop"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={environment} onValueChange={setEnvironment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.map((env) => (
                        <SelectItem key={env.value} value={env.value}>
                          {env.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description/Goals</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What do you plan to accomplish in this session?"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Session Metrics (when active) */}
          {isActive && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">
                    {focusScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Focus Score</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">
                    {productivityRating}
                  </p>
                  <p className="text-xs text-muted-foreground">Productivity</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-600">
                    {distractionCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Distractions</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">
                    {breakCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Breaks</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionNotes">Session Notes</Label>
                <Textarea
                  id="sessionNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Track your progress, challenges, or insights..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                    className="rounded"
                  />
                  Session completed successfully
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={wasInterrupted}
                    onChange={(e) => setWasInterrupted(e.target.checked)}
                    className="rounded"
                  />
                  Session was interrupted
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Removed floating "Open Timer in Planner" to keep UI focused on Edit/Delete in planner list */}

        {!isActive && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            {editSessionId && (
              <Button type="button" onClick={handleSaveEdits} className="ml-2">
                Save Changes
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
