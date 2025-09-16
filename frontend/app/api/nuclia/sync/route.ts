// app/api/nuclia/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

const BACKEND =
  process.env.NEXT_PUBLIC_NUCLIA_SYNC_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
      const auth = getAuth(req);
      const userId = auth?.userId;
      if (!userId) {
        return NextResponse.json(
          { error: "unauthenticated", message: "User must be signed in" },
          { status: 401 }
        );
      }

    // Build the authoritative user context server-side using Convex so the
    // payload can't be tampered with by the client.
    const convex = getConvexClient();
    const userContext = await convex.query(api.userContext.getUserContext, {
      userId,
    });
    const payload: any = userContext || {};

    // Try to fetch small file contents (if publicly accessible) so we can include
    // base64 content in the payload for the KB. Limit size to ~1MB and short timeout.
    if (payload.recentFiles && Array.isArray(payload.recentFiles)) {
      await Promise.all(
        payload.recentFiles.map(async (f: any) => {
          if (!f) return;
          // If the client provided a base64 blob for this file, prefer it.
          if (f.base64) return;
          if (!f.url) return;
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(f.url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!resp.ok) return;
            const contentLength = resp.headers.get("content-length");
            const max = 1024 * 1024; // 1 MB
            if (contentLength && Number(contentLength) > max) return;
            const buf = await resp.arrayBuffer();
            if (buf.byteLength > max) return;
            const b64 = Buffer.from(buf).toString("base64");
            f.base64 = b64;
          } catch (e) {
            // ignore fetch errors; base64 remains absent
          }
        })
      );
    }

    // Merge optional client-provided fileBlobs found in the incoming body into payload
    try {
      const body = await req.json();
      if (body && Array.isArray(body.fileBlobs) && payload && Array.isArray(payload.recentFiles)) {
        const map = new Map();
        body.fileBlobs.forEach((b: any) => { if (b && (b.id || b.storageId || b.name)) map.set(b.id || b.storageId || b.name, b.base64); });
        payload.recentFiles.forEach((f: any) => {
          if (!f) return;
          const key = f.id || f.storageId || f.name;
          if (key && map.has(key)) {
            f.base64 = map.get(key);
          }
        });
      }
    } catch (e) {
      // ignore body parse errors; proceed with server-built payload
    }

    // Build a minimal safe user profile server-side and send to backend so the
    // KB can be populated with profile info. Do not send Clerk sensitive fields.
    // Use any to avoid tight Clerk types here; only pass safe public fields.
    const a = auth as any;
    const userProfile = {
      id: userId,
      email: a?.email || a?.primaryEmailAddress?.emailAddress || null,
      phone: a?.phoneNumber || null,
      name: a?.fullName || null,
    };

    // Diagnostic log: show high-level payload info (don't log sensitive fields)
    try {
      const filesCount = payload && Array.isArray(payload.recentFiles) ? payload.recentFiles.length : 0;
      const blobs = payload && Array.isArray(payload.recentFiles) ? payload.recentFiles.filter((f:any)=>f && f.base64).length : 0;
      console.debug(`[nuclia-sync-proxy] user=${userId} recentFiles=${filesCount} attachedBlobs=${blobs}`);
    } catch (e) {}

    const sendBody = { userId, userProfile, payload };

    const resp = await fetch(`${BACKEND}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendBody),
    });

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    } else {
      const text = await resp.text();
      return new NextResponse(text, { status: resp.status });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "proxy_failed", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
