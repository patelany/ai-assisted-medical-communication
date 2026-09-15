import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCSRF } from "@/lib/csrf";
import { auditLog } from "@/lib/auditLog";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { success } = rateLimit(`viewer-post:${ip}`, 20, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const body = await request.json();
    const { code, update } = body;

    if (!code || !update) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("viewer_updates")
      .insert({
        access_code: code,
        time: update.time,
        status: update.status,
        msg: update.msg,
        raw: update.raw || "",
        action: update.action || "",
        change: update.change || "",
        reason: update.reason || "",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save update" }, { status: 500 });
    }

    await auditLog("update_delivered", { code: code.substring(0, 3) + "***" }, ip);
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    console.error("Viewer POST error:", e);
    return NextResponse.json({ error: "Failed to save update" }, { status: 500 });
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
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ updates: [] });
    }

    const { data, error } = await supabase
      .from("viewer_updates")
      .select("*")
      .eq("access_code", code)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: "Failed to read updates" }, { status: 500 });
    }

    const updates = (data || []).map((row) => ({
      id: row.id,
      time: row.time,
      status: row.status,
      msg: row.msg,
      raw: row.raw,
      action: row.action || "",
      change: row.change || "",
      reason: row.reason || "",
    }));

    await auditLog("family_viewer_accessed", { code: code.substring(0, 3) + "***" }, ip);
    return NextResponse.json({ updates });
  } catch (e) {
    console.error("Viewer GET error:", e);
    return NextResponse.json({ error: "Failed to read updates" }, { status: 500 });
  }
}