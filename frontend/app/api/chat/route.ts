import { NextRequest, NextResponse } from "next/server";
import { generateText, streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { ChatRequest, ChatResponse } from "@/types/types";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

// Initialize Gemini model
const model = google("gemini-1.5-flash");

// ---------------- helper utilities ----------------
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomElement<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function genRandomTitle(prefix = "arya") {
  const adjectives = [
    "quick",
    "mini",
    "final",
    "practice",
    "bonus",
    "advanced",
    "intro",
    "lab",
    "project",
    "review",
  ];
  const nouns = ["assignment", "task", "worksheet", "exercise", "project", "quiz"];
  return `${prefix} - ${randomElement(adjectives)} ${randomElement(nouns)} ${Date.now()
    .toString()
    .slice(-4)}`;
}

// Normalize string-like values returned by model/tools
function normalizeStringArg(val: any): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const t = val.trim();
    if (!t || /^null$/i.test(t) || /^undefined$/i.test(t)) return undefined;
    return t;
  }
  // handle arrays of strings or objects with `text` property
  if (Array.isArray(val) && val.length > 0) {
    const s = val.find((x) => typeof x === "string" && x.trim().length > 0);
    if (s) return String(s).trim();
  }
  if (typeof val === "object") {
    if (typeof val.text === "string" && val.text.trim().length > 0) return val.text.trim();
    if (typeof val.content === "string" && val.content.trim().length > 0) return val.content.trim();
    // try nested fields
    for (const key of ["description", "body", "value"]) {
      if (typeof (val as any)[key] === "string" && (val as any)[key].trim().length > 0)
        return (val as any)[key].trim();
    }
  }
  return undefined;
}

/**
 * Parse a variety of date inputs:
 * - "DD/MM/YYYY"
 * - "YYYY-MM-DD"
 * - ISO string
 * - "in 2 days", "2 days from now", "due in 2 days"
 * - "tomorrow", "today", "next week"
 * - "in 1 week", "in 2 weeks", "in 3 months"
 * Returns timestamp (ms) or null if cannot parse.
 */
function parseDateToTimestamp(input: any, baseDate = new Date()): number | null {
  if (input === undefined || input === null) return null;
  if (typeof input === "number") return input;
  const s = String(input).trim();

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map((x) => parseInt(x, 10));
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1.getTime();

  // days
  const daysMatch = s.match(/(\d+)\s*days?/i);
  if (daysMatch) {
    const n = parseInt(daysMatch[1], 10);
    const dt = new Date(baseDate);
    dt.setDate(dt.getDate() + n);
    return dt.getTime();
  }

  // weeks
  const weeksMatch = s.match(/(\d+)\s*weeks?/i);
  if (weeksMatch) {
    const n = parseInt(weeksMatch[1], 10);
    const dt = new Date(baseDate);
    dt.setDate(dt.getDate() + n * 7);
    return dt.getTime();
  }

  // months
  const monthsMatch = s.match(/(\d+)\s*months?/i);
  if (monthsMatch) {
    const n = parseInt(monthsMatch[1], 10);
    const dt = new Date(baseDate);
    dt.setMonth(dt.getMonth() + n);
    return dt.getTime();
  }

  if (/^tomorrow$/i.test(s)) {
    const dt = new Date(baseDate);
    dt.setDate(dt.getDate() + 1);
    return dt.getTime();
  }
  if (/^today$/i.test(s)) {
    return baseDate.getTime();
  }
  if (/^yesterday$/i.test(s)) {
    const dt = new Date(baseDate);
    dt.setDate(dt.getDate() - 1);
    return dt.getTime();
  }
  if (/next week/i.test(s)) {
    const dt = new Date(baseDate);
    dt.setDate(dt.getDate() + 7);
    return dt.getTime();
  }

  const parts = s.split(/[-.]/).map((x) => x.trim());
  if (
    parts.length === 3 &&
    parts[0].length === 4 &&
    parts[1].length <= 2 &&
    parts[2].length <= 2
  ) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }

  return null;
}

function parseDateTimeToTimestamp(input: any, defaultTimeHours = 9): number | null {
  if (input === undefined || input === null) return null;
  const s = String(input).trim();

  const dtParts = s.split(/\s+/);
  const last = dtParts[dtParts.length - 1];
  if (/^\d{1,2}:\d{2}$/.test(last)) {
    const time = last;
    const datePart = dtParts.slice(0, dtParts.length - 1).join(" ");
    const dateTs = parseDateToTimestamp(datePart);
    if (dateTs !== null) {
      const dt = new Date(dateTs);
      const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
      dt.setHours(hh, mm, 0, 0);
      return dt.getTime();
    }
    const full = new Date(s);
    if (!isNaN(full.getTime())) return full.getTime();
  }

  const daysMatch = s.match(/(\d+)\s*days?/i);
  if (daysMatch) {
    const n = parseInt(daysMatch[1], 10);
    const timeMatch = s.match(/(\d{1,2}:\d{2})/);
    const dt = new Date();
    dt.setDate(dt.getDate() + n);
    if (timeMatch) {
      const [hh, mm] = timeMatch[1].split(":").map((x) => parseInt(x, 10));
      dt.setHours(hh, mm, 0, 0);
    } else {
      dt.setHours(defaultTimeHours, 0, 0, 0);
    }
    return dt.getTime();
  }

  const dateTs = parseDateToTimestamp(s);
  if (dateTs !== null) {
    const dt = new Date(dateTs);
    dt.setHours(defaultTimeHours, 0, 0, 0);
    return dt.getTime();
  }

  const fallback = new Date(s);
  if (!isNaN(fallback.getTime())) return fallback.getTime();

  return null;
}

// Helper to robustly extract toolCalls (some SDKs return promise)
async function extractToolCallsPossiblyPromise(obj: any): Promise<any[]> {
  if (!obj) return [];
  try {
    if (typeof obj.then === "function") {
      const awaited = await obj;
      return Array.isArray(awaited) ? awaited : [];
    }
    return Array.isArray(obj) ? obj : [];
  } catch {
    return [];
  }
}

// ---------------- executeTools (robust & smart) ----------------
async function executeTools(toolCalls: any[], userId: string, context: any) {
  const convex = getConvexClient();
  const results: any[] = [];

  // Helper to find course ID by name or code
  function findCourseId(courseNameOrCode: string | undefined): string | undefined {
    if (!courseNameOrCode || !context?.userContext?.courses) return undefined;
    const course = context.userContext.courses.find(
      (c: any) =>
        String(c.name || "").toLowerCase().includes(String(courseNameOrCode).toLowerCase()) ||
        String(c.code || "").toLowerCase().includes(String(courseNameOrCode).toLowerCase())
    );
    return course?.id;
  }

  // Accept if toolCalls is promise-like
  const calls = await extractToolCallsPossiblyPromise(toolCalls);

  for (const toolCallRaw of calls) {
    // accept many shapes for args: args, arguments, parameters, input
    const toolName =
      toolCallRaw?.toolName ||
      toolCallRaw?.name ||
      toolCallRaw?.tool ||
      toolCallRaw?.functionName ||
      toolCallRaw?.function ||
      "unknown";

    const args =
      toolCallRaw?.args ||
      toolCallRaw?.arguments ||
      toolCallRaw?.parameters ||
      toolCallRaw?.input ||
      toolCallRaw?.payload ||
      {};

    try {
      switch (toolName) {
        case "createAssignment": {
          const safeArgs = typeof args === "object" && args ? args : {};

          // Prefer model-provided title if valid
          const titleFromModel = normalizeStringArg(safeArgs.title);
          const title = titleFromModel ?? genRandomTitle("arya");

          // Course name: prefer provided; fallback to first active course from context; else "General"
          let courseName = normalizeStringArg(safeArgs.courseName);
          if (!courseName && context?.userContext?.courses && context.userContext.courses.length > 0) {
            courseName = context.userContext.courses[0].name || context.userContext.courses[0].code;
          }
          if (!courseName) courseName = "General";

          const priority = normalizeStringArg(safeArgs.priority)?.toLowerCase() || "medium";

          const estimatedHours =
            safeArgs.estimatedHours !== undefined && !isNaN(Number(safeArgs.estimatedHours))
              ? Number(safeArgs.estimatedHours)
              : randomInt(1, 4);

          // Description: prefer model-provided string if valid, otherwise generate
          const descriptionFromModel = normalizeStringArg(safeArgs.description);
          const description =
            descriptionFromModel ||
            (safeArgs.autoGenerate === false ? "" : `Auto-generated by arya: ${randomElement([
              "short coding practice",
              "read chapter and summarize",
              "write a short report",
              "solve exercise problems",
              "implement small project",
            ])}.`);

          // Due date parsing: prefer dueDate, dueInDays, dueInWeeks, dueInMonths
          let dueTimestamp = parseDateToTimestamp(safeArgs.dueDate);
          if (dueTimestamp === null && safeArgs.dueInDays) {
            dueTimestamp = parseDateToTimestamp(`${safeArgs.dueInDays} days`);
          }
          if (dueTimestamp === null && safeArgs.dueInWeeks) {
            dueTimestamp = parseDateToTimestamp(`${safeArgs.dueInWeeks} weeks`);
          }
          if (dueTimestamp === null && safeArgs.dueInMonths) {
            dueTimestamp = parseDateToTimestamp(`${safeArgs.dueInMonths} months`);
          }
          if (dueTimestamp === null && typeof safeArgs.relative === "string") {
            dueTimestamp = parseDateToTimestamp(safeArgs.relative);
          }
          if (dueTimestamp === null) {
            // default: 2 days from now
            const dt = new Date();
            dt.setDate(dt.getDate() + 2);
            dueTimestamp = dt.getTime();
          }

          const courseId = findCourseId(courseName);

          const assignmentId = await convex.mutation(api.assignments.createAssignment, {
            userId,
            courseId,
            title,
            description,
            dueDate: dueTimestamp,
            priority,
            estimatedHours,
          });

          results.push({
            tool: "createAssignment",
            success: true,
            data: { assignmentId, title, courseName, priority, dueDate: dueTimestamp, description },
          });
          break;
        }

        case "createEvent": {
          const safeArgs = typeof args === "object" && args ? args : {};
          const title = normalizeStringArg(safeArgs.title) || genRandomTitle("arya event");
          const type = normalizeStringArg(safeArgs.type) || "personal";
          const description = normalizeStringArg(safeArgs.description) || `Auto ${type} event by arya: ${randomElement([
            "Bring notes",
            "Group discussion",
            "Review session",
            "Quick check-in",
          ])}`;

          let startTime = parseDateTimeToTimestamp(safeArgs.startDateTime, 10);
          let endTime = parseDateTimeToTimestamp(safeArgs.endDateTime, 11);

          if (startTime && !endTime) endTime = startTime + 60 * 60 * 1000;
          if (!startTime && endTime) startTime = endTime - 60 * 60 * 1000;
          if (!startTime && !endTime) {
            const dt = new Date();
            dt.setDate(dt.getDate() + 1);
            dt.setHours(10, 0, 0, 0);
            startTime = dt.getTime();
            endTime = dt.getTime() + 60 * 60 * 1000;
          }

          const location = normalizeStringArg(safeArgs.location) || "TBD";

          const courseId = findCourseId(normalizeStringArg(safeArgs.courseName));

          const eventId = await convex.mutation(api.events.createEvent, {
            userId,
            title,
            description,
            startTime: startTime!,
            endTime: endTime!,
            type,
            location,
            courseId,
          });

          results.push({
            tool: "createEvent",
            success: true,
            data: { eventId, title, type, startTime, endTime, location, description },
          });
          break;
        }

        case "createStudySession": {
          const safeArgs = typeof args === "object" && args ? args : {};
          const title = normalizeStringArg(safeArgs.title) || genRandomTitle("arya session");
          const subject = normalizeStringArg(safeArgs.subject) || (context?.userContext?.courses?.[0]?.name ?? "General");

          let startTime = parseDateTimeToTimestamp(safeArgs.startDateTime, 18);
          if (!startTime) {
            const dt = new Date();
            dt.setDate(dt.getDate() + 1);
            dt.setHours(19, 0, 0, 0);
            startTime = dt.getTime();
          }

          const plannedDuration =
            safeArgs.plannedDuration !== undefined ? Number(safeArgs.plannedDuration) : 60;

          const studyMethod = normalizeStringArg(safeArgs.studyMethod) || "pomodoro";
          const location = normalizeStringArg(safeArgs.location) || "Library";

          const courseId = findCourseId(subject);

          const sessionId = await convex.mutation(api.analytics.createStudySession, {
            userId,
            courseId,
            title,
            subject,
            startTime,
            plannedDuration,
            sessionType: "planned",
            studyMethod,
            location,
          });

          results.push({
            tool: "createStudySession",
            success: true,
            data: { sessionId, title, subject, startTime, plannedDuration },
          });
          break;
        }

        case "createCourse": {
          const safeArgs = typeof args === "object" && args ? args : {};
          const courseCode = normalizeStringArg(safeArgs.courseCode) || `CSE${randomInt(100, 499)}`;
          const courseName = normalizeStringArg(safeArgs.courseName) || `Course ${randomInt(1, 999)}`;
          const instructor = normalizeStringArg(safeArgs.instructor) || "Staff";
          const semester = normalizeStringArg(safeArgs.semester) || "Fall 2025";
          const credits = safeArgs.credits !== undefined ? Number(safeArgs.credits) : randomInt(2, 4);
          const schedule = Array.isArray(safeArgs.schedule) ? safeArgs.schedule : [];

          const courseId = await convex.mutation(api.courses.createCourse, {
            userId,
            courseCode,
            courseName,
            instructor,
            semester,
            credits,
            schedule,
          });

          results.push({
            tool: "createCourse",
            success: true,
            data: { courseId, courseCode, courseName },
          });
          break;
        }

        case "createCampusEvent": {
          const safeArgs = typeof args === "object" && args ? args : {};
          const title = normalizeStringArg(safeArgs.title) || genRandomTitle("campus");
          const category = normalizeStringArg(safeArgs.category) || "social";
          const description = normalizeStringArg(safeArgs.description) || `Campus event by arya: ${randomElement(["Meet & greet", "Sports", "Club meetup", "Workshop"])}`;

          let startTime = parseDateTimeToTimestamp(safeArgs.startDateTime, 12);
          let endTime = parseDateTimeToTimestamp(safeArgs.endDateTime, 14);
          if (startTime && !endTime) endTime = startTime + 2 * 60 * 60 * 1000;
          if (!startTime && !endTime) {
            const dt = new Date();
            dt.setDate(dt.getDate() + 3);
            dt.setHours(12, 0, 0, 0);
            startTime = dt.getTime();
            endTime = dt.getTime() + 2 * 60 * 60 * 1000;
          }

          const location = normalizeStringArg(safeArgs.location) || "Main Quad";
          const organizer = normalizeStringArg(safeArgs.organizer) || "Student Council";
          const capacity = safeArgs.capacity !== undefined ? Number(safeArgs.capacity) : 100;

          const eventId = await convex.mutation(api.campusLife.createCampusEvent, {
            title,
            category,
            description,
            startTime: startTime!,
            endTime: endTime!,
            location,
            organizer,
            capacity,
          });

          results.push({
            tool: "createCampusEvent",
            success: true,
            data: { eventId, title, category, startTime, endTime },
          });
          break;
        }

        default:
          results.push({
            tool: toolName,
            success: false,
            error: `Unknown tool: ${toolName}`,
          });
      }
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      results.push({
        tool: toolName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

// ---------------- declare tools (tool() + zod) ----------------
const createAssignmentTool = tool({
  description: "Create a new assignment for the student",
  inputSchema: z.object({
    title: z.string().optional(),
    courseName: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    estimatedHours: z.number().optional(),
    dueInDays: z.number().optional(),
    dueInWeeks: z.number().optional(),
    dueInMonths: z.number().optional(),
    relative: z.string().optional(),
    autoGenerate: z.boolean().optional(),
  }),
});

const createEventTool = tool({
  description: "Create a new event or appointment for the student",
  inputSchema: z.object({
    title: z.string().optional(),
    type: z
      .enum([
        "class",
        "assignment",
        "exam",
        "study-session",
        "club",
        "personal",
        "meeting",
        "dining",
      ])
      .optional(),
    description: z.string().optional(),
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),
    location: z.string().optional(),
    courseName: z.string().optional(),
  }),
});

const createStudySessionTool = tool({
  description: "Create a new study session for the student",
  inputSchema: z.object({
    title: z.string().optional(),
    subject: z.string().optional(),
    startDateTime: z.string().optional(),
    plannedDuration: z.number().optional(),
    studyMethod: z.string().optional(),
    location: z.string().optional(),
  }),
});

const createCourseTool = tool({
  description: "Create a new course for the student",
  inputSchema: z.object({
    courseCode: z.string().optional(),
    courseName: z.string().optional(),
    instructor: z.string().optional(),
    semester: z.string().optional(),
    credits: z.number().optional(),
    schedule: z
      .array(
        z.object({
          dayOfWeek: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          location: z.string().optional(),
        })
      )
      .optional(),
  }),
});

const createCampusEventTool = tool({
  description: "Create a new campus life event or activity",
  inputSchema: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),
    location: z.string().optional(),
    organizer: z.string().optional(),
    capacity: z.number().optional(),
  }),
});

// ---------------- POST handler ----------------
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { message, sessionId, context, attachments } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Message and sessionId are required" }, { status: 400 });
    }

    // Build full system prompt
    const systemPrompt = `You are EduBox AI, an intelligent academic assistant for college students. You help students manage their academic life including:

- Course management and scheduling
- Assignment tracking and reminders  
- Study planning and productivity
- File organization and access
- Calendar and event management
- Academic performance insights
- Campus life and resources

You have access to the student's comprehensive academic data. Always provide helpful, accurate, and personalized responses based on their context. When using tools, execute them efficiently.

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

Available tools: createAssignment, createEvent, createStudySession, createCourse, createCampusEvent

Current time: ${new Date().toLocaleString()}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: message },
    ];

    if (attachments && attachments.length > 0) {
      const attachmentContext = attachments.map((att) => `${att.type}: ${att.content}`).join("\n");
      messages.push({ role: "system" as const, content: `Additional context from attachments:\n${attachmentContext}` });
    }

    const isStreaming = request.headers.get("accept")?.includes("text/stream");

    const toolsMap = {
      createAssignment: createAssignmentTool,
      createEvent: createEventTool,
      createStudySession: createStudySessionTool,
      createCourse: createCourseTool,
      createCampusEvent: createCampusEventTool,
    };

    if (isStreaming) {
      const result = await streamText({
        model,
        messages,
        temperature: 0.7,
        maxRetries: 3,
        tools: toolsMap,
      });

      const streamRes = result.toTextStreamResponse();
      const streamBody = streamRes.body;
      if (!streamBody) {
        return NextResponse.json({ error: "No stream body" }, { status: 500 });
      }

      const reader = streamBody.getReader();
      const encoder = new TextEncoder();

      let assembled = "";

      // streaming timeout guard (e.g., 45s of inactivity)
      let lastReadAt = Date.now();
      const INACTIVITY_TIMEOUT_MS = 45_000;
      let inactivityTimer: any = setInterval(() => {
        if (Date.now() - lastReadAt > INACTIVITY_TIMEOUT_MS) {
          console.warn("Stream inactivity timeout reached, closing.");
          try {
            reader.cancel().catch(() => {});
          } catch (_) {}
          clearInterval(inactivityTimer);
        }
      }, 5_000);

      const proxyStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              lastReadAt = Date.now();
              if (done) break;
              const chunkText = typeof value === "string" ? value : new TextDecoder().decode(value);
              assembled += chunkText;
              controller.enqueue(encoder.encode(chunkText));
            }

            // After model stream ends: run tools (if any), then append action summary to client stream
            let toolResults: any[] = [];
            try {
              const called = await extractToolCallsPossiblyPromise(result.toolCalls);
              if (called.length > 0) {
                toolResults = await executeTools(called, userId, context);
              }
            } catch (toolErr) {
              console.error("Tool execution error in streaming:", toolErr);
              toolResults.push({ tool: "unknown", success: false, error: String(toolErr) });
            }

            // Build action summary text
            let actionSummary = "";
            if (toolResults.length > 0) {
              actionSummary =
                "Actions performed:\n" +
                toolResults
                  .map((r) =>
                    r.success
                      ? `✓ Created ${String(r.tool || "").replace("create", "").trim()}: ${
                          r.data?.title || r.data?.courseName || r.data?.courseCode || r.data?.eventId || ""
                        }`
                      : `✗ Failed to create ${r.tool || "unknown"}${r.error ? `: ${r.error}` : ""}`
                  )
                  .join("\n");
            }

            if (actionSummary) {
              const summaryChunk = `\n\n${actionSummary}\n`;
       
              if (!assembled.includes(actionSummary)) {
                assembled += summaryChunk;
                controller.enqueue(encoder.encode(summaryChunk));
              }
            }

            controller.close();
            clearInterval(inactivityTimer);

 
            try {
              const convex = getConvexClient();
              await convex.mutation(api.chatMessages.addMessage, {
                sessionId,
                userId,
                message: assembled,
                role: "assistant",
                messageIndex: 0,
              });

   
            } catch (persistErr) {
              console.error("Failed to persist streamed assistant message:", persistErr);
            }
          } catch (streamErr) {
            console.error("Stream read error:", streamErr);
            try {
              controller.error(streamErr);
            } catch (_) {}
          } finally {
            try {
              reader.releaseLock?.();
            } catch (_) {}
            clearInterval(inactivityTimer);
          }
        },
      });

      return new NextResponse(proxyStream, {
        headers: { "Content-Type": "text/stream; charset=utf-8" },
      });
    } else {
    
      const result = await generateText({
        model,
        messages,
        temperature: 0.7,
        maxRetries: 3,
        tools: toolsMap,
      });

      let toolResults: any[] = [];
      try {
        const called = await extractToolCallsPossiblyPromise(result.toolCalls);
        if (called.length > 0) {
          toolResults = await executeTools(called, userId, context);
        }
      } catch (err) {
        console.error("Tool execution error:", err);
      }

      // If tools executed, append action summary to assistant text
      let finalText = result.text || "";
      if (toolResults.length > 0) {
        const actionSummary = toolResults
          .map((r) =>
            r.success
              ? `✓ Created ${String(r.tool || "").replace("create", "").trim()}: ${
                  r.data?.title || r.data?.courseName || r.data?.courseCode || r.data?.eventId || ""
                }`
              : `✗ Failed to create ${r.tool || "unknown"}${r.error ? `: ${r.error}` : ""}`
          )
          .join("\n");

        if (!finalText.includes(actionSummary)) {
          finalText = `${finalText}\n\nActions performed:\n${actionSummary}`;
        }
      }

      const suggestions = await generateSuggestions(message, finalText);

      const response: ChatResponse = {
        message: finalText,
        sessionId,
        suggestions,
        actions: toolResults.length > 0 ? toolResults : undefined,
        metadata: {
          tokensUsed: result.usage?.totalTokens || 0,
          model: "gemini-1.5-flash",
          timestamp: Date.now(),
        },
      };

      try {
        const convex = getConvexClient();
        await convex.mutation(api.chatMessages.addMessage, {
          sessionId,
          userId,
          message: finalText,
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
      { error: "Internal server error", message: "Failed to process chat request" },
      { status: 500 }
    );
  }
}


async function generateSuggestions(userMessage: string, aiResponse: string): Promise<string[]> {
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
      s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
      s = s.replace(/^\s*```?\w*\s*/i, "").replace(/```\s*$/i, "").trim();

      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p.map((x) => String(x));
      } catch (_) {}

      const firstIdx = s.indexOf("[");
      if (firstIdx === -1) return null;
      let depth = 0;
      for (let i = firstIdx; i < s.length; i++) {
        const ch = s[i];
        if (ch === "[") depth++;
        else if (ch === "]") {
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
      suggestions = raw
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*-\s*/, "").trim())
        .map((l) => l.replace(/^['\"]+|['\"]+$/g, ""))
        .filter((l) => l && !/^`+|^\[+$|^\]+$|^json$/i.test(l))
        .slice(0, 3);
    }

    return Array.from(new Set(suggestions));
  } catch (err) {
    console.error("Suggestion generation error:", err);
    return [];
  }
}

// ---------------- CORS OPTIONS ----------------
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
