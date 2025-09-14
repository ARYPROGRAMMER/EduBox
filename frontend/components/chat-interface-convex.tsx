"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
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
import { startUserContextPrefetch } from '@/lib/prefetch';

interface ChatInterfaceProps {
  onClose: () => void;
  sessionId?: string;
}

const quickSuggestions = [
  "What's due tomorrow?",
  "Find my biology notes from last week",
  "Do I have time to hit the gym before physics class?",
  "What's for lunch today?",
  "When is the next photography club meeting?",
];

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

  const createSession = useMutation(api.chatSessions.createChatSession);
  const updateSession = useMutation(api.chatSessions.updateSession);
  const addMessage = useMutation(api.chatMessages.addMessage);

  // Auto-focus input when component mounts and refresh context
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Ensure we have fresh user data when starting a chat session
    if (convexUser && sessionId && !chatSession) {
      // Context will be automatically refreshed by Convex reactivity
      // debug logging intentionally removed
    }
  }, [sessionId, convexUser, chatSession]);

  // Prefetch user context using shared helper to avoid duplicate intervals
  useEffect(() => {
    if (!convexUser) return;
    let mounted = true;
    let stop: (() => void) | undefined;

    const onUpdate = (_data: any) => {
      // noop for chat component; prefetch warms server cache
      if (!mounted) return;
    };

    (async () => {
      stop = await startUserContextPrefetch(convexUser.clerkId, onUpdate, 300_000);
    })();

    return () => {
      mounted = false;
      if (stop) stop();
    };
  }, [convexUser]);

  // Create session if it doesn't exist but only when we have messages or are sending one
  const ensureSessionExists = async () => {
    if (sessionId && convexUser && !chatSession) {
      await createSession({
        userId: convexUser.clerkId,
        sessionId,
        title: "New Chat", // Will be updated with first message
      });
    }
  };

  // Improved auto-scroll with smooth behavior and better timing
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          // Use requestAnimationFrame for smooth scrolling
          requestAnimationFrame(() => {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: "smooth",
            });
          });
        }
      }
    };

    // Scroll when messages change or when typing indicator appears/disappears
    if (messages || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  // Additional scroll when user sends a message
  useEffect(() => {
    if (isSending) {
      const scrollContainer = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [isSending]);

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
      toast.error("You have reached your AI chat limit. Please upgrade your plan to continue.");
      return;
    }

    setInputValue("");
    setIsSending(true);

    try {
      // Ensure session exists before sending message
      await ensureSessionExists();

      // Add user message
      const messageIndex = messages?.length || 0;
      await addMessage({
        sessionId,
        userId: convexUser.clerkId,
        message: content.trim(),
        role: "user",
        messageIndex,
      });

      // Generate an AI-produced concise title for this question and update the session title
      (async () => {
        try {
          const generatedTitle = await generateTitleFromQuestion(content.trim(), sessionId);
          if (generatedTitle && generatedTitle.trim()) {
            await updateSession({
              sessionId,
              userId: convexUser.clerkId,
              updates: { title: generatedTitle },
            });
            return;
          }
        } catch (e) {
          // ignore and fallback to first-message heuristic below
        }

        // Fallback for the very first message: use a snippet of the content
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
            // non-fatal
          }
        }
      })();

      setIsTyping(true);

      // Get AI response from real Gemini API
      try {
        const aiResponse = await generateAIResponse(content.trim(), sessionId);
        await addMessage({
          sessionId,
          userId: convexUser.clerkId,
          message: aiResponse,
          role: "assistant",
          messageIndex: messageIndex + 1,
        });
        // session title is handled by generateTitleFromQuestion (non-blocking)
      } catch (error) {
        console.error("Failed to get AI response:", error);
        await addMessage({
          sessionId,
          userId: convexUser.clerkId,
          message:
            "I'm sorry, I'm having trouble responding right now. Please try again.",
          role: "assistant",
          messageIndex: messageIndex + 1,
        });
      } finally {
        setIsTyping(false);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Real AI response using Gemini API
  const generateAIResponse = async (
    userMessage: string,
    sessionId: string
  ): Promise<string> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId,
          context: {
            // Core user data (latest from database)
            user: latestUserProfile || convexUser,

            // Comprehensive academic context
            userContext: userContext,
            todayContext: todayContext,

            // Real-time metadata
            timestamp: Date.now(),
            currentDateTime: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Enhanced context hints for better AI responses
            contextHints: {
              // Academic status
              hasUpcomingAssignments:
                (userContext?.assignments?.upcoming?.length || 0) > 0,
              hasOverdueAssignments:
                (userContext?.assignments?.overdue?.length || 0) > 0,
              upcomingAssignmentCount:
                userContext?.assignments?.upcoming?.length || 0,
              overdueAssignmentCount:
                userContext?.assignments?.overdue?.length || 0,

              // Today's schedule
              hasTodayEvents: (todayContext?.eventsToday?.length || 0) > 0,
              hasTodayAssignments:
                (todayContext?.assignmentsDueToday?.length || 0) > 0,
              todayEventCount: todayContext?.eventsToday?.length || 0,
              todayAssignmentCount:
                todayContext?.assignmentsDueToday?.length || 0,

              // Academic performance
              currentGPA: userContext?.user?.gpa || latestUserProfile?.gpa,
              activeCourseCount: userContext?.statistics?.totalCourses || 0,
              recentFileCount: userContext?.statistics?.recentFiles || 0,

              // User profile completeness
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

              // Session context
              isNewSession: !chatSession,
              hasMessageHistory: (messages?.length || 0) > 0,
              messageCount: messages?.length || 0,
            },

            // Quick reference data for common queries
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Error calling chat API:", error);
      throw error;
    }
  };

  // Generate a concise title for the user's question using the same AI pipeline.
  const generateTitleFromQuestion = async (
    question: string,
    sessionId: string
  ): Promise<string> => {
    try {
      // Instruct the model to return a single-line concise title only
      const prompt = `Create a concise, human-friendly title (max 6 words) that summarizes the user's question. Respond with the title only on a single line. Question: "${question.replace(/"/g, '\\"')}"`;
      const raw = await generateAIResponse(prompt, sessionId);
      if (!raw) return "";
      // Extract first non-empty line and trim quotes
      const firstLine = raw.split(/\r?\n/).find((l) => l.trim().length > 0) || raw;
      const title = firstLine.trim().replace(/^['"]+|['"]+$/g, "");
      // limit length
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
      <div className="flex items-center justify-between p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">EduBox AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Your academic companion
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {!messages || messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Ask me about your assignments, schedule, or campus life!
                  </p>
                  <div className="grid gap-2 max-w-md mx-auto">
                    {quickSuggestions.map((suggestion, index) => (
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
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message._id}
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
                        {message.role === 'assistant' ? (
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

                  {isTyping && (
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
      <div className="p-4 border-t bg-card flex-shrink-0 min-h-[80px] z-10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about your academics..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputValue.trim() || isSending}
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
