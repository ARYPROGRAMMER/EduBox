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
  const [isPaused, setIsPaused] = useState(false); // session-level pause
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
  const [audioPlaying, setAudioPlaying] = useState(false); // Separate control for audio playback
  // Background music queue
  interface AudioItem {
    id: string;
    name: string;
    url: string;
    uploading?: boolean;
    uploadError?: boolean;
  }
  const [audioQueue, setAudioQueue] = useState<AudioItem[]>([]);

  // helper: persistable stripped queue
  const sanitizeAudioQueue = (arr: AudioItem[] | undefined) => {
    if (!arr || arr.length === 0) return undefined;
    return arr.map((a) => ({ id: a.id, name: a.name, url: a.url }));
  };

  // Audio state management - improved synchronization
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(0.5);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Audio element and control refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequestIdRef = useRef<number>(0);
  const currentSrcRef = useRef<string | null>(null);
  const playInFlightRef = useRef<boolean>(false);
  const userPausedRef = useRef<boolean>(false); // Use ref for immediate access
  const [userPaused, setUserPaused] = useState<boolean>(false); // Keep state for UI

  const [currentSessionId, setCurrentSessionId] =
    useState<Id<"studySessions"> | null>(null);

  // Convex helpers & queries
  const extractId = (val: any) => {
    if (!val && val !== 0) return null;
    return typeof val === "string" ? val : val && (val._id || val);
  };

  const activeSessions = useQuery(
    api.analytics.getActiveStudySessionsForUser,
    user ? { userId: user.clerkId } : "skip"
  );

  const sessionToEdit = useQuery(
    api.analytics.getStudySession,
    editSessionId
      ? { sessionId: editSessionId as unknown as Id<"studySessions"> }
      : "skip"
  );

  // Load persisted audioQueue from the session when editing or resuming
  useEffect(() => {
    try {
      const s: any = sessionToEdit as any;
      if (s && s.audioQueue && Array.isArray(s.audioQueue)) {
        setAudioQueue(s.audioQueue);
      }
    } catch (e) {
      // ignore
    }
  }, [sessionToEdit]);

  // If resuming an active session (e.g., page reload) pick up audioQueue and play if appropriate
  useEffect(() => {
    try {
      const activeAny = activeSessions as any[] | undefined;
      if (!currentSessionId && activeAny && activeAny.length > 0) {
        const preferred = editSessionId
          ? activeAny.find((s: any) => extractId(s) === editSessionId)
          : null;
        const sessionToResume = preferred || activeAny[0];
        if (sessionToResume) {
          const resumeId = extractId(sessionToResume);
          setCurrentSessionId(resumeId as any);
          setIsActive(true);
          setIsPaused(!!sessionToResume.pausedAt);

          const now = Date.now();
          const startTime = sessionToResume.startTime || now;
          const accumulated = sessionToResume.accumulatedPausedSeconds || 0;
          let elapsed = Math.floor((now - startTime) / 1000) - accumulated;
          const pausedAt = sessionToResume.pausedAt || 0;
          if (pausedAt) {
            elapsed = Math.floor((pausedAt - startTime) / 1000) - accumulated;
          }
          setTime(Math.max(0, elapsed));

          // restore queue; UI will show it
          if (
            sessionToResume.audioQueue &&
            Array.isArray(sessionToResume.audioQueue)
          ) {
            setAudioQueue(sessionToResume.audioQueue);
            setCurrentAudioIndex(0);
            // do NOT clear userPaused — respect user's previous explicit pause if present
          }
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessions, editSessionId]);

  // Populate form when editing
  useEffect(() => {
    const s: any = sessionToEdit as any;
    if (!s) return;
    try {
      setTitle(s.title || "");
      setDescription(s.description || "");
      setPlannedMinutes(s.plannedDuration || s.plannedMinutes || 25);
      setCourseId(s.courseId || preSelectedCourseId || "none");
      setIsCompleted(!!s.isCompleted);
      setNotes(s.notes || "");

      if (!s.endTime) {
        setCurrentSessionId(extractId(s) as any);
        setIsActive(true);
        setIsPaused(!!s.pausedAt);
      }

      // If the session has audioQueue persisted, restore it (so UI shows queue)
      if (s.audioQueue && Array.isArray(s.audioQueue)) {
        setAudioQueue(s.audioQueue);
      }
    } catch (e) {
      console.debug("populate session failed", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToEdit]);

  // Reset form when opening dialog for new session
  useEffect(() => {
    if (open && !editSessionId) {
      // Reset to defaults for new session
      setTitle("");
      setDescription("");
      setPlannedMinutes(25);
      setCourseId(preSelectedCourseId || "none");
      setSessionType("focused");
      setStudyMethod("pomodoro");
      setLocation("");
      setEnvironment("quiet");
      setNotes("");
      setAudioQueue([]);
      setIsActive(false);
      setIsPaused(false);
      setTime(0);
      setCurrentSessionId(null);
      setIsCompleted(false);
      setWasInterrupted(false);
      setFocusScore(85);
      setProductivityRating(4);
      setDistractionCount(0);
      setBreakCount(0);
    }
  }, [open, editSessionId, preSelectedCourseId]);

  // Queries & mutations
  const courses = useQuery(
    api.courses.getCourses,
    user ? { userId: user.clerkId } : "skip"
  );
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

  // Ticking and session auto-stop
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => {
          const next = prevTime + 1;
          if (plannedMinutes > 0 && next >= plannedMinutes * 60) {
            if (intervalRef.current !== null) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
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
      // Pause audio when session stops/pauses
      try {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } catch (e) {}
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused]);

  // Audio element lifecycle management
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata"; // Changed from "auto" to reduce bandwidth
    audio.crossOrigin = "anonymous";
    audio.volume = audioVolume;
    audio.muted = !soundEnabled;

    // Enhanced event handlers
    const handleEnded = () => {
      setPlayingIndex(null);
      // Auto-advance to next track if not user-paused
      if (!userPausedRef.current && audioQueue.length > 1) {
        setCurrentAudioIndex((prev) => {
          const next = (prev + 1) % audioQueue.length;
          // Auto-play next track after a brief delay
          setTimeout(() => {
            if (!userPausedRef.current) {
              playTrackByIndex(next);
            }
          }, 500);
          return next;
        });
      }
    };

    const handleError = (e: Event) => {
      console.warn("Audio error:", e);
      setAudioError("Failed to load audio track");
      setAudioLoading(false);
      setPlayingIndex(null);
      playInFlightRef.current = false;
    };

    const handleLoadStart = () => {
      setAudioLoading(true);
      setAudioError(null);
    };

    const handleCanPlay = () => {
      setAudioLoading(false);
    };

    const handlePause = () => {
      // Only update playingIndex if this wasn't triggered by our own pause
      if (!playInFlightRef.current) {
        setPlayingIndex(null);
      }
    };

    const handlePlay = () => {
      setAudioLoading(false);
      // Update playingIndex when audio actually starts
      setPlayingIndex(currentAudioIndex);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    audioRef.current = audio;

    return () => {
      // Comprehensive cleanup
      audio.pause();
      audio.src = "";
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audioRef.current = null;
    };
  }, []); // Only run once on mount

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      try {
        audioQueue.forEach((track) => {
          if (
            track &&
            track.url &&
            typeof track.url === "string" &&
            track.url.startsWith("blob:")
          ) {
            URL.revokeObjectURL(track.url);
          }
        });
      } catch (e) {
        console.error("Error cleaning up blob URLs:", e);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Improved audio playback with better error handling and state management
  const playTrackByIndex = async (idx: number, byUser = false) => {
    try {
      if (!audioRef.current || !audioQueue || audioQueue.length === 0) return;

      const safeIdx = Math.min(Math.max(0, idx), audioQueue.length - 1);
      const track = audioQueue[safeIdx];
      if (!track) return;

      const el = audioRef.current;

      // If user explicitly requested play, clear user pause
      if (byUser) {
        userPausedRef.current = false;
        setUserPaused(false);
      }

      // If already playing this track, don't restart
      if (
        currentSrcRef.current === track.url &&
        !el.paused &&
        playingIndex === safeIdx
      ) {
        return;
      }

      // Cancel any pending play requests
      playRequestIdRef.current += 1;
      const myRequest = playRequestIdRef.current;
      playInFlightRef.current = true;

      setAudioLoading(true);
      setAudioError(null);

      // More aggressive pause - wait a bit for pause to take effect
      try {
        el.pause();
        el.currentTime = 0; // Reset position
      } catch (e) {}

      // Small delay to ensure pause takes effect
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Set new source
      currentSrcRef.current = track.url;
      el.src = track.url;
      el.loop = false;

      // Apply current settings
      try {
        el.volume = audioVolume;
        el.muted = !soundEnabled;
      } catch (e) {}

      // Attempt to play
      await el
        .play()
        .then(() => {
          // Only update state if this request is still current
          if (playRequestIdRef.current === myRequest) {
            setCurrentAudioIndex(safeIdx);
            setPlayingIndex(safeIdx);
            setAudioLoading(false);
          }
        })
        .catch((err: any) => {
          // Handle different error types
          const isAbort =
            err?.name === "AbortError" ||
            /interrupted by/i.test(String(err?.message || ""));
          const isNotAllowed = err?.name === "NotAllowedError";

          if (!isAbort) {
            if (isNotAllowed) {
              setAudioError(
                "Playback blocked by browser. Click to enable audio."
              );
            } else {
              setAudioError("Failed to play audio track");
              console.warn("Audio play failed:", err);
            }
          }

          // Clean up state
          if (playRequestIdRef.current === myRequest) {
            setPlayingIndex(null);
            setAudioLoading(false);
          }
        })
        .finally(() => {
          if (playRequestIdRef.current === myRequest) {
            playInFlightRef.current = false;
          }
        });
    } catch (e) {
      console.error("playTrackByIndex error:", e);
      setAudioError("Unexpected audio error");
      setAudioLoading(false);
      setPlayingIndex(null);
      playInFlightRef.current = false;
    }
  };

  // Legacy playTrack function for backward compatibility
  const playTrack = playTrackByIndex;

  // helper to pause current playback and cancel pending play attempts
  // if `byUser` is true, set userPaused so auto-play is suppressed until the user explicitly plays again
  const pauseAudio = (byUser = false) => {
    try {
      // increment request id to cancel any pending/ongoing play attempts
      playRequestIdRef.current += 1;
      playInFlightRef.current = false;
      if (audioRef.current) audioRef.current.pause();
      setPlayingIndex(null);
      setAudioLoading(false);
      if (byUser) {
        userPausedRef.current = true;
        setUserPaused(true);
      }
    } catch (e) {}
  };

  // manager effect: only handle pausing when conditions change
  useEffect(() => {
    try {
      // If a play operation is in flight, don't interfere
      if (playInFlightRef.current) {
        return;
      }

      // If user explicitly paused playback, ensure paused
      if (userPausedRef.current) {
        pauseAudio(false);
        return;
      }

      const hasQueue = !!(audioQueue && audioQueue.length > 0);

      // If audioPlaying is false or conditions not right, ensure paused
      if (!audioPlaying || !hasQueue || !soundEnabled || audioError) {
        pauseAudio(false);
      }
      // Note: Auto-playing is now handled directly by the play button
    } catch (e) {
      console.error("Audio manager effect error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPlaying, audioQueue, soundEnabled, userPaused, audioError]);

  // Keep volume/mute in sync (applies to the single audioRef instance)
  useEffect(() => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : audioVolume;
        audioRef.current.muted = !soundEnabled;
      }
    } catch (e) {}
  }, [audioVolume, soundEnabled, isMuted]);

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

  // START - ensure audio playback starts from the user gesture
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

      let sessionId: any = null;

      // If editing an existing session, update it instead of creating new
      if (editSessionId) {
        await updateStudySession({
          sessionId: editSessionId as Id<"studySessions">,
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
          audioQueue: sanitizeAudioQueue(audioQueue),
          isCompleted: false, // Ensure it's not marked as completed when starting
        });
        sessionId = editSessionId;
      } else {
        // Create new session
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
          audioQueue: sanitizeAudioQueue(audioQueue),
        });

        if (created) {
          sessionId = extractId(created) || (created as any);
        }
      }

      setCurrentSessionId(sessionId as any);
      setIsActive(true);
      setIsPaused(false);
      setTime(0);

      // Important: user gesture - clear userPaused (user is explicitly starting session)
      setUserPaused(false);

      // Important: attempt to start audio inside this user gesture
      try {
        if (audioQueue && audioQueue.length > 0 && soundEnabled) {
          // playTrack will serialize and avoid races
          await playTrack(0);
        }
      } catch (e) {
        // ignore audio failures
      }

      sonnerToast.success(`"${title}" session is now active.`);

      // create an in-app notification for the started session (non-fatal)
      try {
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
      } catch (e) {}
    } catch (error) {
      console.error("Error starting study session:", error);
      sonnerToast.error("Failed to start study session. Please try again.");
    }
    setIsStarting(false);
  };
  // END handleStart

  const handlePause = () => {
    // session-level pause/resume
    const next = !isPaused;
    setIsPaused(next);
    // Note: Audio playback is now controlled separately and not affected by timer pause/resume
  };

  const handleStop = async () => {
    if (!currentSessionId) return;

    try {
      await updateStudySession({
        sessionId: currentSessionId,
        endTime: Date.now(),
        duration: Math.floor(time / 60), // minutes
        focusScore,
        productivityRating,
        distractionCount,
        breakCount,
        notes: notes.trim() || undefined,
        audioQueue: sanitizeAudioQueue(audioQueue),
        isCompleted,
        wasInterrupted,
      });

      setIsActive(false);
      setIsPaused(false);

      sonnerToast.success(
        `Session lasted ${formatTime(time)} and has been saved.`
      );

      // stop audio
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          setPlayingIndex(null);
        }
      } catch (e) {}
      onSuccess?.();
    } catch (error) {
      console.error("Error ending study session:", error);
      sonnerToast.error("Failed to save study session. Please try again.");
    }
  };

  // Audio file selection + upload
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const placeholders: Array<AudioItem> = [];
    for (let i = 0; i < files.length; i++) {
      const f = files.item(i);
      if (!f) continue;
      const id = String(Date.now()) + `-${i}`;
      const localUrl = URL.createObjectURL(f);
      placeholders.push({ id, name: f.name, url: localUrl, uploading: true });
    }
    setAudioQueue((prev) => [...prev, ...placeholders]);

    (async () => {
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (!f) continue;
        // reader
        const reader = new FileReader();
        const dataUrl: string = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(f as Blob);
        });

        // upload retry logic
        const maxAttempts = 3;
        let attempt = 0;
        let uploadedUrl: string | null = null;
        while (attempt < maxAttempts && !uploadedUrl) {
          try {
            const resp = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: f.name,
                contentType: f.type,
                data: dataUrl,
              }),
            });
            const json = await resp.json();
            if (resp.ok && json.url) {
              uploadedUrl = json.url;
            } else {
              attempt += 1;
              await new Promise((r) => setTimeout(r, 500 * attempt));
            }
          } catch (e) {
            attempt += 1;
            await new Promise((r) => setTimeout(r, 500 * attempt));
          }
        }

        setAudioQueue((prev) => {
          const arr = [...prev];
          const idx = arr.findIndex((p) => p.name === f.name && p.uploading);
          if (idx === -1) return prev;
          if (uploadedUrl) {
            arr[idx] = {
              id: arr[idx].id,
              name: f.name,
              url: uploadedUrl,
              uploading: false,
            };
          } else {
            arr[idx] = { ...arr[idx], uploading: false, uploadError: true };
          }

          // persist to server (best-effort)
          (async () => {
            try {
              const sid = currentSessionId || (sessionToEdit as any)?._id;
              if (sid)
                await updateStudySession({
                  sessionId: sid as any,
                  audioQueue: sanitizeAudioQueue(arr),
                });
            } catch (e) {
              console.error("persist audioQueue failed", e);
            }
          })();

          return arr;
        });
      }
    })();
  };

  const moveAudio = (index: number, dir: -1 | 1) => {
    const to = index + dir;

    setAudioQueue((prev) => {
      const arr = [...prev];
      if (to < 0 || to >= arr.length) return arr;
      const tmp = arr[to];
      arr[to] = arr[index];
      arr[index] = tmp;
      const next = arr;
      (async () => {
        try {
          const sid = currentSessionId || (sessionToEdit as any)?._id;
          if (sid)
            await updateStudySession({
              sessionId: sid as any,
              audioQueue: sanitizeAudioQueue(next),
            });
        } catch (e) {
          console.error("persist move failed", e);
        }
      })();
      return next;
    });

    // Adjust indices properly after move operation
    setCurrentAudioIndex((prev) => {
      if (prev === index) return to;
      if (prev === to) return index;
      return prev;
    });

    setPlayingIndex((prev) => {
      if (prev === index) return to;
      if (prev === to) return index;
      return prev;
    });
  };

  const removeAudio = (index: number) => {
    setAudioQueue((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(index, 1);
      try {
        if (
          removed &&
          removed.url &&
          typeof removed.url === "string" &&
          removed.url.startsWith("blob:")
        )
          URL.revokeObjectURL(removed.url);
      } catch (e) {}
      const next = arr;
      (async () => {
        try {
          const sid = currentSessionId || (sessionToEdit as any)?._id;
          if (sid)
            await updateStudySession({
              sessionId: sid as any,
              audioQueue: sanitizeAudioQueue(next),
            });
        } catch (e) {
          console.error("persist remove failed", e);
        }
      })();
      return next;
    });

    // Adjust indices properly after removal
    setPlayingIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) {
        // Currently playing track was removed, stop playback
        pauseAudio(true);
        return null;
      }
      if (prev > index) {
        // Track was removed before current playing track, shift index down
        return prev - 1;
      }
      return prev;
    });

    // Adjust currentAudioIndex properly
    setCurrentAudioIndex((prev) => {
      if (prev === index) {
        // If current index was removed, move to next valid index or 0
        return Math.max(0, Math.min(prev, audioQueue.length - 2));
      }
      if (prev > index) {
        // Track was removed before current index, shift down
        return prev - 1;
      }
      return prev;
    });
  };

  // Manual per-item control used in UI
  const toggleTrackPlay = (idx: number) => {
    if (playingIndex === idx) {
      // user-initiated pause -> set userPaused so manager doesn't immediately restart
      pauseAudio(true);
    } else {
      // user-initiated play -> clear userPaused and start track
      setUserPaused(false);
      playTrackByIndex(idx, true);
    }
  };

  // Save edits (unchanged)
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
        isCompleted: isCompleted,
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
      // play cue
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
            <div className="flex flex-wrap justify-center gap-2">
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
                    onClick={async () => {
                      if (!currentSessionId) return;
                      try {
                        await updateStudySession({
                          sessionId: currentSessionId,
                          isCompleted: true,
                          endTime: Date.now(),
                          duration: Math.floor(time / 60), // minutes
                          focusScore,
                          productivityRating,
                          distractionCount,
                          breakCount,
                          notes: notes.trim() || undefined,
                          audioQueue: sanitizeAudioQueue(audioQueue),
                          wasInterrupted,
                        });
                        setIsCompleted(true);
                        setIsActive(false);
                        setIsPaused(false);
                        pauseAudio(true);
                        sonnerToast.success("Session marked as completed!");
                        setOpen(false);
                        onSuccess?.();
                      } catch (err) {
                        console.error("Failed to mark session complete:", err);
                        sonnerToast.error("Failed to mark session complete");
                      }
                    }}
                    variant="default"
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Target className="w-4 h-4" />
                    Mark Complete
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
                onClick={async () => {
                  if (audioPlaying) {
                    setAudioPlaying(false);
                    pauseAudio(true); // User explicitly paused
                  } else {
                    setAudioPlaying(true);
                    setUserPaused(false);
                    userPausedRef.current = false;
                    // Directly start playing if we have a queue
                    if (audioQueue && audioQueue.length > 0) {
                      await playTrackByIndex(currentAudioIndex, true);
                    }
                  }
                }}
                disabled={!audioQueue || audioQueue.length === 0}
                title={audioPlaying ? "Pause audio" : "Play audio"}
              >
                {audioPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  if (isMuted) {
                    setIsMuted(false);
                  } else {
                    setPreviousVolume(audioVolume);
                    setIsMuted(true);
                  }
                }}
                title={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
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

          {/* Background music upload and queue (always visible) */}
          <div className="space-y-2">
            <Label>Background Music</Label>
            <div className="flex items-center gap-2">
              <input
                id="audioUpload"
                type="file"
                accept="audio/*"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>

            {/* Volume control: always visible so user can tweak even if queue empty */}
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm">Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={audioVolume}
                onChange={(e) => setAudioVolume(Number(e.target.value))}
              />
              <div className="text-xs text-muted-foreground ml-2">
                {Math.round(audioVolume * 100)}%
              </div>
            </div>

            {/* Queue */}
            {audioQueue.length > 0 && (
              <div className="space-y-2 mt-2">
                {audioQueue.map((a, idx) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ maxWidth: 200 }}
                      >
                        {a.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {idx === currentAudioIndex && playingIndex === idx
                          ? "Playing"
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveAudio(idx, -1);
                        }}
                        disabled={idx === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveAudio(idx, 1);
                        }}
                        disabled={idx === audioQueue.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTrackPlay(idx);
                        }}
                      >
                        {playingIndex === idx ? "Pause" : "Play"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAudio(idx);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isActive && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Reset form to defaults
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
                setAudioQueue([]);
                setTime(0);
                setCurrentSessionId(null);
                // clear audio state
                pauseAudio(false);
                setUserPaused(false);
                setCurrentAudioIndex(0);
              }}
              className="ml-2"
              variant="ghost"
            >
              Reset
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
