import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCSRF } from "@/lib/csrf";
import { auditLog } from "@/lib/auditLog";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { success } = rateLimit(`viewer-patch:${ip}`, 20, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const body = await request.json();
    const { update } = body;

    if (!update) {
      return NextResponse.json({ error: "Missing update data" }, { status: 400 });
    }

    const { error } = await supabase
      .from("viewer_updates")
      .update({
        time: update.time,
        status: update.status,
        msg: update.msg,
        raw: update.raw || "",
        action: update.action || "",
        change: update.change || "",
        reason: update.reason || "",
      })
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    await auditLog("update_edited", { id }, ip);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Viewer PATCH error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { success } = rateLimit(`viewer-delete:${ip}`, 20, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const { error } = await supabase
      .from("viewer_updates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    await auditLog("update_deleted", { id }, ip);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Viewer DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}