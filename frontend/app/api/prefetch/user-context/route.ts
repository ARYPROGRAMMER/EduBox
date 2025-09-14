import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const convex = getConvexClient();
    const data = await convex.query(api.userContext.getUserContext, { userId });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("prefetch user-context error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "use POST with body { userId }" }, { status: 400 });
}
