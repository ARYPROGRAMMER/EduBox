import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";

const model = google("gemini-2.0-flash");

type ReqBody = {
  context?: string; // optional context (e.g., recent sessions, assignments)
  userId?: string; // NOTE: this is accepted for now per request (don't secure yet)
  options?: Record<string, any>;
};

export async function POST(request: NextRequest) {
  try {
    const reqBody: ReqBody = await request.json();
    const { context, userId: clientUserId, options } = reqBody;

    // Derive authenticated userId from Clerk for any persistence. We still allow
    // unauthenticated requests to stream content, but persistence requires auth.
    const { userId } = await auth();

    // Build prompt + system instruction depending on requested contentType
    const contentType = options?.contentType;
    const userPromptNote = options?.userPrompt
      ? `\n\nUser request: ${options.userPrompt}`
      : "";

    let prompt: string;
    let systemInstruction: string;

    if (contentType === "study_plan_title") {
      // Return a short, 3-8 word title for the provided plan text
      const planText = context || "";
      prompt =
        `Generate a concise, human-friendly title (3-8 words) for the following study plan or description:\n\n${planText}\n\nOnly output the title on a single line. Do not include any extra commentary.` +
        userPromptNote;
      systemInstruction = `You are an assistant that creates short titles for study plans. Return only a single short title.`;
    } else {
      // Default: full study plan generation
      prompt = `Create a detailed, actionable study plan for this student using the following context:\n${
        context || "No additional context provided."
      }${userPromptNote}\n\nProduce a structured plan with 3-6 recommended study sessions/tasks. For each item include:\n- A short title\n- An estimated duration (in minutes)\n- Priority (high/medium/low)\n- A one-sentence justification\n- Concrete next steps or exercises to do during the session\n\nOutput the plan in Markdown, with clear headings and bullet points.`;
      systemInstruction = `You are EduBox Study Planner. Produce a helpful, step-by-step study plan aimed at a college student. Favor slightly longer, concrete recommendations with next-step actions and example exercises.`;
    }

    const messages = [
      { role: "system" as const, content: systemInstruction },
      { role: "user" as const, content: prompt },
    ];

    const result = await streamText({
      model,
      messages,
      temperature: 0.3,
    });

    const textResponse = result.toTextStreamResponse();
    const streamBody = textResponse.body;
    if (!streamBody) {
      return NextResponse.json({ error: "No stream body" }, { status: 500 });
    }

    const reader = streamBody.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let assembled = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunkText =
              typeof value === "string" ? value : decoder.decode(value);
            assembled += chunkText;
            controller.enqueue(encoder.encode(chunkText));
          }

          controller.close();

          // Persist assembled recommendations to Convex if userId present
          // Skip persistence for title-extraction calls (contentType === 'study_plan_title')
          // Persist only when we have an authenticated userId.
          if (userId && contentType !== "study_plan_title") {
            try {
              const convex = getConvexClient();
              await convex.mutation(api.generations.createGeneration, {
                // Use server-derived Clerk userId (ignore client-supplied value).
                userId,
                title:
                  options?.title ??
                  (options?.contentType === "study_plan"
                    ? "Study Plan"
                    : "Study Recommendations"),
                contentType: options?.contentType ?? "study_recommendations",
                prompt,
                generatedText: assembled,
                model: "gemini-2.0-flash",
                tokens: undefined,
                usage: undefined,
                // Avoid passing nested arbitrary objects; store a compact string instead
                metadata: options
                  ? { rawOptions: JSON.stringify(options) }
                  : undefined,
                visibility: "private",
              });
            } catch (err) {
              console.error("Failed to persist study recommendations:", err);
            }
          }
        } catch (err) {
          console.error("Stream error in ai-study generate route:", err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("ai-study generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate study recommendations" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
