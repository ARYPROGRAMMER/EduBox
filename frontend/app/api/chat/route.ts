import { NextRequest, NextResponse } from "next/server";
import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { ChatRequest, ChatResponse } from "@/types/types";

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

    console.log(
      "System prompt with context:",
      systemPrompt.substring(0, 500) + "..."
    );

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

      return result.toTextStreamResponse();
    } else {
      // Use regular response for API calls
      const result = await generateText({
        model,
        messages,
        temperature: 0.7,
        maxRetries: 3,
      });

      // Generate smart suggestions based on the response
      const suggestions = generateSuggestions(message, result.text);

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

function generateSuggestions(
  userMessage: string,
  aiResponse: string
): string[] {
  const message = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();

  const suggestions: string[] = [];

  // Assignment-related suggestions
  if (
    message.includes("assignment") ||
    message.includes("homework") ||
    message.includes("due")
  ) {
    suggestions.push("Show me all upcoming deadlines");
    suggestions.push("Create a study schedule");
    suggestions.push("Set reminders for this assignment");
  }

  // Schedule-related suggestions
  if (
    message.includes("schedule") ||
    message.includes("time") ||
    message.includes("when")
  ) {
    suggestions.push("Show my calendar for today");
    suggestions.push("Find free time for studying");
    suggestions.push("Create a new event");
  }

  // Course-related suggestions
  if (
    message.includes("course") ||
    message.includes("class") ||
    message.includes("grade")
  ) {
    suggestions.push("Show my GPA progress");
    suggestions.push("View course materials");
    suggestions.push("Track attendance");
  }

  // File-related suggestions
  if (
    message.includes("file") ||
    message.includes("note") ||
    message.includes("document")
  ) {
    suggestions.push("Upload a new file");
    suggestions.push("Search my files");
    suggestions.push("Organize files by course");
  }

  // Study-related suggestions
  if (
    message.includes("study") ||
    message.includes("exam") ||
    message.includes("test")
  ) {
    suggestions.push("Start a study session");
    suggestions.push("Create study flashcards");
    suggestions.push("Find study groups");
  }

  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push("What's due this week?");
    suggestions.push("Show my schedule");
    suggestions.push("Help me plan my day");
  }

  // Limit to 3 suggestions and ensure uniqueness
  return [...new Set(suggestions)].slice(0, 3);
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
