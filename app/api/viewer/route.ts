import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCSRF } from "@/lib/csrf";
import { auditLog } from "@/lib/auditLog";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), ".updates.json");

function readUpdates(): Record<string, any[]> {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading updates file:", e);
  }
  return {};
}

function writeUpdates(updates: Record<string, any[]>) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(updates, null, 2));
  } catch (e) {
    console.error("Error writing updates file:", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { success } = rateLimit(`viewer-post:${ip}`, 20, 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 }
      );
    }

    // CSRF protection
    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, update } = body;

    if (!code || !update) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updates = readUpdates();

    if (!updates[code]) {
      updates[code] = [];
    }

    updates[code].unshift(update);
    writeUpdates(updates);

    await auditLog("update_delivered", { code: code.substring(0, 3) + "***" }, ip);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Viewer POST error:", e);
    return NextResponse.json(
      { error: "Failed to save update" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { success } = rateLimit(`viewer-get:${ip}`, 30, 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 }
      );
    }

    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ updates: [] });
    }

    const updates = readUpdates();

    if (!updates[code]) {
      return NextResponse.json({ updates: [] });
    }

    await auditLog("family_viewer_accessed", { code: code.substring(0, 3) + "***" }, ip);
    return NextResponse.json({ updates: updates[code] });
  } catch (e) {
    console.error("Viewer GET error:", e);
    return NextResponse.json(
      { error: "Failed to read updates" },
      { status: 500 }
    );
  }
}