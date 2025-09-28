import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";

// Use same model family
const model = google("gemini-2.0-flash");

// Simple in-memory cache to avoid repeated Gemini calls for the same user/context.
// Map key -> { suggestions: string[], ts: number }
const cache = new Map<string, { suggestions: string[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export async function POST(request: NextRequest) {
  try {
    // Optional auth - prefer user's id to key the cache
    let userId: string | null = null;
    try {
      const a = await auth();
      userId = a.userId || null;
    } catch (_) {
      userId = null;
    }

    const body = await request.json().catch(() => ({}));
    const { contextSummary } = body;

    // Use a cache key composed of userId + a hash of contextSummary
    const key = `${userId || "anon"}:${String(contextSummary || "")}`;
    const now = Date.now();
    const existing = cache.get(key);
    if (existing && now - existing.ts < CACHE_TTL) {
      return NextResponse.json({ suggestions: existing.suggestions });
    }

    const prompt = `You are EduBox suggestion generator. Provide up to 5 short starter suggestions (1-6 words each) a college student might ask an academic assistant. Return the result as a JSON array of strings only. Context: ${
      contextSummary || "no context"
    }`;

    const result = await generateText({
      model,
      messages: [
        {
          role: "system" as const,
          content: "Generate short starter suggestions as a JSON array.",
        },
        { role: "user" as const, content: prompt },
      ],
      temperature: 0.4,
      maxRetries: 2,
    });

    const raw = result?.text?.trim() || "";

    // Helper: try to extract a JSON array from text, including stripping code fences
    const extractArray = (text: string): string[] | null => {
      if (!text) return null;
      let s = text.trim();
      // strip triple-backtick blocks like ```json or ```
      s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
      // strip any remaining fenced markers and leading language tag
      s = s
        .replace(/^\s*```?\w*\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      // Try direct parse
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p.map((x) => String(x));
      } catch (_) {}

      // Try to find first balanced JSON array substring
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

    let suggestions: string[] = [];
    const parsedArray = extractArray(raw);
    if (parsedArray) {
      suggestions = parsedArray.slice(0, 5);
    } else {
      // fallback: split on newlines and filter out tokens like `json`, `[` or `]`
      suggestions = raw
        .split(/\r?\n/) // prefer lines
        .map((l) => l.replace(/^\s*-\s*/, "").trim())
        .map((l) => l.replace(/^['\"]+|['\"]+$/g, ""))
        .filter((l) => l && !/^`+|^\[+$|^\]+$|^json$/i.test(l))
        .slice(0, 5);
    }

    // store in cache (even if suggestions is empty to avoid repeated calls)
    cache.set(key, { suggestions, ts: Date.now() });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("/api/chat/suggestions error:", err);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
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
