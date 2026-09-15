import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AuditAction =
  | "clinician_login"
  | "clinician_logout"
  | "patient_search"
  | "patient_selected"
  | "update_generated"
  | "update_delivered"
  | "update_edited"
  | "update_deleted"
  | "sms_sent"
  | "family_viewer_accessed"
  | "dashboard_accessed"
  | "study_submitted";

export async function auditLog(
  action: AuditAction,
  details: Record<string, any> = {},
  ip: string = "unknown"
) {
  try {
    await supabase.from("audit_logs").insert({
      action,
      details,
      ip,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Audit log failures should never break the app
    console.error("Audit log failed:", e);
  }
}