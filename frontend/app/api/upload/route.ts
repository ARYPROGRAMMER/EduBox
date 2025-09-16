// app/api/upload/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs"; // IMPORTANT: allow using fs in Next.js route

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentType, data } = body as {
      filename: string;
      contentType?: string;
      data: string;
    };

    if (!filename || !data) {
      return NextResponse.json({ error: "missing file" }, { status: 400 });
    }

    // Save to the app's public/uploads directory (Next.js will serve files under /uploads/...)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Decode base64 data
    const matches = data.match(/^data:(.*);base64,(.*)$/);
    const buffer = matches
      ? Buffer.from(matches[2], "base64")
      : Buffer.from(data, "base64");

    // Make filename safe
    const safeBase = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const safeName = `${Date.now()}-${safeBase}`;
    const outPath = path.join(uploadsDir, safeName);

    await fs.writeFile(outPath, buffer);

    // Return a root-relative URL so the browser always requests /uploads/<file>
    // (If you prefer an absolute URL include origin: `${req.headers.get('origin') || ''}/uploads/${safeName}`)
    const url = `/uploads/${safeName}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error("upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
