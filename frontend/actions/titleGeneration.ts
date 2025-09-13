"use server";

import { api } from "@/convex/_generated/api";
import { FeatureFlag, featureFlagEvents } from "@/features/flag";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
// Google Gen AI SDK
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
const convexClient = getConvexClient();

/**
 * Replace OpenAI usage with Google Gemini (via @google/genai).
 * Make sure PROCESS.ENV.GOOGLE_API_KEY is set in your environment.
 */
export async function titleGeneration(
  videoId: string,
  videoSummary: string,
  considerations: string
) {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error("User not found");
  }

  // init Gemini client (server-side only)
  const gapi = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  try {
    console.log("🎯 Video summary:", videoSummary);
    console.log("🎯 Generating title for videoId:", videoId);
    console.log("🎯 Considerations:", considerations);

    // Build a short system + user prompt asking for exactly one title
    const systemInstruction =
      "You are a helpful YouTube video creator assistant that creates high-quality SEO-friendly concise video titles. Return ONLY the title (no explanation). Use emojis only if they fit in the title naturally.";

    const userPrompt = `Please provide ONE concise YouTube title (and nothing else) for this video. Focus on the main points and key takeaways. SEO-friendly and 100 characters or less:

Video summary:
${videoSummary}

Considerations:
${considerations}`;

    // Use models.generateContent (non-streaming). Many SDK versions return `.text` on the response.
    // We use gemini-2.5-pro as the model — change if you want a different Gemini variant.
    const response: GenerateContentResponse = await gapi.models.generateContent({
      model: "gemini-2.5-pro", // choose appropriate variant your account allows
      // The SDK accepts `contents` array: system instruction + user prompt.
      contents: [
        { role: "system", parts: [{ text: systemInstruction }] },
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      // generation config (tweak as needed)
      temperature: 0.7,
      maxOutputTokens: 120, // enough for title + buffer
      // you can add thinkingConfig, safety settings etc. if desired
    } as any); // `as any` avoids tiny type mismatches across SDK versions

    // get plain text from response (SDKs normally expose `.text`)
    const titleText =
      (response && (response as any).text) ||
      (Array.isArray((response as any)?.candidates) && (response as any).candidates[0]?.content) ||
      null;

    const title = titleText?.trim() || "Unable to generate title";

    if (!title) {
      return {
        error: "Failed to generate title (System error)",
      };
    }

    // Persist in Convex
    await convexClient.mutation(api.titles.generate, {
      videoId,
      userId: user.id,
      title,
    });

    // Track analytics event
    await client.track({
      event: featureFlagEvents[FeatureFlag.TITLE_GENERATIONS].event,
      company: {
        id: user.id,
      },
      user: {
        id: user.id,
      },
    });

    console.log("🎯 Title generated:", title);

    return title;
  } catch (error) {
    console.error("❌ Error generating title (Gemini):", error);
    throw new Error("Failed to generate title");
  }
}
