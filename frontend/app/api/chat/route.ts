import { NextRequest, NextResponse } from "next/server";
import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { ChatRequest, ChatResponse } from "@/types/types";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

// Initialize Gemini model
const model = google("gemini-1.5-flash");

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message, sessionId, context, attachments } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Message and sessionId are required" },
        { status: 400 }
      );
    }

    // Build system prompt with context
    const systemPrompt = `You are EduBox AI, an intelligent academic assistant for college students. You help students manage their academic life including:

- Course management and scheduling
- Assignment tracking and reminders  
- Study planning and productivity
- File organization and access
- Calendar and event management
- Academic performance insights
- Campus life and resources

You have access to the student's comprehensive academic data. Always provide helpful, accurate, and personalized responses based on their actual data.

STUDENT PROFILE:
${
  context?.user
    ? `
- Name: ${context.user.fullName}
- Major: ${context.user.major || "Not specified"}
- Year: ${context.user.year || "Not specified"}
- GPA: ${context.user.gpa || "Not recorded"}
`
    : "Profile not available"
}

CURRENT ACADEMIC STATUS:
${
  context?.userContext
    ? `
- Active Courses: ${context.userContext.statistics?.totalCourses || 0}
- Upcoming Assignments: ${
        context.userContext.statistics?.upcomingAssignments || 0
      }
- Overdue Assignments: ${
        context.userContext.statistics?.overdueAssignments || 0
      }
- Upcoming Events: ${context.userContext.statistics?.upcomingEvents || 0}

ASSIGNMENTS DUE SOON:
${
  context.userContext.assignments?.upcoming
    ?.map(
      (a: any) =>
        `- ${a.title} (Course: ${a.course}) - Due: ${new Date(
          a.dueDate
        ).toLocaleDateString()} - Priority: ${a.priority}`
    )
    .join("\n") || "No upcoming assignments"
}

${
  context.userContext.assignments?.overdue?.length > 0
    ? `
OVERDUE ASSIGNMENTS:
${context.userContext.assignments.overdue
  .map(
    (a: any) =>
      `- ${a.title} (Course: ${a.course}) - Was due: ${new Date(
        a.dueDate
      ).toLocaleDateString()} - Priority: ${a.priority}`
  )
  .join("\n")}`
    : ""
}

ACTIVE COURSES:
${
  context.userContext.courses
    ?.map(
      (c: any) =>
        `- ${c.code}: ${c.name} (Instructor: ${c.instructor || "TBD"})`
    )
    .join("\n") || "No active courses"
}

TODAY'S SCHEDULE:
${
  context.userContext.todaySchedule
    ?.map(
      (c: any) =>
        `- ${c.course}: ${c.name} ${
          c.schedule
            ?.map(
              (s: any) =>
                `(${s.startTime}-${s.endTime} at ${s.location || "TBD"})`
            )
            .join(", ") || ""
        }`
    )
    .join("\n") || "No classes today"
}

UPCOMING EVENTS:
${
  context.userContext.events
    ?.map(
      (e: any) =>
        `- ${e.title} (${e.type}) - ${new Date(
          e.startTime
        ).toLocaleDateString()} at ${e.location || "TBD"}`
    )
    .join("\n") || "No upcoming events"
}
`
    : "Academic data not available"
}

TODAY'S SPECIFIC CONTEXT:
${
  context?.todayContext
    ? `
ASSIGNMENTS DUE TODAY:
${
  context.todayContext.assignmentsDueToday
    ?.map(
      (a: any) =>
        `- ${a.title} (Course: ${a.course}) - Priority: ${a.priority} - Status: ${a.status}`
    )
    .join("\n") || "No assignments due today"
}

EVENTS TODAY:
${
  context.todayContext.eventsToday
    ?.map(
      (e: any) =>
        `- ${e.title} (${e.type}) - ${new Date(
          e.startTime
        ).toLocaleTimeString()} to ${new Date(
          e.endTime
        ).toLocaleTimeString()} at ${e.location || "TBD"}`
    )
    .join("\n") || "No events today"
}
`
    : ""
}

CONTEXT HINTS:
${
  context?.contextHints
    ? `
- Student has ${
        context.contextHints.hasUpcomingAssignments
          ? "upcoming assignments"
          : "no upcoming assignments"
      }
- Student has ${
        context.contextHints.hasOverdueAssignments
          ? "overdue assignments"
          : "no overdue assignments"
      }  
- Student has ${
        context.contextHints.hasTodayEvents ? "events today" : "no events today"
      }
- Student has ${
        context.contextHints.hasTodayAssignments
          ? "assignments due today"
          : "no assignments due today"
      }
- Current GPA: ${context.contextHints.currentGPA || "Not recorded"}
- Active courses: ${context.contextHints.activeCourseCount || 0}
`
    : ""
}

Guidelines:
- Be friendly, supportive, and encouraging
- Provide specific, actionable advice based on the student's actual data
- Use appropriate emojis to make responses engaging
- When asked about deadlines, schedules, or assignments, refer to the specific data provided
- If asking about "today" or "tomorrow", use the specific context provided
- Suggest relevant follow-up actions when helpful
- Keep responses concise but informative
- If you need more information, ask clarifying questions
- Always prioritize urgent/overdue items when relevant

Current time: ${new Date().toLocaleString()}`;

    // Removed verbose system prompt logging to avoid leaking user/context data in server logs

    // Prepare messages for the AI model
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Add attachment context if provided
    if (attachments && attachments.length > 0) {
      const attachmentContext = attachments
        .map((att) => `${att.type}: ${att.content}`)
        .join("\n");

      messages.push({
        role: "system" as const,
        content: `Additional context from attachments:\n${attachmentContext}`,
      });
    }

    // Check if streaming is requested
    const isStreaming = request.headers.get("accept")?.includes("text/stream");

    if (isStreaming) {
      // Use streaming response for real-time chat experience
      const result = await streamText({
        model,
        messages,
        temperature: 0.7,
        maxRetries: 3,
      });

      // Build a ReadableStream that pipes model chunks to the client and
      // also accumulates the full text so we can persist it to Convex.
      const streamBody = result.toTextStreamResponse().body;
      if (!streamBody) {
        return NextResponse.json({ error: "No stream body" }, { status: 500 });
      }

      const reader = streamBody.getReader();
      const encoder = new TextEncoder();

      let assembled = "";

      const proxyStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunkText =
                typeof value === "string"
                  ? value
                  : new TextDecoder().decode(value);
              assembled += chunkText;
              controller.enqueue(encoder.encode(chunkText));
            }
            controller.close();

            // Persist final assistant message to Convex if user is authenticated
            if (userId) {
              try {
                const convex = getConvexClient();
                await convex.mutation(api.chatMessages.addMessage, {
                  sessionId,
                  userId,
                  message: assembled,
                  role: "assistant",
                  messageIndex: 0, // consumer should update index
                });
              } catch (persistErr) {
                console.error(
                  "Failed to persist streamed assistant message:",
                  persistErr
                );
              }
            }
          } catch (streamErr) {
            console.error("Stream read error:", streamErr);
            try {
              controller.error(streamErr);
            } catch (_) {}
          }
        },
      });

      return new NextResponse(proxyStream, {
        headers: { "Content-Type": "text/stream; charset=utf-8" },
      });
    } else {
      // Use regular response for API calls
      const result = await generateText({
        model,
        messages,
        temperature: 0.7,
        maxRetries: 3,
      });

      // Track usage in Schematic
      // TODO: Implement proper Schematic event tracking
      // try {
      //   await client.events.createEvent({
      //     eventType: "track",
      //     companyKeys: { id: userId },
      //     userKeys: { id: userId },
      //   });
      // } catch (trackingError) {
      //   console.error("Failed to track usage:", trackingError);
      //   // Don't fail the request if tracking fails
      // }

  // Generate smart suggestions based on the response using the Gemini model
  const suggestions = await generateSuggestions(message, result.text);

      const response: ChatResponse = {
        message: result.text,
        sessionId,
        suggestions,
        metadata: {
          tokensUsed: result.usage?.totalTokens || 0,
          model: "gemini-2.5-flash",
          timestamp: Date.now(),
        },
      };

      // Persist in Convex the non-streamed assistant response
      try {
        const convex = getConvexClient();
        await convex.mutation(api.chatMessages.addMessage, {
          sessionId,
          userId,
          message: result.text,
          role: "assistant",
          messageIndex: 0,
        });
      } catch (persistError) {
        console.error("Failed to persist assistant message:", persistError);
      }

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process chat request",
      },
      { status: 500 }
    );
  }
}

async function generateSuggestions(
  userMessage: string,
  aiResponse: string
): Promise<string[]> {
  try {
    const prompt = `You are a helpful assistant that suggests up to 3 short, actionable follow-up queries or actions a student can take after a conversation. Return the suggestions as a JSON array of strings only (for example: ["Show my calendar for today","Find free time for studying"]).\n\nUser message: ${userMessage}\nAssistant response: ${aiResponse}\n\nGuidelines: Keep suggestions short (max 6 words), focused on academic actions (schedules, assignments, files, study help), and return 1-3 unique suggestions.`;

    const result = await generateText({
      model,
      messages: [
        { role: "system" as const, content: "You generate concise follow-up suggestion lists as JSON arrays." },
        { role: "user" as const, content: prompt },
      ],
      temperature: 0.35,
      maxRetries: 2,
    });

    const raw = result?.text?.trim() || "";

    const extractArray = (text: string): string[] | null => {
      if (!text) return null;
      let s = text.trim();
      s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
      s = s.replace(/^\s*```?\w*\s*/i, '').replace(/```\s*$/i, '').trim();

      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p.map((x) => String(x));
      } catch (_) {}

      const firstIdx = s.indexOf('[');
      if (firstIdx === -1) return null;
      let depth = 0;
      for (let i = firstIdx; i < s.length; i++) {
        const ch = s[i];
        if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) {
            const candidate = s.slice(firstIdx, i + 1);
            try {
              const parsed = JSON.parse(candidate);
              if (Array.isArray(parsed)) return parsed.map((x) => String(x));
            } catch (_) {}
            break;
          }
        }
      }

      return null;
    };

    const parsedArray = extractArray(raw);
    let suggestions: string[] = [];
    if (parsedArray) {
      suggestions = parsedArray.slice(0, 3).map((s) => s.trim()).filter(Boolean);
    } else {
      // fallback to splitting lines and removing stray tokens
      suggestions = raw
        .split(/\r?\n/) // prefer lines
        .map((l) => l.replace(/^\s*-\s*/, '').trim())
        .map((l) => l.replace(/^['\"]+|['\"]+$/g, ''))
        .filter((l) => l && !/^`+|^\[+$|^\]+$|^json$/i.test(l))
        .slice(0, 3);
    }

    return Array.from(new Set(suggestions));
  } catch (err) {
    console.error("Suggestion generation error:", err);
    return [];
  }
}

// Handle CORS for development
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
