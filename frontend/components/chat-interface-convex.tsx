"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useFeatureGate } from "@/components/feature-gate";
import { FeatureFlag } from "@/features/flag";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ButtonLoader, Loader } from "@/components/ui/loader";
import {
  Send,
  Bot,
  User,
  Lightbulb,
  Clock,
  BookOpen,
  Calendar,
  Users,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { startUserContextPrefetch } from "@/lib/prefetch";

interface ChatInterfaceProps {
  onClose: () => void;
  sessionId?: string;
}

const fallbackQuickSuggestions = [
  "What's due tomorrow?",
  "Find my biology notes from last week",
  "Do I have time to hit the gym before physics class?",
  "What's for lunch today?",
  "When is the next photography club meeting?",
];

// We will fetch model-generated starter suggestions and fall back to the static list

export function ChatInterface({ onClose, sessionId }: ChatInterfaceProps) {
  const { user: convexUser } = useConvexUser();
  const {
    canUse: canUseAI,
    hasReachedLimit,
    checkAccess,
    usage,
    limit,
  } = useFeatureGate(FeatureFlag.AI_CHAT_ASSISTANT);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [starterSuggestions, setStarterSuggestions] = useState<string[] | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convex queries and mutations
  const messages = useQuery(
    api.chatMessages.getMessages,
    sessionId ? { sessionId } : "skip"
  );

  const chatSession = useQuery(
    api.chatSessions.getChatSession,
    sessionId && convexUser ? { sessionId, userId: convexUser.clerkId } : "skip"
  );

  const createSession = useMutation(api.chatSessions.createChatSession);
  const updateSession = useMutation(api.chatSessions.updateSession);
  const addMessage = useMutation(api.chatMessages.addMessage);

  // Dedup + filter messages like the original
  const dedupedMessages = (messages || []).filter(
    (m, i, arr) =>
      arr.findIndex(
        (x) =>
          `${x.role}-${x.timestamp}-${x.message.slice(0, 40)}` ===
          `${m.role}-${m.timestamp}-${m.message.slice(0, 40)}`
      ) === i
  ) || [];

  // Get comprehensive user context for AI (with latest data)
  const userContext = useQuery(
    api.userContext.getUserContext,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  // Get today-specific context for date-related queries
  const todayContext = useQuery(
    api.userContext.getTodayContext,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  // Get the latest user profile data to ensure we have up-to-date information
  const latestUserProfile = useQuery(
    api.users.getUserByClerkId,
    convexUser ? { clerkId: convexUser.clerkId } : "skip"
  );

  // Auto-focus input when component mounts and refresh context
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Ensure we have fresh user data when starting a chat session
    if (convexUser && sessionId && !chatSession) {
      // Context will be automatically refreshed by Convex reactivity
    }
  }, [sessionId, convexUser, chatSession]);

  // Fetch model-generated starter suggestions when the component mounts or when user context becomes available
  useEffect(() => {
    let mounted = true;
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const contextSummary = JSON.stringify({
          // provide a lightweight summary to the suggestions endpoint
          user: latestUserProfile?.fullName ? { name: latestUserProfile.fullName } : null,
          stats: userContext?.statistics || {},
        });

        // Try localStorage cache first (one call per user login/session)
        const userKey = convexUser?.clerkId || "anon";
        const storageKey = `edubox:chat:suggestions:${userKey}`;
        const rawStored = localStorage.getItem(storageKey);
        if (rawStored) {
          try {
            const parsed = JSON.parse(rawStored);
            // Simple TTL check (stored as { suggestions, ts })
            if (parsed?.ts && Date.now() - parsed.ts < 1000 * 60 * 60 * 6) {
              setStarterSuggestions(parsed.suggestions || fallbackQuickSuggestions.slice(0, 5));
              setLoadingSuggestions(false);
              return;
            }
          } catch (_) {}
        }

        const res = await fetch("/api/chat/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contextSummary }),
        });

        if (!mounted) return;
        if (!res.ok) {
          setStarterSuggestions(fallbackQuickSuggestions.slice(0, 5));
          return;
        }

        const data = await res.json();
        const suggestions = Array.isArray(data?.suggestions)
          ? data.suggestions.map((s: any) => String(s))
          : fallbackQuickSuggestions.slice(0, 5);

        setStarterSuggestions(suggestions.length ? suggestions : fallbackQuickSuggestions.slice(0, 5));
        try {
          localStorage.setItem(storageKey, JSON.stringify({ suggestions, ts: Date.now() }));
        } catch (_) {}
      } catch (e) {
        setStarterSuggestions(fallbackQuickSuggestions.slice(0, 5));
      } finally {
        if (mounted) setLoadingSuggestions(false);
      }
    };

    // Only fetch once per component mount
    fetchSuggestions();

    return () => {
      mounted = false;
    };
  }, [latestUserProfile, userContext]);

  // Prefetch user context using shared helper to avoid duplicate intervals
  useEffect(() => {
    if (!convexUser) return;
    let mounted = true;
    let stop: (() => void) | undefined;

    const onUpdate = (_data: any) => {
      if (!mounted) return;
    };

    (async () => {
      stop = await startUserContextPrefetch(
        convexUser.clerkId,
        onUpdate,
        60_000
      );
    })();

    return () => {
      mounted = false;
      if (stop) stop();
    };
  }, [convexUser]);

  // Scroll only when a new saved message arrives or typing begins
  const prevLen = useRef(0);
  const prevTyping = useRef(false);
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;

    const scrollBottom = () => viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth"
    });

    if (dedupedMessages.length > prevLen.current) {
      scrollBottom();
      prevLen.current = dedupedMessages.length;
    } else if (isTyping && !prevTyping.current) {
      scrollBottom();
    }
    prevTyping.current = isTyping;
  }, [dedupedMessages.length, isTyping]);

  // Clear the transient stream only when the persisted assistant message covers it
  useEffect(() => {
    if (!streamingText) return;
    const last = [...dedupedMessages].reverse().find((m) => m.role === "assistant");
    if (last && last.message.startsWith(streamingText.slice(0, 40))) {
      setStreamingText("");
      setIsTyping(false);
    }
  }, [dedupedMessages, streamingText]);

  // Create session if it doesn't exist but only when we have messages or are sending one
  const ensureSession = async () => {
    if (sessionId && convexUser && !chatSession) {
      await createSession({
        userId: convexUser.clerkId,
        sessionId,
        title: "New Chat", // Will be updated with first message
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending || !sessionId || !convexUser) return;

    // Check feature access before sending
    if (!canUseAI) {
      toast.error(
        "AI Chat feature is not available on your current plan. Please upgrade to continue."
      );
      return;
    }

    // Check usage limit
    if (hasReachedLimit) {
      toast.error(
        "You have reached your AI chat limit. Please upgrade your plan to continue."
      );
      return;
    }

    setInputValue("");
    setIsSending(true);

    try {
      await ensureSession();

      const messageIndex = messages?.length || 0;
      await addMessage({
        sessionId,
        userId: convexUser.clerkId,
        message: content.trim(),
        role: "user",
        messageIndex,
      });

      // Title generation (non-blocking)
      (async () => {
        try {
          const generatedTitle = await generateTitleFromQuestion(
            content.trim(),
            sessionId
          );
          if (generatedTitle && generatedTitle.trim()) {
            await updateSession({
              sessionId,
              userId: convexUser.clerkId,
              updates: { title: generatedTitle },
            });
            return;
          }
        } catch (e) {
          // fallback
        }

        if (messageIndex === 0) {
          const title =
            content.trim().length > 50
              ? content.trim().substring(0, 50) + "..."
              : content.trim();
          try {
            await updateSession({
              sessionId,
              userId: convexUser.clerkId,
              updates: { title },
            });
          } catch (e) {
            // ignore
          }
        }
      })();

      setIsTyping(true);
      setStreamingText("");

      // Stream the response
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/stream",
        },
        body: JSON.stringify({
          message: content.trim(),
          sessionId: sessionId,
          context: {
            user: latestUserProfile || convexUser,
            userContext: userContext,
            todayContext: todayContext,
            timestamp: Date.now(),
            currentDateTime: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            contextHints: {
              hasUpcomingAssignments:
                (userContext?.assignments?.upcoming?.length || 0) > 0,
              hasOverdueAssignments:
                (userContext?.assignments?.overdue?.length || 0) > 0,
              upcomingAssignmentCount:
                userContext?.assignments?.upcoming?.length || 0,
              overdueAssignmentCount:
                userContext?.assignments?.overdue?.length || 0,
              hasTodayEvents: (todayContext?.eventsToday?.length || 0) > 0,
              hasTodayAssignments:
                (todayContext?.assignmentsDueToday?.length || 0) > 0,
              todayEventCount: todayContext?.eventsToday?.length || 0,
              todayAssignmentCount:
                todayContext?.assignmentsDueToday?.length || 0,
              currentGPA: userContext?.user?.gpa || latestUserProfile?.gpa,
              activeCourseCount: userContext?.statistics?.totalCourses || 0,
              recentFileCount: userContext?.statistics?.recentFiles || 0,
              hasFullProfile: !!(
                latestUserProfile?.major &&
                latestUserProfile?.year &&
                latestUserProfile?.institution
              ),
              major: latestUserProfile?.major || userContext?.user?.major,
              year: latestUserProfile?.year || userContext?.user?.year,
              institution:
                latestUserProfile?.institution ||
                userContext?.user?.institution,
              isNewSession: !chatSession,
              hasMessageHistory: (dedupedMessages?.length || 0) > 0,
              messageCount: dedupedMessages?.length || 0,
            },
            quickStats: {
              nextAssignment: userContext?.assignments?.upcoming?.[0],
              nextEvent: userContext?.events?.[0],
              todayClasses: userContext?.todaySchedule || [],
              recentGrades:
                userContext?.performance?.recentGrades?.slice(0, 3) || [],
            },
          },
        }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const pump = () =>
        reader.read().then(({ done, value }) => {
          if (done) return;
          buf += decoder.decode(value, { stream: true });
          setStreamingText(buf);
          requestAnimationFrame(pump); // use rAF for smoother updates
        });

      pump();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Generate title for the question - using a separate session to avoid polluting chat
  const generateTitleFromQuestion = async (
    question: string,
    sessionId: string
  ): Promise<string> => {
    try {
      // Use a different sessionId for title generation to avoid it appearing in chat
      const titleSessionId = `title-${sessionId}`;
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Create a concise, human-friendly title (max 6 words) that summarizes the user's question. Respond with the title only on a single line. Question: "${question.replace(
            /"/g,
            '\\"'
          )}"`,
          sessionId: titleSessionId,
        }),
      });

      const data = await response.json();
      const raw = data.message || "";
      const firstLine = raw.split(/\r?\n/).find((l: string) => l.trim().length > 0) || raw;
      const title = firstLine.trim().replace(/^['"]+|['"]+$/g, "");
      return title.slice(0, 120);
    } catch (e) {
      return "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pl-4 pr-4 pb-6 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">EduBox AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Your academic companion
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          X
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4">
            <div className="space-y-6 max-w-4xl mx-auto">
              {dedupedMessages
                .filter(message => 
                  // Filter out only title generation messages from display
                  !(message.role === "user" && message.message.includes("Create a concise, human-friendly title"))
                )
                .length === 0 && !streamingText ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Ask me about your assignments, schedule, or campus life!
                  </p>
                  <div className="grid gap-2 max-w-md mx-auto">
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader />
                      </div>
                    ) : (
                      (starterSuggestions || fallbackQuickSuggestions)
                        .slice(0, 5)
                        .map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-left justify-start"
                          >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            {suggestion}
                          </Button>
                        ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {dedupedMessages.map((message) => (
                    <div
                      key={`${message.role}-${message.timestamp}`}
                      className={cn(
                        "flex gap-3 p-4 rounded-lg max-w-[75%]",
                        message.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.role === "assistant" && (
                        <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 space-y-1">
                        {message.role === "assistant" ? (
                          <div className="prose max-w-none">
                            <ReactMarkdown>{message.message}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.message}
                          </p>
                        )}
                        <p className="text-xs opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  ))}

                  {/* Streaming partial assistant text */}
                  {isTyping && streamingText && (
                    <div className="flex gap-3 p-4 rounded-lg bg-muted max-w-[75%]">
                      <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="prose max-w-none">
                          <ReactMarkdown>{streamingText}</ReactMarkdown>
                        </div>
                        <p className="text-xs opacity-70">Thinking…</p>
                      </div>
                    </div>
                  )}

                  {isTyping && !streamingText && (
                    <div className="flex gap-3 p-4 rounded-lg bg-muted max-w-[75%]">
                      <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <Loader className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0 min-h-[80px] z-10">
        <div className="max-w-4xl mx-auto">
          {/* Show access/limit notice */}
          {(!canUseAI || hasReachedLimit) && (
            <div className="mb-2 text-sm text-muted-foreground">
              {!canUseAI && (
                <div>
                  You don't have access to the AI assistant on your plan.
                </div>
              )}
              {hasReachedLimit && (
                <div>You have reached your AI usage limit for this period.</div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                !canUseAI
                  ? "AI unavailable — upgrade to use"
                  : "Ask me anything about your academics..."
              }
              disabled={isSending || !canUseAI || hasReachedLimit}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={
                !inputValue.trim() || isSending || !canUseAI || hasReachedLimit
              }
            >
              {isSending ? (
                <ButtonLoader size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}