"use client";

import { useEffect, useState } from "react";
import { startUserContextPrefetch } from "@/lib/prefetch";
import ReactMarkdown from "react-markdown";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { toast as sonnerToast } from "sonner";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";
import { useSidebarState } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  BookOpen,
  Target,
  Clock,
  Lightbulb,
  Zap,
  MessageSquare,
  Calendar,
  Sparkles,
} from "lucide-react";

/**
 * Fixes applied to UI to prevent horizontal overflow:
 *  - Top-level container now hides page X overflow (overflow-x-hidden).
 *  - Tabs list is responsive (grid-cols-2 on small screens, grid-cols-5 on sm+)
 *    so the tab row no longer forces horizontal scrolling on small screens.
 *  - Key flex containers use `min-w-0` so children can truncate / wrap instead
 *    of causing an overflow.
 *  - ReactMarkdown rendering for code blocks / pre blocks uses
 *    `overflow-x-auto` and `whitespace-pre-wrap` to avoid long inline lines
 *    overflowing the layout.
 *  - Pre / streaming blocks also get `overflow-x-auto` and `break-words`.
 *  - Added safer key fallbacks when mapping items that may not have .id.
 *
 * This file contains only changes scoped to this component.
 */

export function AiStudyAssistant() {
  const { user } = useConvexUser();
  const { isSidebarOpen } = useSidebarState();
  const [activeTab, setActiveTab] = useState("personalized");

  // Real data queries
  const studyRecommendations = useQuery(
    api.aiStudyAssistant.getStudyRecommendations,
    user ? { userId: user.clerkId } : "skip"
  );

  const learningInsights = useQuery(
    api.aiStudyAssistant.getLearningInsights,
    user ? { userId: user.clerkId } : "skip"
  );

  const studyPlans = useQuery(
    api.aiStudyAssistant.getStudyPlans,
    user ? { userId: user.clerkId } : "skip"
  );

  // Local display copy of recommendations so we can prepend new generated ones
  const [displayRecommendations, setDisplayRecommendations] = useState<
    any[] | null
  >(null);
  const [userContextPrefetch, setUserContextPrefetch] = useState<any | null>(
    null
  );

  // Local generation state
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // Plan-specific generation state (separate UI for plans)
  const [generatedPlanContent, setGeneratedPlanContent] = useState("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planUserPrompt, setPlanUserPrompt] = useState("");
  const [displayStudyPlans, setDisplayStudyPlans] = useState<any[] | null>(
    null
  );
  const [refreshGenerationsCounter, setRefreshGenerationsCounter] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; id: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you with your studies. You can ask me to explain concepts, solve problems, or help you prepare for exams. What would you like to work on today?",
      id: "welcome",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    const chatContainer = document.querySelector("[data-chat-messages]");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const generations = useQuery(
    api.generations.getGenerationsByUser,
    user
      ? { userId: user.clerkId, limit: 10 + refreshGenerationsCounter }
      : "skip"
  );

  // Keep local displayRecommendations in sync with studyRecommendations query
  useEffect(() => {
    if (studyRecommendations) {
      setDisplayRecommendations(studyRecommendations.slice());
    }
  }, [studyRecommendations]);

  // Keep local displayStudyPlans in sync with server studyPlans query
  useEffect(() => {
    if (studyPlans) {
      setDisplayStudyPlans(studyPlans.slice());
    }
  }, [studyPlans]);

  // When generations update (after a new generation is saved), prepend the latest generation
  // into the displayRecommendations so users see it immediately in the Recommendations tab.
  useEffect(() => {
    if (!generations || generations.length === 0) return;
    const latest = generations[0];
    if (!latest) return;

    let parsed: any = null;
    try {
      parsed = JSON.parse(latest.generatedText);
    } catch (e) {
      parsed = {
        id: `gen-${(latest as any)._id || Date.now()}`,
        title: latest.title || "AI Generated Recommendations",
        description: latest.generatedText,
        type: "review",
        timeEstimate: "",
        difficulty: "medium",
        priority: "low",
        topics: [],
      };
    }

    setDisplayRecommendations((prev) => {
      const newItems = Array.isArray(parsed) ? parsed : [parsed];
      const deduped = (prev || []).filter(
        (r) => !newItems.find((n: any) => n.id && r.id === n.id)
      );
      return [...newItems, ...deduped];
    });
  }, [generations, refreshGenerationsCounter]);

  const handleGenerateRecommendations = async () => {
    if (!user) return;
    try {
      // Call the server streaming endpoint and display progressive results
      setGeneratedContent("");
      setIsGenerating(true);

      // include preloaded userContext when available to give the model more info
      const contextPayload = userContextPrefetch ?? {
        assignments: studyRecommendations,
      };

      const res = await fetch(`/api/ai-study/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({
          context: JSON.stringify(contextPayload),
          userId: user.clerkId,
        }),
      });

      if (!res.body) throw new Error("No response body from AI study endpoint");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = !!readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          // append progressively
          setGeneratedContent((prev) => prev + chunk);
        }
      }

      setIsGenerating(false);

      // Parse after streaming finished (use latest state of generatedContent)
      let parsed: any = null;
      try {
        parsed = JSON.parse(generatedContent);
      } catch (e) {
        parsed = {
          id: `gen-${Date.now()}`,
          title: "AI Generated Recommendations",
          description: generatedContent,
          type: "review",
          timeEstimate: "",
          difficulty: "medium",
          priority: "low",
          topics: [],
        };
      }

      setDisplayRecommendations((prev) => {
        const newItems = Array.isArray(parsed) ? parsed : [parsed];
        const deduped = (prev || []).filter(
          (r) => !newItems.find((n: any) => n.id && r.id === n.id)
        );
        return [...newItems, ...deduped];
      });

      // Trigger a small refresh so the Convex query for generations re-runs and shows the saved generation
      setRefreshGenerationsCounter((c) => c + 1);
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      setIsGenerating(false);
    }
  };

  // Create a new AI-generated study plan (streaming)
  const handleCreatePlan = async () => {
    if (!user) return;
    // Require a user-provided prompt for study plans
    if (!planUserPrompt || !planUserPrompt.trim()) {
      console.warn("Create Plan: prompt is required");
      return;
    }
    try {
      setGeneratedPlanContent("");
      setIsCreatingPlan(true);

      // Provide context: prefer prefetch, fallback to studyPlans
      const contextPayload = userContextPrefetch ?? { plans: studyPlans };

      const res = await fetch(`/api/ai-study/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({
          context: JSON.stringify(contextPayload),
          userId: user.clerkId,
          options: {
            contentType: "study_plan",
            title: "Study Plan",
            userPrompt: planUserPrompt,
          },
        }),
      });

      if (!res.body) throw new Error("No response body from AI study endpoint");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      let assembledLocal = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = !!readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          assembledLocal += chunk;
          setGeneratedPlanContent((prev) => prev + chunk);
        }
      }

      setIsCreatingPlan(false);
      // Immediately add the generated plan to the local display list so users can interact with it
      const newPlan = {
        id: `gen-${Date.now()}`,
        name: "Generated Study Plan",
        description: assembledLocal,
        duration: "",
        subjects: [],
        totalHours: 0,
        difficulty: "Medium",
        tasksCount: 0,
        progress: 0,
        isActive: false,
      };
      setDisplayStudyPlans((prev) => [newPlan, ...(prev || [])]);

      // Trigger refresh so persisted generation shows up in history
      setRefreshGenerationsCounter((c) => c + 1);
    } catch (error) {
      console.error("Failed to create plan:", error);
      setIsCreatingPlan(false);
    }
  };

  // Prefetch user context on mount using shared helper to avoid duplicate intervals across components
  useEffect(() => {
    if (!user) return;
    let stop: (() => void) | undefined;
    let mounted = true;

    const onUpdate = (data: any) => {
      if (!mounted) return;
      setUserContextPrefetch(data);
    };

    (async () => {
      stop = await startUserContextPrefetch(user.clerkId, onUpdate, 300_000);
    })();

    return () => {
      mounted = false;
      if (stop) stop();
    };
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "focus-session":
        return <Target className="w-6 h-6 text-primary-foreground" />;
      case "review":
        return <BookOpen className="w-6 h-6 text-primary-foreground" />;
      case "practice":
        return <Zap className="w-6 h-6 text-primary-foreground" />;
      default:
        return <BookOpen className="w-6 h-6 text-primary-foreground" />;
    }
  };

  // Normalize generated text that may be JSON-stringified, escaped, or wrapped in triple-backticks
  const normalizeMarkdown = (src: any) => {
    if (!src) return "";
    let text = src;
    // If it's an object, stringify for display
    if (typeof text === "object") {
      try {
        text = JSON.stringify(text, null, 2);
      } catch (e) {
        text = String(text);
      }
    }

    // If it's a JSON-encoded string ("..."), try to parse once to get actual string
    if (typeof text === "string") {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed === "string") text = parsed;
        else if (typeof parsed === "object")
          text = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // not JSON, continue
      }
    }
    if (typeof text === "string") {
      // Unescape common JSON-escaped newlines and quotes
      text = text
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"');

      // If the whole string is wrapped in triple-backticks, remove them
      if (/^```/.test(text) && /```$/.test(text)) {
        text = text.replace(/^```(?:\w+)?\n?/i, "").replace(/```$/i, "");
      }

      // If the text is itself a JSON string containing a markdown key, try to extract it
      try {
        const maybeJson = JSON.parse(text);
        if (maybeJson && typeof maybeJson === "object") {
          // prefer a `markdown` or `text` field if present
          if (typeof maybeJson.markdown === "string") text = maybeJson.markdown;
          else if (typeof maybeJson.text === "string") text = maybeJson.text;
          else text = JSON.stringify(maybeJson, null, 2);
        }
      } catch (e) {
        // ignore
      }

      // Remove common leading indentation (so auto-generated Markdown doesn't become a fenced code block)
      const lines = text.split("\n");
      let minIndent = Infinity;
      for (const line of lines) {
        if (!line.trim()) continue;
        const m = line.match(/^\s*/);
        if (m) minIndent = Math.min(minIndent, m[0].length);
      }
      if (minIndent !== Infinity && minIndent > 0) {
        text = lines.map((l: string) => l.slice(minIndent)).join("\n");
      }

      // Ensure headings and lists are separated by blank lines so ReactMarkdown treats them as blocks
      const blockLines = text.split("\n");
      const outLines: string[] = [];
      for (let i = 0; i < blockLines.length; i++) {
        const line = blockLines[i];
        const trimmed = line.trim();
        const isHeading = /^#{1,6}\s+/.test(trimmed);
        const isListItem =
          /^[-*+]\s+/.test(trimmed) ||
          /^\d+\.\s+/.test(trimmed) ||
          /^\(\d+\)\s+/.test(trimmed);

        if (isHeading || isListItem) {
          // if previous line exists and is not blank, insert a blank line
          if (
            outLines.length > 0 &&
            outLines[outLines.length - 1].trim() !== ""
          ) {
            outLines.push("");
          }
        }
        outLines.push(line);
      }
      text = outLines.join("\n");

      // Collapse multiple leading/trailing blank lines
      text = text.replace(/^\s*\n+/, "").replace(/\n+\s*$/, "");
    }

    return String(text).trim();
  };

  // Create study session mutation (used by Start Session)
  const createStudySession = useMutation(api.analytics.createStudySession);
  const createEvent = useMutation(api.events.createEvent);
  const createNotification = useMutation(api.notifications.createNotification);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Helper: ask the ai-study endpoint to generate a short title from a plan/description
  async function extractTitleFromPlan(planText: string) {
    if (!planText) return null;
    try {
      const res = await fetch(`/api/ai-study/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({
          context: JSON.stringify({ plan: planText }),
          userId: user?.clerkId,
          options: {
            contentType: "study_plan_title",
            title: "Short Title",
            userPrompt: "Provide a short, 3-8 word title for this study plan.",
          },
        }),
      });
      if (!res.body) return null;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assembled = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = !!readerDone;
        if (value) assembled += decoder.decode(value);
      }
      const firstLine = assembled.split("\n").find(Boolean) || assembled;
      const title = String(firstLine).trim();
      // shorten if too long
      return title.length > 80 ? title.slice(0, 77) + "..." : title;
    } catch (e) {
      console.error("Failed to extract title from plan via AI", e);
      return null;
    }
  }

  const handleStartSession = async (rec: any) => {
    // Require a signed-in user to create a session
    if (!user) {
      console.warn("Start session: no authenticated user");
      return;
    }
    // Prevent duplicate clicks/requests
    if (isStartingSession) return;
    setIsStartingSession(true);
    try {
      const now = Date.now();
      const planned =
        rec.timeEstimate && typeof rec.timeEstimate === "string"
          ? parseInt(rec.timeEstimate)
          : undefined;
      // determine a concise session title:
      // prefer rec.title, then rec.name (some plan objects use `name`),
      // but treat generic placeholders as missing and extract via AI from the plan text.
      const rawTitle = rec?.title || rec?.name || null;
      const planText =
        rec?.description ||
        rec?.summary ||
        (typeof rec === "string" ? rec : "");

      const placeholders = new Set(
        [
          "generated study plan",
          "study plan",
          "generated",
          "general study",
          "study session",
          "ai generated study plan",
          "generated study",
        ].map((s) => s.toLowerCase())
      );

      let sessionTitle: string | null = rawTitle || null;
      const shouldExtract =
        !sessionTitle ||
        placeholders.has(String(sessionTitle).toLowerCase()) ||
        (typeof sessionTitle === "string" && sessionTitle.trim().length < 6);
      if (shouldExtract) {
        const extracted = await extractTitleFromPlan(planText);
        sessionTitle =
          extracted ||
          sessionTitle ||
          (typeof rec === "string" ? rec.slice(0, 60) : "Study Session");
      }

      const finalTitle =
        (sessionTitle && String(sessionTitle).trim()) || "Study Session";

      const created = await createStudySession({
        userId: user.clerkId,
        title: finalTitle,
        description: rec.description || rec.summary || "",
        subject: rec.subject || "",
        startTime: now,
        plannedDuration: planned,
        sessionType: "study",
      });
      // Safely extract id whether Convex returned an id string or full inserted document
      let sessionId: string | null = null;
      if (created) {
        const createdAny: any = created;
        if (typeof createdAny === "string") sessionId = createdAny;
        else if (createdAny._id) sessionId = createdAny._id;
        else if (createdAny.id) sessionId = createdAny.id;
      }
      if (sessionId) {
        try {
          // Also create a planner event so it shows up in calendar and persists
          const start = now;
          const end = now + (planned ? planned * 60 * 1000 : 30 * 60 * 1000);
          await createEvent({
            userId: user.clerkId,
            title: finalTitle,
            description: rec.description || rec.summary || "",
            startTime: start,
            endTime: end,
            type: "study",
            location: "",
          });
        } catch (e) {
          // non-fatal
        }
        try {
          // give quick feedback and open planner focused on the session
          sonnerToast.success("Study session started — Opening planner…");
          try {
            localStorage.setItem("openStudySessionOnLoad", sessionId);
          } catch (e) {
            // ignore storage errors
          }
          window.open(`/dashboard/planner?session=${sessionId}`, "_blank");
          // create an in-app notification for the started session
          try {
            await createNotification({
              userId: user.clerkId,
              title: `Study session: ${finalTitle}`,
              message: `Your study session "${finalTitle}" has started.`,
              type: "study_session_started",
              relatedId: sessionId,
              relatedType: "study_session",
              actionUrl: `/dashboard/planner?session=${sessionId}`,
              actionLabel: "Open Planner",
            });
          } catch (e) {
            // non-fatal
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error("Failed to start session", err);
    }
    setIsStartingSession(false);
  };

  // Chat functionality
  const handleSendChatMessage = async () => {
    if (!user || !chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);

    // Add user message to chat
    const userMessageId = `user-${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, id: userMessageId },
    ]);

    // Add assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: assistantMessageId },
    ]);

    try {
      // Prepare context with user data
      const context = {
        user: {
          fullName: user.fullName || user.name || "Student",
          major: user.major || "Not specified",
          year: user.year || "Not specified",
          gpa: user.gpa || "Not recorded",
        },
        userContext: userContextPrefetch || {
          assignments: studyRecommendations,
          courses: [],
          events: [],
          statistics: {
            totalCourses: 0,
            upcomingAssignments: 0,
            overdueAssignments: 0,
            upcomingEvents: 0,
          },
        },
        todayContext: {
          assignmentsDueToday: [],
          eventsToday: [],
        },
        contextHints: {
          hasUpcomingAssignments: false,
          hasOverdueAssignments: false,
          hasTodayEvents: false,
          hasTodayAssignments: false,
          currentGPA: user.gpa || "Not recorded",
          activeCourseCount: 0,
        },
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/stream",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: chatSessionId,
          context: context,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedResponse += chunk;

        // Update the assistant message with streaming content
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedResponse }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // small helper to render markdown with safe code blocks (pre scroll)
  const Markdown = ({ children }: { children: string }) => (
    <ReactMarkdown
      components={{
        // render code blocks with horizontal scroll and wrapped pre
        code({ node, className, children: codeChildren, ...props }: any) {
          const content = String(codeChildren).replace(/\n$/, "");
          const isInline = !node || node.tagName !== "pre";
          if (isInline) {
            return (
              <code className={`break-words ${className || ""}`} {...props}>
                {content}
              </code>
            );
          }
          return (
            <pre
              className="overflow-x-auto whitespace-pre-wrap break-words rounded-md p-2 bg-muted/20"
              {...props}
            >
              <code className={className || ""}>{content}</code>
            </pre>
          );
        },
        // Ensure images and tables don't force overflow (if used)
        img({ ...props }) {
          return <img {...props} className="max-w-full h-auto" />;
        },
        table({ children, ...props }) {
          return (
            <div className="overflow-x-auto">
              <table {...props}>{children}</table>
            </div>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );

  return (
    <LockedFeature
      feature={FeatureFlag.AI_STUDY_ASSISTANT}
      title="AI Study Assistant"
      description="Get personalized study recommendations, learning insights, and adaptive study plans powered by AI."
      requiredPlan="PRO"
    >
      <div className="space-y-6 overflow-x-hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            AI Study Assistant
          </h2>
          <p className="text-muted-foreground">
            Personalized learning recommendations and insights powered by
            artificial intelligence.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2">
            <TabsTrigger value="personalized">Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="plans">Study Plans</TabsTrigger>
            <TabsTrigger value="chat">AI Tutor</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="personalized" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Personalized Recommendations
              </h3>
              <Button onClick={handleGenerateRecommendations}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Recommendations
              </Button>
            </div>

            <div className="grid gap-4">
              {isGenerating && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Generating recommendations…
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      The AI is streaming recommendations; they will appear
                      below as they arrive.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap break-words overflow-x-auto text-sm text-muted-foreground">
                      {generatedContent || "..."}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {(displayRecommendations || studyRecommendations)?.map(
                (rec: any) => {
                  const key =
                    rec?.id ||
                    rec?._id ||
                    (rec?.title && `${rec.title.slice(0, 40)}`) ||
                    Math.random();
                  return (
                    <Card key={key} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between min-w-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                              {getTypeIcon(rec.type)}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-lg truncate">
                                {rec.title}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 text-sm">
                                <Clock className="w-3 h-3" />
                                <span className="truncate">
                                  {rec.timeEstimate}
                                </span>
                                <span>•</span>
                                <Badge
                                  className={getDifficultyColor(rec.difficulty)}
                                >
                                  {rec.difficulty}
                                </Badge>
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority} Priority
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4 min-w-0">
                          {rec.description ? (
                            <div className="prose prose-invert max-w-none break-words">
                              <Markdown>
                                {normalizeMarkdown(rec.description)}
                              </Markdown>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {rec.topics?.map((topic: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs break-words"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(rec)}
                            disabled={isStartingSession}
                          >
                            {isStartingSession ? "Starting…" : "Start Session"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              ) || (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No recommendations available. Generate some above!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Learning Insights</h3>
              <Button variant="outline">
                <Brain className="w-4 h-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {learningInsights?.map((insight: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {insight.metric}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{insight.value}%</div>
                      <Badge variant="outline" className={insight.color}>
                        {insight.trend}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {insight.description}
                    </p>
                  </CardContent>
                </Card>
              )) || (
                <div className="col-span-3 text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Start studying to see insights!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <h3 className="text-lg font-semibold md:col-span-1">
                AI-Generated Study Plans
              </h3>

              <div className="md:col-span-2 flex w-full gap-3 items-start">
                <Textarea
                  placeholder="Tell the AI what you need the study plan for (required)"
                  value={planUserPrompt}
                  onChange={(e) =>
                    setPlanUserPrompt((e.target as HTMLTextAreaElement).value)
                  }
                  className="flex-1 min-h-[44px] min-w-0"
                />
                <div className="flex items-start">
                  <Button
                    onClick={async () => {
                      await handleCreatePlan();
                    }}
                    disabled={isCreatingPlan || !planUserPrompt.trim()}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {isCreatingPlan ? "Creating…" : "Create New Plan"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground md:col-start-2 md:col-span-2">
                Please describe what you need the study plan for (e.g., 'exam
                prep for Calculus, focus on integration and differential
                equations'). This is required.
              </p>
            </div>

            <div className="space-y-4">
              {isCreatingPlan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Generating plan…</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      The AI is streaming your new plan; it will be saved to
                      History when complete.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap break-words overflow-x-auto text-sm text-muted-foreground">
                      {generatedPlanContent || "..."}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {generatedPlanContent && !isCreatingPlan && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between min-w-0">
                      <div>
                        <CardTitle className="text-sm">
                          Generated Study Plan
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Saved to your history.
                        </CardDescription>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStartSession({
                              title: "Generated Study Plan",
                              description: generatedPlanContent,
                            })
                          }
                          disabled={isStartingSession}
                        >
                          {isStartingSession ? "Starting…" : "Start Session"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none break-words">
                      <Markdown>
                        {normalizeMarkdown(generatedPlanContent)}
                      </Markdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(displayStudyPlans || studyPlans)?.map((plan: any) => {
                const key =
                  plan?.id || plan?._id || plan?.name || Math.random();
                return (
                  <Card key={key}>
                    <CardHeader>
                      <div className="flex items-start justify-between min-w-0">
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">
                            {plan.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="truncate">{plan.duration}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span className="truncate">
                                {plan.subjects?.length} subjects
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="truncate">
                                {plan.totalHours}h total
                              </span>
                            </span>
                          </CardDescription>
                        </div>
                        <Badge
                          className={
                            plan.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4 min-w-0">
                        {plan.description ? (
                          <div className="prose prose-invert max-w-none break-words">
                            <Markdown>
                              {normalizeMarkdown(plan.description)}
                            </Markdown>
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {plan.subjects
                              ?.slice(0, 3)
                              .map((subject: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs break-words"
                                >
                                  {subject}
                                </Badge>
                              ))}
                          </div>
                          <Button
                            size="sm"
                            variant={plan.isActive ? "default" : "outline"}
                            onClick={() => handleStartSession(plan)}
                            disabled={isStartingSession}
                          >
                            {isStartingSession
                              ? "Starting…"
                              : plan.isActive
                              ? "Continue"
                              : "Start Plan"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) || (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No study plans yet. Create one above!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Study Assistant History</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRefreshGenerationsCounter((c) => c + 1)}
                >
                  Refresh
                </Button>
              </div>
            </div>

            <div className={`max-w-[${isSidebarOpen ? '1600px' : '1800px'}] space-y-4`}>
              {!generations || generations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No history yet. Generate a study plan to save it here.
                  </p>
                </div>
              ) : (
                (generations || []).map((generation: any) => {
                  const title =
                    generation.title || generation.contentType || "Generated";
                  const createdAt = generation.createdAt
                    ? new Date(generation.createdAt).toLocaleString()
                    : "-";
                  const key =
                    generation._id || generation.id || title || Math.random();

                  return (
                    <Card key={key} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between min-w-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <CardTitle className="text-lg truncate">
                                {title}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 text-sm">
                                <Clock className="w-3 h-3" />
                                <span className="truncate">{createdAt}</span>
                                <span>•</span>
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4 min-w-0">
                          <pre className="prose prose-invert max-w-none break-words">
                            <Markdown>
                              {normalizeMarkdown(generation.generatedText)}
                            </Markdown>
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Tutor Chat</CardTitle>
                <CardDescription>
                  Ask your personal AI tutor for help with any subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div
                    className="max-h-96 overflow-y-auto space-y-4"
                    data-chat-messages
                  >
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.role === "user" ? "justify-end" : ""
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Brain className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={`flex-1 min-w-0 ${
                            message.role === "user" ? "max-w-[80%]" : ""
                          }`}
                        >
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground ml-auto"
                                : "bg-muted/50"
                            }`}
                          >
                            {message.role === "assistant" && (
                              <p className="text-sm font-medium mb-1">
                                AI Tutor
                              </p>
                            )}
                            <div className="prose prose-sm max-w-none break-words">
                              {message.role === "assistant" ? (
                                <Markdown>{message.content}</Markdown>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">
                              {user?.fullName?.charAt(0) ||
                                user?.name?.charAt(0) ||
                                "U"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-1">AI Tutor</p>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      placeholder="Ask your AI tutor anything..."
                      className="flex-1 min-h-[60px] min-w-0"
                      disabled={isChatLoading}
                    />
                    <Button
                      className="self-end"
                      onClick={handleSendChatMessage}
                      disabled={isChatLoading || !chatInput.trim()}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Common requests for your AI tutor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() =>
                      setChatInput("Can you explain this concept to me?")
                    }
                    disabled={isChatLoading}
                  >
                    <BookOpen className="w-6 h-6" />
                    <span className="text-xs">Explain Concept</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() =>
                      setChatInput("Can you help me solve this problem?")
                    }
                    disabled={isChatLoading}
                  >
                    <Target className="w-6 h-6" />
                    <span className="text-xs">Solve Problem</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() =>
                      setChatInput("What are some effective study tips for me?")
                    }
                    disabled={isChatLoading}
                  >
                    <Lightbulb className="w-6 h-6" />
                    <span className="text-xs">Study Tips</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() =>
                      setChatInput("Help me prepare for my upcoming exams")
                    }
                    disabled={isChatLoading}
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="text-xs">Exam Prep</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeature>
  );
}
