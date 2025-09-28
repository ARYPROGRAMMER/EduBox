import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";

// Initialize Gemini model (match project's existing pattern)
const model = google("gemini-2.0-flash");

type ReqBody = {
  prompt: string;
  contentType?: string;
  options?: Record<string, any>;
  userId?: string; // Convex user id (server should validate/auth in real deployments)
};

export async function POST(request: NextRequest) {
  try {
    const reqBody: ReqBody = await request.json();
    const { prompt, contentType, options, userId: clientUserId } = reqBody;

    // Derive authenticated userId from Clerk for persistence. Allow unauthenticated
    // streaming, but require auth to write generated content to Convex.
    const { userId } = await auth();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    let systemInstruction = `You are EduBox Content Generator. Produce a ${
      contentType || "content"
    } tailored for a college student.`;

    if (options) {
      const optionParts = [];
      if (options.wordCount && typeof options.wordCount === "number") {
        optionParts.push(`Aim for approximately ${options.wordCount} words`);
      }
      if (options.tone && typeof options.tone === "string") {
        optionParts.push(
          `Use a ${options.tone.toLowerCase()} tone throughout the content`
        );
      }
      if (optionParts.length > 0) {
        systemInstruction += ` Important requirements: ${optionParts.join(
          ". "
        )}.`;
      }
    }

    systemInstruction +=
      " Be comprehensive yet concise, well-structured, and directly address the user's request.";

    const messages = [
      { role: "system" as const, content: systemInstruction },
      { role: "user" as const, content: prompt },
    ];

    // Create a streaming result from the AI SDK
    const result = await streamText({
      model,
      messages,
      temperature: 0.7,
    });

    // Convert the SDK result into a Response we can read from and also
    // re-stream to the client. We read from the response body reader so we
    // can assemble the final text for persistence while forwarding chunks.
    const textResponse = result.toTextStreamResponse();
    const streamBody = textResponse.body;
    if (!streamBody) {
      return NextResponse.json({ error: "No stream body" }, { status: 500 });
    }

    const reader = streamBody.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let assembled = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // value is a Uint8Array chunk from the text response
            const chunkText =
              typeof value === "string" ? value : decoder.decode(value);
            assembled += chunkText;
            controller.enqueue(encoder.encode(chunkText));
          }

          controller.close();

          // Persist to Convex only if request is authenticated. We ignore any
          // client-supplied userId and favor Clerk-provided identity.
          if (userId) {
            try {
              const convex = getConvexClient();
              // Persist to dedicated ai_content table so AI Content Generation
              // history stays separate from other LLM outputs (study plans, etc.)
              await convex.mutation(api.aiContent.createAiContent, {
                userId,
                title:
                  options?.title ?? (contentType ? contentType : "AI Content"),
                contentType: contentType ?? "ai_content",
                prompt,
                generatedText: assembled,
                model: "gemini-2.0-flash",
                tokens: undefined,
                usage: undefined,
                metadata: options
                  ? { rawOptions: JSON.stringify(options) }
                  : undefined,
                visibility: "private",
              });

              // Optional: keep legacy storage for migration/audit. Uncomment if you
              // want writes duplicated to the old `generations` table during migration.
              // await convex.mutation(api.generations.createGeneration, {
              //   userId,
              //   title: options?.title ?? (contentType ? contentType : 'AI Content'),
              //   contentType: contentType ?? 'ai_content',
              //   prompt,
              //   generatedText: assembled,
              //   model: "gemini-2.0-flash",
              //   metadata: options ? { rawOptions: JSON.stringify(options) } : undefined,
              //   visibility: "private",
              // });
            } catch (convexErr) {
              console.error(
                "Failed to persist AI content generation to Convex:",
                convexErr
              );
            }
          }
        } catch (streamErr) {
          console.error("Stream read error:", streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("AI content generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate content" },
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
