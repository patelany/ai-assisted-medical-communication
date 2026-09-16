export type Step =
  | "access-code"
  | "verify-email"
  | "returning"
  | "consent"
  | "demographics"
  | "preparing"
  | "clinician-intro"
  | "clinician-form"
  | "clinician-result"
  | "clinician-rating"
  | "family-intro"
  | "family-viewer"
  | "family-rating"
  | "scenario"
  | "post-scenario"
  | "debrief"
  | "complete";

export interface ScenarioMessages {
  raw: string;
  hybrid: string;
  context: string;
  hipaa: any[];
}

export interface ScenarioResponse {
  scenarioId: string;
  version: string;
  understanding: number;
  anxiety: number;
  trust: number;
  actionTendency: number;
  reassurance: number;
  perceivedCompleteness: number;
  notes: string;
}

export interface FamilyViewerUpdate {
  id: string;
  time: string;
  status: string;
  msg: string;
  raw: string;
}

export interface Demographics {
  ageRange: string;
  medicalBackground: string;
  priorHospitalization: string;
  communicatedUpdates: string;
}

export const STUDY_CODE = "CLARITY2026";
export const STUDY_VIEWER_CODE = "STUDY01";

export const SCENARIOS = [
  {
    id: "A",
    status: "delayed",
    action: "Postpone laparoscopic surgery",
    change: "Surgery postponed pending coagulation normalization",
    reason: "INR levels elevated at 2.8, coagulation needs to normalize before proceeding safely",
  },
  {
    id: "B",
    status: "critical",
    action: "Emergency transfer to ICU",
    change: "Escalating level of care immediately",
    reason: "Blood pressure dropping despite maximum medication doses, hemodynamic instability requiring intensive monitoring",
  },
  {
    id: "C",
    status: "improving",
    action: "Begin transition from IV to oral medications",
    change: "Moving out of observation unit later today",
    reason: "Fever resolved, infection markers declining significantly, WBC count normalizing at 8.2",
  },
  {
    id: "D",
    status: "stable",
    action: "Continue monitoring vitals and IV fluids",
    change: "No change in plan",
    reason: "Patient responding well to treatment, all vitals within normal range",
  },
];

export const MESSAGE_VERSIONS = ["raw", "hybrid", "context"];
export const AGE_RANGES = ["18–30", "31–45", "46–60", "60+"];

export const DEMO_PATIENT = {
  name: "Marcus Williams",
  mrn: "738294",
  status: "improving",
  action: "Continue oral antibiotic therapy, physical therapy consultation scheduled for tomorrow morning, advance diet to regular as tolerated, wean supplemental oxygen as SpO2 permits. Dr. Sarah Chen will conduct rounds at 8am in Room 304. Patient's sister Jennifer Williams called at 2pm requesting update.",
  change: "Discontinued telemetry monitoring — cardiac rhythm stable for 48 hours, transitioned to spot checks only",
  reason: "WBC 9.1 down from 16.4 on admission, temperature 98.8 for 36 hours, SpO2 95% on 2L nasal cannula improving to 97% with activity, chest X-ray showing mild improvement in right lower lobe infiltrate, procalcitonin trending down at 0.8. Patient transferred from St. Vincent's Hospital on 09/12. Next follow-up with Dr. Marcus Reed on Friday.",
};

export const STATUS_OPTIONS = [
  { value: "stable", label: "Stable", color: "bg-emerald-400" },
  { value: "improving", label: "Improving", color: "bg-blue-400" },
  { value: "delayed", label: "Delayed", color: "bg-yellow-400" },
  { value: "under-review", label: "Under Review", color: "bg-purple-400" },
  { value: "awaiting-procedure", label: "Awaiting", color: "bg-orange-400" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
];

export const STATUS_COLORS: Record<string, string> = {
  stable: "bg-emerald-400",
  improving: "bg-blue-400",
  delayed: "bg-yellow-400",
  "under-review": "bg-purple-400",
  "awaiting-procedure": "bg-orange-400",
  critical: "bg-red-500",
};