"use client";

import { useState, useEffect, useRef } from "react";
import FamilyChat from "@/components/FamilyChat";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STUDY_CODE = "CLARITY2026";
const STUDY_VIEWER_CODE = "STUDY01";

const SCENARIOS = [
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

const MESSAGE_VERSIONS = ["raw", "hybrid", "context"];
const AGE_RANGES = ["18–30", "31–45", "46–60", "60+"];

const DEMO_PATIENT = {
  name: "Marcus Williams",
  mrn: "738294",
  status: "improving",
  action: "Continue oral antibiotic therapy, physical therapy consultation scheduled for tomorrow morning, advance diet to regular as tolerated, wean supplemental oxygen as SpO2 permits. Dr. Sarah Chen will conduct rounds at 8am in Room 304. Patient's sister Jennifer Williams called at 2pm requesting update.",
  change: "Discontinued telemetry monitoring — cardiac rhythm stable for 48 hours, transitioned to spot checks only",
  reason: "WBC 9.1 down from 16.4 on admission, temperature 98.8 for 36 hours, SpO2 95% on 2L nasal cannula improving to 97% with activity, chest X-ray showing mild improvement in right lower lobe infiltrate, procalcitonin trending down at 0.8. Patient transferred from St. Vincent's Hospital on 09/12. Next follow-up with Dr. Marcus Reed on Friday.",
};

const STATUS_OPTIONS = [
  { value: "stable", label: "Stable", color: "bg-emerald-400" },
  { value: "improving", label: "Improving", color: "bg-blue-400" },
  { value: "delayed", label: "Delayed", color: "bg-yellow-400" },
  { value: "under-review", label: "Under Review", color: "bg-purple-400" },
  { value: "awaiting-procedure", label: "Awaiting", color: "bg-orange-400" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
];

const STATUS_COLORS: Record<string, string> = {
  stable: "bg-emerald-400",
  improving: "bg-blue-400",
  delayed: "bg-yellow-400",
  "under-review": "bg-purple-400",
  "awaiting-procedure": "bg-orange-400",
  critical: "bg-red-500",
};

type Step =
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

interface ScenarioMessages {
  raw: string;
  hybrid: string;
  context: string;
  hipaa: any[];
}

interface ScenarioResponse {
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

interface FamilyViewerUpdate {
  id: string;
  time: string;
  status: string;
  msg: string;
  raw: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateParticipantId(): string {
  return `S${Date.now().toString(36).toUpperCase()}`;
}

function StepProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="w-full bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-gray-900 w-6"
                : i === current
                ? "bg-gray-400 w-6"
                : "bg-gray-200 w-3"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 flex-shrink-0">
        Step {current + 1} of {total} — {label}
      </p>
    </div>
  );
}

function RatingScale({
  value,
  onChange,
  lowLabel,
  highLabel,
  danger,
}: {
  value: number;
  onChange: (n: number) => void;
  lowLabel: string;
  highLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
        {lowLabel}
      </span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
              value === n
                ? danger
                  ? "bg-red-100 border-red-500 text-red-700"
                  : "bg-gray-900 border-gray-900 text-white"
                : "border-gray-200 text-gray-400 hover:border-gray-400 bg-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{highLabel}</span>
    </div>
  );
}

export default function StudyFlow() {
  const [step, setStep] = useState<Step>("access-code");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [participantId] = useState(generateParticipantId);
  const [consentChecked, setConsentChecked] = useState(false);
  const isMedical = useRef(false);

  // Email verification
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyEmailHash, setVerifyEmailHash] = useState("");
  const [verifySending, setVerifySending] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyCodeSent, setVerifyCodeSent] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Demographics
  const [ageRange, setAgeRange] = useState("");
  const [medicalBackground, setMedicalBackground] = useState("");
  const [priorHospitalization, setPriorHospitalization] = useState("");
  const [communicatedUpdates, setCommunicatedUpdates] = useState("");

  // Clinician path
  const [clinicianStatus, setClinicianStatus] = useState(DEMO_PATIENT.status);
  const [clinicianAction, setClinicianAction] = useState(DEMO_PATIENT.action);
  const [clinicianChange, setClinicianChange] = useState(DEMO_PATIENT.change);
  const [clinicianReason, setClinicianReason] = useState(DEMO_PATIENT.reason);
  const [clinicianMessages, setClinicianMessages] = useState<ScenarioMessages | null>(null);
  const [clinicianLoading, setClinicianLoading] = useState(false);
  const [clinicianEaseOfUse, setClinicianEaseOfUse] = useState(0);
  const [clinicianWouldUse, setClinicianWouldUse] = useState("");
  const [clinicianFeedback, setClinicianFeedback] = useState("");
  const [clinicianHipaaInteresting, setClinicianHipaaInteresting] = useState("");
  const [clinicianGeneratedUpdate, setClinicianGeneratedUpdate] = useState("");

  // Family viewer path
  const [familyUpdates, setFamilyUpdates] = useState<FamilyViewerUpdate[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyExpandedIndex, setFamilyExpandedIndex] = useState<number | null>(null);
  const [familyEaseOfUse, setFamilyEaseOfUse] = useState(0);
  const [familyWouldWant, setFamilyWouldWant] = useState("");
  const [familyFeedback, setFamilyFeedback] = useState("");
  const [familyCompareToNow, setFamilyCompareToNow] = useState("");
  const [showFamilyViewerModal, setShowFamilyViewerModal] = useState(false);
  const [cameFromClinicianResult, setCameFromClinicianResult] = useState(false);
  const [returnedFromFamilyView, setReturnedFromFamilyView] = useState(false);

  // Scenario ratings
  const [scenarioOrder, setScenarioOrder] = useState<typeof SCENARIOS>([]);
  const [versionAssignment, setVersionAssignment] = useState<string[]>([]);
  const [preGeneratedMessages, setPreGeneratedMessages] = useState<Record<string, ScenarioMessages>>({});
  const [preGenerating, setPreGenerating] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [messages, setMessages] = useState<ScenarioMessages | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [responses, setResponses] = useState<ScenarioResponse[]>([]);
  const [understanding, setUnderstanding] = useState(0);
  const [anxiety, setAnxiety] = useState(0);
  const [trust, setTrust] = useState(0);
  const [actionTendency, setActionTendency] = useState(0);
  const [reassurance, setReassurance] = useState(0);
  const [perceivedCompleteness, setPerceivedCompleteness] = useState(0);
  const [notes, setNotes] = useState("");
  const [attempted, setAttempted] = useState(false);

  // Post-scenario
  const [aiDisclosureEffect, setAiDisclosureEffect] = useState("");
  const [decisionTrust, setDecisionTrust] = useState(0);
  const [trustDecayResponse, setTrustDecayResponse] = useState("");

  // Debrief
  const [wouldWantThis, setWouldWantThis] = useState("");
  const [easeOfUse, setEaseOfUse] = useState(0);
  const [openFeedback, setOpenFeedback] = useState("");
  const [compareToNow, setCompareToNow] = useState("");
  const [debriefReaction, setDebriefReaction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const completed = localStorage.getItem("clarityai_study_complete");
    console.log("Study complete flag:", completed);
    console.log("Initial step:", step);
    if (completed) {
      setStep("complete");
      return;
    }
    const shuffledScenarios = shuffle(SCENARIOS).slice(0, 3);
    setScenarioOrder(shuffledScenarios);
    const shuffledVersions = shuffle(MESSAGE_VERSIONS);
    setVersionAssignment(shuffledVersions);
  }, []);

  useEffect(() => {
    if (step === "scenario" && scenarioOrder.length > 0) {
      generateScenarioMessages();
    }
  }, [step, currentScenarioIndex, scenarioOrder]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step !== "access-code" && step !== "complete") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const handlePopState = () => {
      if (step !== "access-code" && step !== "complete") {
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [step]);

  const preGenerateAllScenarios = async (scenarios: typeof SCENARIOS) => {
    setPreGenerating(true);
    try {
      const results = await Promise.all(
        scenarios.map(async (scenario) => {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: scenario.status,
              action: scenario.action,
              change: scenario.change,
              reason: scenario.reason,
            }),
          });
          const data = await res.json();
          return { id: scenario.id, data };
        })
      );
      const generated: Record<string, ScenarioMessages> = {};
      results.forEach(({ id, data }) => {
        generated[id] = data;
      });
      setPreGeneratedMessages(generated);
    } catch (e) {
      console.error("Failed to pre-generate scenarios:", e);
    }
    setPreGenerating(false);
  };

  const generateScenarioMessages = async () => {
    if (!scenarioOrder[currentScenarioIndex]) return;
    setLoadingMessages(true);
    setMessages(null);
    resetRatings();
    const scenario = scenarioOrder[currentScenarioIndex];
    if (preGeneratedMessages[scenario.id]) {
      setMessages(preGeneratedMessages[scenario.id]);
      setLoadingMessages(false);
      return;
    }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: scenario.status,
          action: scenario.action,
          change: scenario.change,
          reason: scenario.reason,
        }),
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingMessages(false);
  };

  const resetRatings = () => {
    setUnderstanding(0);
    setAnxiety(0);
    setTrust(0);
    setActionTendency(0);
    setReassurance(0);
    setPerceivedCompleteness(0);
    setNotes("");
    setAttempted(false);
  };

  const saveProgress = async (overrides?: {
    scenarioIndex?: number;
    newResponses?: ScenarioResponse[];
    currentStep?: Step;
  }) => {
    if (!verifyEmailHash) return;
    try {
      await fetch("/api/study/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailHash: verifyEmailHash,
          participantId,
          currentScenarioIndex: overrides?.scenarioIndex ?? currentScenarioIndex,
          responses: overrides?.newResponses ?? responses,
          versionAssignment,
          scenarioOrder,
          demographics: { ageRange, medicalBackground, priorHospitalization, communicatedUpdates },
          path: isMedical.current ? "clinician" : "family",
          currentStep: overrides?.currentStep ?? step,
        }),
      });
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
  };

  const handleSendVerifyCode = async () => {
    if (!verifyEmail.trim() || !verifyEmail.includes("@")) {
      setVerifyError("Please enter a valid email address.");
      return;
    }
    setVerifySending(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/study/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyEmailHash(data.emailHash);
        if (data.returning) {
          setStep("returning");
        } else {
          setStep("consent");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setVerifyError(data.error || "Failed to process email.");
      }
    } catch (e) {
      setVerifyError("Network error. Check your connection.");
    }
    setVerifySending(false);
  };

  const handleVerifyCode = async () => {
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      setVerifyError("Please enter the 6-digit code.");
      return;
    }
    setVerifyChecking(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/study/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyEmailHash(data.emailHash);
        setStep("consent");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setVerifyError(data.error || "Invalid code.");
      }
    } catch (e) {
      setVerifyError("Network error. Check your connection.");
    }
    setVerifyChecking(false);
  };

  const handleDemographicsContinue = () => {
    isMedical.current = medicalBackground === "medical";
    setStep("preparing");
    preGenerateAllScenarios(scenarioOrder).then(() => {
      if (isMedical.current) {
        setStep("clinician-intro");
        saveProgress({ currentStep: "clinician-intro" });
      } else {
        setStep("family-intro");
        saveProgress({ currentStep: "family-intro" });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClinicianGenerate = async () => {
    setClinicianLoading(true);
    setClinicianMessages(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: clinicianStatus,
          action: clinicianAction,
          change: clinicianChange,
          reason: clinicianReason,
        }),
      });
      const data = await res.json();
      setClinicianMessages(data);
      setClinicianGeneratedUpdate(data.hybrid || "");
      setStep("clinician-result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
    }
    setClinicianLoading(false);
  };

  const handleFamilyViewerLoad = async () => {
    setFamilyLoading(true);
    try {
      const res = await fetch(`/api/viewer?code=${STUDY_VIEWER_CODE}`);
      const data = await res.json();
      setFamilyUpdates(data.updates || []);
    } catch (e) {
      console.error(e);
    }
    setFamilyLoading(false);
  };

  const handleNextScenario = () => {
    const missing = !understanding || !anxiety || !trust || !reassurance || !perceivedCompleteness;
    if (missing) {
      setAttempted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const scenario = scenarioOrder[currentScenarioIndex];
    const version = versionAssignment[currentScenarioIndex];
    const newResponse = {
      scenarioId: scenario.id,
      version,
      understanding,
      anxiety,
      trust,
      actionTendency,
      reassurance,
      perceivedCompleteness,
      notes,
    };
    const newResponses = [...responses, newResponse];
    setResponses(newResponses);
    const nextIndex = currentScenarioIndex + 1;
    saveProgress({ scenarioIndex: nextIndex, newResponses });
    if (currentScenarioIndex < scenarioOrder.length - 1) {
      setCurrentScenarioIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep("post-scenario");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          emailHash: verifyEmailHash,
          demographics: { ageRange, medicalBackground, priorHospitalization, communicatedUpdates },
          path: isMedical.current ? "clinician" : "family",
          clinicianExperience: isMedical.current ? {
            easeOfUse: clinicianEaseOfUse,
            wouldUse: clinicianWouldUse,
            feedback: clinicianFeedback,
            hipaaInteresting: clinicianHipaaInteresting,
          } : null,
          familyExperience: !isMedical.current ? {
            easeOfUse: familyEaseOfUse,
            wouldWant: familyWouldWant,
            feedback: familyFeedback,
            compareToNow: familyCompareToNow,
          } : null,
          responses,
          postScenario: { aiDisclosureEffect, decisionTrust, trustDecayResponse },
          usability: { wouldWantThis, easeOfUse, openFeedback, compareToNow },
          debriefReaction,
          versionAssignment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (verifyEmailHash) {
          await supabase
            .from("study_completed_emails")
            .insert({
              email_hash: verifyEmailHash,
              participant_id: participantId,
            })
            .then(({ error }) => {
              if (error) console.error("Failed to record completed email:", error);
            });
        }
        localStorage.setItem("clarityai_study_complete", "true");
        setStep("complete");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError("Failed to submit. Please try again.");
      }
    } catch (e) {
      setSubmitError("Network error. Check your connection and try again.");
    }
    setSubmitting(false);
  };

  const getStepInfo = (): { current: number; total: number; label: string } | null => {
    const medicalSteps = [
      { step: "consent", label: "Consent" },
      { step: "demographics", label: "About you" },
      { step: "clinician-intro", label: "Clinician view" },
      { step: "clinician-form", label: "Clinician view" },
      { step: "clinician-result", label: "Clinician view" },
      { step: "clinician-rating", label: "Rate clinician experience" },
      { step: "scenario", label: "Message ratings" },
      { step: "post-scenario", label: "Final questions" },
      { step: "debrief", label: "Debrief" },
    ];
    const familySteps = [
      { step: "consent", label: "Consent" },
      { step: "demographics", label: "About you" },
      { step: "family-intro", label: "Family viewer" },
      { step: "family-viewer", label: "Family viewer" },
      { step: "family-rating", label: "Rate family experience" },
      { step: "scenario", label: "Message ratings" },
      { step: "post-scenario", label: "Final questions" },
      { step: "debrief", label: "Debrief" },
    ];
    const steps = isMedical.current ? medicalSteps : familySteps;
    const index = steps.findIndex((s) => s.step === step);
    if (index === -1) return null;
    return { current: index, total: steps.length, label: steps[index].label };
  };

  const stepInfo = getStepInfo();

  const progressBar = stepInfo ? (
    <StepProgressBar
      current={stepInfo.current}
      total={stepInfo.total}
      label={stepInfo.label}
    />
  ) : null;

    // ACCESS CODE
  if (step === "access-code") {
    return (
      <div className="max-w-md mx-auto py-16 px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            ClarityAI Research Study
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Enter the study access code provided by the researcher to begin.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={accessCode}
            onChange={(e) => { setAccessCode(e.target.value.toUpperCase()); setAccessError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (accessCode.trim() === STUDY_CODE) setStep("verify-email");
                else setAccessError("Invalid code. Check with the researcher.");
              }
            }}
            placeholder="Enter study code"
            className="w-full bg-white border border-gray-200 rounded-xl p-4 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-gray-400 transition-colors"
          />
          <button
            onClick={() => {
              if (accessCode.trim() === STUDY_CODE) setStep("verify-email");
              else setAccessError("Invalid code. Check with the researcher.");
            }}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Begin Study
          </button>
          {accessError && <p className="text-red-500 text-xs text-center">{accessError}</p>}
        </div>
      </div>
    );
  }


  // RETURNING PARTICIPANT
  if (step === "returning") {
    return (
      <div>
        {progressBar}
        <div className="max-w-md mx-auto py-16 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your email is verified. We'll take you straight to the message rating section — the part you may not have completed yet.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-800">
              Do you have a medical or healthcare background?
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "medical", label: "Yes — I work in healthcare or have medical training" },
                { value: "non-medical", label: "No — I do not have a medical background" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={async () => {
                    setMedicalBackground(opt.value);
                    isMedical.current = opt.value === "medical";
                    try {
                      const res = await fetch("/api/study/get-progress", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ emailHash: verifyEmailHash }),
                      });
                      const data = await res.json();
                      if (data.session) {
                        const session = data.session;
                        if (session.responses) setResponses(session.responses);
                        if (session.version_assignment) setVersionAssignment(session.version_assignment);
                        if (session.scenario_order) setScenarioOrder(session.scenario_order);
                        if (session.demographics) {
                          setAgeRange(session.demographics.ageRange || "");
                          setMedicalBackground(session.demographics.medicalBackground || opt.value);
                          setPriorHospitalization(session.demographics.priorHospitalization || "");
                          setCommunicatedUpdates(session.demographics.communicatedUpdates || "");
                          isMedical.current = session.demographics.medicalBackground === "medical";
                        }
                        if (session.current_scenario_index !== undefined) {
                          setCurrentScenarioIndex(session.current_scenario_index);
                        }
                        const savedStep = (session.current_step as Step) || "scenario";
                        const needsPregen = ["scenario", "clinician-intro", "clinician-form", "family-intro", "family-viewer"].includes(savedStep);
                        if (needsPregen) {
                          setStep("preparing");
                          const scenariosToGenerate = session.scenario_order || scenarioOrder;
                          preGenerateAllScenarios(scenariosToGenerate).then(() => {
                            setStep(savedStep);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          });
                        } else {
                          setStep(savedStep);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      } else {
                        setStep("preparing");
                        preGenerateAllScenarios(scenarioOrder).then(() => {
                          setStep("scenario");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        });
                      }
                    } catch (e) {
                      setStep("preparing");
                      preGenerateAllScenarios(scenarioOrder).then(() => {
                        setStep("scenario");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      });
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="border rounded-xl p-3 text-sm text-left transition-all cursor-pointer border-gray-200 text-gray-500 hover:border-gray-400"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CONSENT
  if (step === "consent") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Informed Consent</h1>
            <p className="text-sm text-gray-400">Please read carefully before proceeding.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
            <p><strong className="text-gray-800">Purpose:</strong> This research investigates how different styles of medical communication affect understanding and emotional response in non-clinical settings.</p>
            <p><strong className="text-gray-800">What you will do:</strong> Based on your background, you will experience ClarityAI either as a clinician or as a family member, then rate fictional medical update scenarios. This takes approximately 15–20 minutes.</p>
            <p><strong className="text-gray-800">Anonymity:</strong> Your responses are completely anonymous. You will be assigned a random participant ID. No personally identifying information is collected.</p>
            <p><strong className="text-gray-800">All scenarios are fictional.</strong> No real patient data is used at any point in this study.</p>
            <p><strong className="text-gray-800">Voluntary participation:</strong> You may stop at any time without consequence.</p>
            <p><strong className="text-gray-800">Contact:</strong> Questions can be directed to the researcher who shared this link with you.</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-gray-700 flex-shrink-0 cursor-pointer"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              I have read and understood the above information. I am 18 years of age or older and I consent to participate in this research study.
            </span>
          </label>
          <button
            onClick={() => consentChecked && setStep("demographics")}
            disabled={!consentChecked}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            I Consent — Continue
          </button>
        </div>
      </div>
    );
  }

  // DEMOGRAPHICS
  if (step === "demographics") {
    const complete = ageRange && medicalBackground && priorHospitalization && communicatedUpdates;
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">About You</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              These questions help us analyze results across different groups. All responses are anonymous.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">What is your age range?</p>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RANGES.map((a) => (
                  <button key={a} onClick={() => setAgeRange(a)}
                    className={`border rounded-xl p-3 text-sm font-medium transition-all cursor-pointer ${ageRange === a ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Do you have a medical or healthcare background?</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "medical", label: "Yes — I work in healthcare or have medical training" },
                  { value: "non-medical", label: "No — I do not have a medical background" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setMedicalBackground(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${medicalBackground === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Have you ever had a close family member or friend hospitalized?</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Prefer not to say" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setPriorHospitalization(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${priorHospitalization === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Have you ever had to communicate medical updates to family members on behalf of a hospitalized loved one?</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setCommunicatedUpdates(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${communicatedUpdates === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleDemographicsContinue}
              disabled={!complete}
              className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PREPARING
  if (step === "preparing") {
    return (
      <div className="max-w-md mx-auto py-20 px-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Preparing your study
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              We're generating your scenarios. This takes about 30 seconds — please keep this tab open.
            </p>
          </div>
          <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full"
              style={{
                width: preGenerating ? "60%" : "100%",
                transition: "width 15s ease-in-out",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

    // CLINICIAN INTRO
  if (step === "clinician-intro") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Clinician Experience</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Since you have a clinical background, you'll first experience ClarityAI from the clinician's perspective.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 mb-6 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">What you'll do:</strong> You'll see a pre-filled clinical form for a fictional patient. Review the information, make any edits you'd like, then click Generate to see how ClarityAI processes the clinical input.</p>
            <p><strong className="text-gray-800">What to look for:</strong> Pay attention to the HIPAA de-identification report that appears after generating — it shows exactly what was detected and removed from the clinical text.</p>
            <p><strong className="text-gray-800">Patient:</strong> Marcus Williams (fictional) — all information is completely made up.</p>
          </div>
          <button
            onClick={() => { setStep("clinician-form"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            View Clinician Form
          </button>
        </div>
      </div>
    );
  }

  // CLINICIAN FORM — two panel layout
  if (step === "clinician-form") {
    return (
      <div className="flex flex-col flex-1 min-h-screen">
        {progressBar}
        <div className="flex flex-1">
          {/* LEFT SIDEBAR */}
          <div className="w-80 min-w-80 bg-white border-r border-gray-100 flex flex-col gap-5 overflow-y-scroll p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-medium text-amber-700 mb-1">Study context</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                In a real deployment, this form is auto-filled from the patient's Epic EHR record. You're seeing a pre-filled fictional example.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">Manual entry — fictional patient</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{DEMO_PATIENT.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">MRN {DEMO_PATIENT.mrn}</p>
              <p className="text-xs text-gray-300 mt-2 italic">
                Normally: room, admission date, emergency contact auto-filled from Epic
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Patient status</p>
              <div className="grid grid-cols-3 gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s.value} onClick={() => setClinicianStatus(s.value)}
                    className={`rounded-lg py-2 px-1 text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${clinicianStatus === s.value ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.color}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Planned action</p>
              <textarea value={clinicianAction} onChange={(e) => setClinicianAction(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300 transition-colors min-h-24" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Change in plan</p>
              <input value={clinicianChange} onChange={(e) => setClinicianChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-colors" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Clinical reason</p>
              <textarea value={clinicianReason} onChange={(e) => setClinicianReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300 transition-colors min-h-24" />
            </div>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Patient information is automatically scanned and removed before any update is generated.
              </p>
            </div>

            <div className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-700">Notify family via SMS</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                In a real deployment, the patient's phone number is pulled from Epic and pre-filled here automatically. The clinician checks a consent box and the SMS sends when Generate is clicked.
              </p>
            </div>

            <button
              onClick={handleClinicianGenerate}
              disabled={clinicianLoading || !clinicianAction.trim()}
              className="bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {clinicianLoading ? "Processing..." : "Generate update"}
            </button>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-medium text-gray-500 mb-3">Family access code</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Share this code once</p>
                <p className="font-mono text-2xl tracking-widest text-gray-900 font-semibold">STUDY</p>
                <p className="text-xs text-gray-400 mt-1">ai-assisted-medical-communication.vercel.app/view</p>
                <p className="text-xs text-gray-300 mt-2 italic leading-relaxed">
                  In production, a unique 6-digit code is generated per patient and sent to their family via SMS automatically.
                </p>
              </div>
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="flex-1 overflow-y-auto p-7 bg-stone-100">
            <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-96 gap-6">
              {clinicianLoading ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Processing clinical input…</p>
                </div>
              ) : (
                <>
                  <div className="w-full bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">How it works</p>
                    <div className="flex flex-col gap-4">
                      {[
                        { step: "1", title: "Patient data pulled from Epic", desc: "Demographics, vitals, labs, conditions, and emergency contact are fetched automatically via FHIR R4." },
                        { step: "2", title: "Form pre-fills for review", desc: "The clinician reviews AI-suggested action and reason pulled from clinical notes. Edits are optional." },
                        { step: "3", title: "Two-layer HIPAA pipeline runs", desc: "AWS Comprehend Medical + Claude scan for PHI and remove it before any message is generated." },
                        { step: "4", title: "Family receives plain-language update", desc: "The hybrid message posts to the family viewer. An SMS with the access code is sent to the patient." },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {step}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    Fill in the form on the left and click Generate to see the output here.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CLINICIAN RESULT — two panel layout
  if (step === "clinician-result" && clinicianMessages) {
    return (
      <div className="flex flex-col flex-1 min-h-screen">
        {progressBar}

        {/* RETURNED FROM FAMILY VIEW MODAL */}
        {returnedFromFamilyView && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">You've seen the family view</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Now that you've experienced both sides of ClarityAI, you're ready to rate the clinician experience and continue the study.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setReturnedFromFamilyView(false);
                    setStep("clinician-rating");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="relative w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden"
                >
                  <span className="relative z-10">Continue to rating</span>
                  <span className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite linear" }} />
                </button>
                <button
                  onClick={() => setReturnedFromFamilyView(false)}
                  className="w-full border border-gray-200 text-gray-500 rounded-xl py-3 text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Review results first
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FIXED RATE BUTTON */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => { setStep("clinician-rating"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="relative bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium shadow-lg hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden"
          >
            <span className="relative z-10">Rate this experience</span>
            <span className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite linear" }} />
          </button>
        </div>

        <div className="flex flex-1">
          {/* LEFT SIDEBAR */}
          <div className="w-80 min-w-80 bg-white border-r border-gray-100 flex flex-col gap-5 overflow-y-scroll p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs font-medium text-emerald-700 mb-1">Update generated</p>
              <p className="text-xs text-emerald-600 leading-relaxed">
                The HIPAA pipeline ran and the family update has been delivered. See the center panel for results.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">Manual entry — fictional patient</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{DEMO_PATIENT.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">MRN {DEMO_PATIENT.mrn}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Patient status</p>
              <div className="grid grid-cols-3 gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s.value} disabled
                    className={`rounded-lg py-2 px-1 text-xs font-medium text-center flex items-center justify-center gap-1.5 ${clinicianStatus === s.value ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-300"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.color}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Planned action</p>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500 leading-relaxed">{clinicianAction}</div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Change in plan</p>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500">{clinicianChange}</div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Clinical reason</p>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500 leading-relaxed">{clinicianReason}</div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-medium text-gray-500 mb-3">Family access code</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Share this code once</p>
                <p className="font-mono text-2xl tracking-widest text-gray-900 font-semibold">STUDY</p>
                <p className="text-xs text-gray-400 mt-1">ai-assisted-medical-communication.vercel.app/view</p>
              </div>
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="flex-1 overflow-y-auto p-7 bg-stone-100">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
              {clinicianMessages.hipaa?.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-bold tracking-widest uppercase text-blue-700 mb-3">
                    HIPAA De-identification Report
                  </div>
                  <p className="text-xs text-blue-600 mb-3 leading-relaxed">
                    The following information was detected and removed from the clinical text before generating the family update:
                  </p>
                  {clinicianMessages.hipaa.map((h: any, i: number) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                      <span className="text-gray-400 w-20 flex-shrink-0">{h.type}</span>
                      <span className="line-through text-red-500 font-mono">{h.original}</span>
                      <span className="text-gray-400">→</span>
                      <span className="bg-white text-blue-700 font-mono px-2 py-0.5 rounded">{h.replacement}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex gap-2">
                  ✓ <strong>No PHI detected</strong> — input appears safe to transmit.
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium bg-amber-100 text-amber-700">
                    Update sent to family
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">Delivered to family viewer</span>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-gray-800">{clinicianMessages.hybrid}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
                <p className="font-medium text-gray-600 mb-1">What happens next in a real deployment:</p>
                <p>The family member opens the viewer at clarityai.app/view, enters their 6-digit access code, and sees this update in their feed. The AI chat assistant is available for follow-up questions. Every time the clinician generates a new update it appears automatically.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-800 mb-1">Want to see what the family sees?</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  View the family update feed to see exactly how your update appears to family members.
                </p>
                <button
                  onClick={() => {
                    setCameFromClinicianResult(true);
                    handleFamilyViewerLoad();
                    setStep("family-viewer");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full border border-gray-200 text-gray-600 rounded-lg py-2.5 text-xs font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  View family update feed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CLINICIAN RATING
  if (step === "clinician-rating") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Rate the Clinician Experience</h1>
            <p className="text-sm text-gray-400 leading-relaxed">Based on what you just experienced, share your thoughts on ClarityAI as a clinical tool.</p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">How easy was the clinician workflow to use?</p>
              <RatingScale value={clinicianEaseOfUse} onChange={setClinicianEaseOfUse} lowLabel="Very hard" highLabel="Very easy" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Would you use a tool like this in your clinical practice?</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "maybe", label: "Maybe" },
                  { value: "no", label: "No" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setClinicianWouldUse(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${clinicianWouldUse === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">What did you think of the HIPAA de-identification report? (optional)</p>
              <textarea value={clinicianHipaaInteresting} onChange={(e) => setClinicianHipaaInteresting(e.target.value)}
                placeholder="Was it useful? Accurate? Surprising?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Any other feedback on the clinician experience? (optional)</p>
              <textarea value={clinicianFeedback} onChange={(e) => setClinicianFeedback(e.target.value)}
                placeholder="What worked well? What would you change?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>
            <button
              onClick={() => { setStep("scenario"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Continue to Message Ratings
            </button>
          </div>
        </div>
      </div>
    );
  }

    // FAMILY INTRO
  if (step === "family-intro") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Family Viewer Experience</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              You'll experience ClarityAI as a family member receiving updates about a loved one in the hospital.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 mb-6 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">What you'll see:</strong> A live update feed with three updates from a fictional patient's care team, generated by AI from clinical notes.</p>
            <p><strong className="text-gray-800">What to do:</strong> Read through the updates as you would if a family member were hospitalized. You can expand the clinical details panel on each update.</p>
            <p><strong className="text-gray-800">Patient:</strong> All information is completely fictional.</p>
          </div>
          <button
            onClick={() => {
              handleFamilyViewerLoad();
              setStep("family-viewer");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            View Family Updates
          </button>
        </div>
      </div>
    );
  }

  // FAMILY VIEWER
  if (step === "family-viewer") {
    return (
      <div>
        {progressBar}
        <div className="max-w-xl mx-auto py-10 px-4 md:px-6 pb-24">
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Family View</p>
            <h1 className="text-xl font-semibold text-gray-900 mb-0.5">Live updates</h1>
            <p className="text-xs text-gray-400">From the care team · fictional patient</p>
          </div>

          {familyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading updates…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cameFromClinicianResult && clinicianGeneratedUpdate && (
                <div className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                    <span className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium bg-emerald-100 text-emerald-700">
                      Your generated update
                    </span>
                    <span className="text-xs text-emerald-600">Just now</span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-gray-800">{clinicianGeneratedUpdate}</p>
                  </div>
                </div>
              )}

              {familyUpdates.map((update, i) => (
                <div key={update.id || i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[update.status] || "bg-gray-400"}`} />
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {update.status.replace(/-/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{update.time} today</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800">{update.msg}</p>
                  </div>
                  {update.raw && (
                    <div className="px-5 pb-4">
                      <button
                        onClick={() => setFamilyExpandedIndex(familyExpandedIndex === i ? null : i)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className={`w-3 h-3 transition-transform ${familyExpandedIndex === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {familyExpandedIndex === i ? "Hide clinical data" : "View clinical data"}
                      </button>
                      {familyExpandedIndex === i && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                          <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-xs font-medium text-white">Clinical reference</span>
                          </div>
                          <div className="bg-gray-950 px-4 py-4">
                            <p className="text-sm text-gray-200 leading-relaxed">{update.raw}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!familyLoading && <FamilyChat currentUpdate={familyUpdates[0]?.msg || ""} offset={true} />}

          {/* STICKY FOOTER */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3 z-50">
            <p className="text-sm text-gray-500">
              {cameFromClinicianResult ? "Done reviewing the family view?" : "Finished reading the updates?"}
            </p>
            <button
              onClick={() => setShowFamilyViewerModal(true)}
              className="relative bg-gray-900 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer flex-shrink-0 overflow-hidden flex items-center gap-3"
            >
              <span className="relative z-10">
                {cameFromClinicianResult ? "Back to results" : "Rate this experience"}
              </span>
              <span className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite linear" }} />
            </button>
          </div>

          {/* MODAL */}
          {showFamilyViewerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
                <h2 className="text-base font-semibold text-gray-900">
                  {cameFromClinicianResult ? "Return to results?" : "Ready to rate?"}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {cameFromClinicianResult
                    ? "You'll go back to the clinician result screen to continue the study."
                    : "You'll rate your experience with the family viewer. Make sure you've read all three updates above."}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setShowFamilyViewerModal(false);
                      if (cameFromClinicianResult) {
                        setCameFromClinicianResult(false);
                        setReturnedFromFamilyView(true);
                        setStep("clinician-result");
                      } else {
                        setStep("family-rating");
                      }
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="relative w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden"
                  >
                    <span className="relative z-10">
                      {cameFromClinicianResult ? "Back to results" : "Continue to rating"}
                    </span>
                    <span className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite linear" }} />
                  </button>
                  <button
                    onClick={() => setShowFamilyViewerModal(false)}
                    className="w-full border border-gray-200 text-gray-500 rounded-xl py-3 text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Keep reading
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FAMILY RATING
  if (step === "family-rating") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Rate the Family Experience</h1>
            <p className="text-sm text-gray-400 leading-relaxed">Based on what you just experienced, share your thoughts on receiving updates this way.</p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">How easy was it to understand the updates?</p>
              <RatingScale value={familyEaseOfUse} onChange={setFamilyEaseOfUse} lowLabel="Very hard" highLabel="Very easy" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Would you want to receive updates this way if a family member was hospitalized?</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "maybe", label: "Maybe" },
                  { value: "no", label: "No" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setFamilyWouldWant(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${familyWouldWant === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">How does this compare to how you currently receive updates during hospitalizations? (optional)</p>
              <textarea value={familyCompareToNow} onChange={(e) => setFamilyCompareToNow(e.target.value)}
                placeholder="Share your experience..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">What would make this more useful to you? (optional)</p>
              <textarea value={familyFeedback} onChange={(e) => setFamilyFeedback(e.target.value)}
                placeholder="Any suggestions or feedback..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>
            <button
              onClick={() => { setStep("scenario"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Continue to Message Ratings
            </button>
          </div>
        </div>
      </div>
    );
  }

    // SCENARIO
  if (step === "scenario") {
    const scenario = scenarioOrder[currentScenarioIndex];
    const version = versionAssignment[currentScenarioIndex];
    const versionLabels: Record<string, string> = { raw: "Message A", hybrid: "Message B", context: "Message C" };
    const label = versionLabels[version] || "Message";

    return (
      <div>
        {progressBar}
        <div className="max-w-2xl mx-auto py-8 px-4 md:px-6">
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              Scenario {currentScenarioIndex + 1} of {scenarioOrder.length}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Read this update and rate it</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Imagine you have a loved one in the hospital. The care team has sent the following update. Read it carefully and answer the questions below.
            </p>
          </div>

          {attempted && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-600">
              Please answer all required questions before continuing.
            </div>
          )}

          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading scenario…</p>
            </div>
          ) : messages ? (
            <div className="flex flex-col gap-5">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <span className="text-xs font-mono text-gray-500 tracking-widest uppercase px-2 py-1 bg-gray-100 rounded">
                    {label}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-gray-800">{(messages as any)[version]}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-6">
                <p className="text-sm font-semibold text-gray-800">Rate this message</p>
                {[
                  { label: "How clearly did you understand this message?", value: understanding, onChange: setUnderstanding, low: "Not clear", high: "Very clear", required: true },
                  { label: "How anxious did this message make you feel?", value: anxiety, onChange: setAnxiety, low: "Not anxious", high: "Very anxious", required: true, danger: true },
                  { label: "How much do you trust this message is accurate?", value: trust, onChange: setTrust, low: "Not at all", high: "Completely", required: true },
                  { label: "How reassured do you feel after reading this?", value: reassurance, onChange: setReassurance, low: "Not reassured", high: "Very reassured", required: true },
                  { label: "Do you feel you have enough information about your loved one's condition?", value: perceivedCompleteness, onChange: setPerceivedCompleteness, low: "Not enough", high: "More than enough", required: true },
                  { label: "How likely would you be to call the hospital after reading this?", value: actionTendency, onChange: setActionTendency, low: "Not likely", high: "Very likely", required: false },
                ].map(({ label, value, onChange, low, high, required, danger }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-gray-500">
                      {label}
                      {required
                        ? <span className="text-red-400 ml-1">*</span>
                        : <span className="text-gray-300 ml-1">(optional)</span>}
                    </p>
                    <RatingScale value={value} onChange={onChange} lowLabel={low} highLabel={high} danger={danger} />
                    {attempted && required && !value && (
                      <p className="text-xs text-red-500">Required</p>
                    )}
                  </div>
                ))}

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-500">Any thoughts? (optional)</p>
                  <textarea
                    placeholder="What did you understand? What was unclear?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-16"
                  />
                </div>
              </div>

              <button onClick={handleNextScenario}
                className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer">
                {currentScenarioIndex < scenarioOrder.length - 1 ? "Next Scenario" : "Continue"}
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p>Failed to load scenario. Please refresh and try again.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // POST-SCENARIO
  if (step === "post-scenario") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">A Few More Questions</h1>
            <p className="text-sm text-gray-400 leading-relaxed">These questions are about the overall experience.</p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                If you learned that a medical update was written by AI, how would that affect your trust in it?
              </p>
              <p className="text-xs text-gray-400 mb-4">We'll reveal more about the updates after this section.</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "less", label: "It would make me trust it less" },
                  { value: "same", label: "It would not change my trust" },
                  { value: "more", label: "It would make me trust it more" },
                  { value: "unsure", label: "I'm not sure" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setAiDisclosureEffect(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${aiDisclosureEffect === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">
                How comfortable would you be making decisions based on the updates you read?
              </p>
              <RatingScale value={decisionTrust} onChange={setDecisionTrust} lowLabel="Not comfortable" highLabel="Very comfortable" />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                If one of these updates contained an error, how would that affect your trust in future updates? (optional)
              </p>
              <textarea value={trustDecayResponse} onChange={(e) => setTrustDecayResponse(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>

            <button
              onClick={() => { setStep("debrief"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEBRIEF
  if (step === "debrief") {
    return (
      <div>
        {progressBar}
        <div className="max-w-lg mx-auto py-12 px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Study Debrief</h1>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 text-sm text-gray-700 leading-relaxed flex flex-col gap-3">
            <p className="font-semibold text-gray-900">The updates you read were generated by AI.</p>
            <p>ClarityAI is an AI system that transforms clinical patient data into plain-language family updates. Each scenario showed you one of three versions — raw clinical language, AI-simplified language, or AI-simplified with additional context.</p>
            <p>The purpose of this study is to understand which communication style best helps family members understand medical updates and manage anxiety. All scenarios were completely fictional.</p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                Now that you know the messages were AI-generated, how do you feel about that? (optional)
              </p>
              <textarea value={debriefReaction} onChange={(e) => setDebriefReaction(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Would you want to receive updates this way if a family member was hospitalized?</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "maybe", label: "Maybe" },
                  { value: "no", label: "No" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setWouldWantThis(opt.value)}
                    className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${wouldWantThis === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">How easy was it to understand the updates you read?</p>
              <RatingScale value={easeOfUse} onChange={setEaseOfUse} lowLabel="Very hard" highLabel="Very easy" />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">How does this compare to how you currently receive updates during hospitalizations? (optional)</p>
              <textarea value={compareToNow} onChange={(e) => setCompareToNow(e.target.value)}
                placeholder="Share your experience..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">What would make this more useful to you? (optional)</p>
              <textarea value={openFeedback} onChange={(e) => setOpenFeedback(e.target.value)}
                placeholder="Any suggestions or feedback..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20" />
            </div>

            {submitError && <p className="text-red-500 text-xs text-center">{submitError}</p>}

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer">
              {submitting ? "Submitting…" : "Submit & Finish"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETE
  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Thank you</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">
        Your responses have been recorded anonymously. Your participation contributes to research on AI-assisted medical communication that could help families during difficult times.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Your participant ID</p>
        <p className="font-mono text-lg text-gray-700">{participantId}</p>
        <p className="text-xs text-gray-400 mt-1">Reference this if you have questions about your submission.</p>
      </div>
    </div>
  );
}