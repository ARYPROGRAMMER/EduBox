import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    // Support trusted server-to-server calls using a shared secret header, or Clerk auth.
    const secretHeader = req.headers.get("x-nuclia-persist-secret") || null;
    const serviceSecret = process.env.NUCLIA_PERSIST_SECRET || null;
    let callerUserId: string | null = null;

    if (secretHeader && serviceSecret && secretHeader === serviceSecret) {
      // Trusted internal call: allow mappings with explicit userId fields
      // callerUserId remains null and we will respect m.userId when present
    } else {
      const auth = getAuth(req);
      callerUserId = auth?.userId || null;
      if (!callerUserId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const mappings = body && Array.isArray(body.mappings) ? body.mappings : [];
    if (!mappings.length) return NextResponse.json({ ok: true, updated: 0 });

    const convex = getConvexClient();
    let updated = 0;
    for (const m of mappings) {
      try {
        // User-level mapping (persist Nuclia user resource id on Convex user)
        if (m.clerkId && m.nucliaResourceId) {
          await convex.mutation(api.users.setNucliaResourceId, {
            clerkId: m.clerkId,
            nucliaResourceId: m.nucliaResourceId,
          });
          updated++;
          continue;
        }

        // File-level mapping
        if (!m.fileId || !m.nucliaResourceId) continue;
        const targetUserId = m.userId || callerUserId;
        if (!targetUserId) {
          // Can't determine which user owns the file; skip
          continue;
        }
        await convex.mutation(api.files.setNucliaResourceId, {
          fileId: m.fileId,
          userId: targetUserId,
          nucliaResourceId: m.nucliaResourceId,
        });
        updated++;
      } catch (e) {
        const msg = (e as any)?.message || String(e);
        console.warn("persist-mapping: failed to persist mapping", m, msg);
      }
    }

    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    return NextResponse.json({ error: "persist_failed", message: e?.message || String(e) }, { status: 500 });
  }
}
