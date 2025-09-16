import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    // Allow server-to-server calls using a shared secret header for backend
    const secretHeader = req.headers.get("x-nuclia-persist-secret") || null;
    const serviceSecret = process.env.NUCLIA_PERSIST_SECRET || null;
    let userId: string | null = null;

    // Parse body once
    const body = await req.json();
    if (secretHeader && serviceSecret && secretHeader === serviceSecret) {
      // trusted internal call - userId must be provided in the body
      userId = body.userId || null;
      if (!userId) return NextResponse.json({ mappings: [] });
    } else {
      const auth = getAuth(req);
      userId = auth?.userId || null;
      if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const fileIds = Array.isArray(body.fileIds) ? body.fileIds : [];
    if (!fileIds.length) return NextResponse.json({ mappings: [] });

    const convex = getConvexClient();
    const mappings = [];
    for (const fid of fileIds) {
      try {
        const file = await convex.query(api.files.getFile, { fileId: fid, userId });
  if (file && (file as any).nucliaResourceId) mappings.push({ fileId: fid, nucliaResourceId: (file as any).nucliaResourceId });
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ mappings });
  } catch (e: any) {
    return NextResponse.json({ error: "get_mappings_failed", message: e?.message || String(e) }, { status: 500 });
  }
}
