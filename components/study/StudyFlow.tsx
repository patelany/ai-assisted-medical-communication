"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

import StudyAccessCode from "./StudyAccessCode";
import StudyVerifyEmail from "./StudyVerifyEmail";
import StudyReturning from "./StudyReturning";
import StudyConsent from "./StudyConsent";
import StudyDemographics from "./StudyDemographics";
import StudyPreparing from "./StudyPreparing";
import ClinicianIntro from "./ClinicianIntro";
import ClinicianForm from "./ClinicianForm";
import ClinicianResult from "./ClinicianResult";
import ClinicianRating from "./ClinicianRating";
import FamilyIntro from "./FamilyIntro";
import StudyFamilyViewer from "./StudyFamilyViewer";
import FamilyRating from "./FamilyRating";
import StudyScenario from "./StudyScenario";
import StudyPostScenario from "./StudyPostScenario";
import StudyDebrief from "./StudyDebrief";
import StudyComplete from "./StudyComplete";

import {
  SCENARIOS,
  MESSAGE_VERSIONS,
  DEMO_PATIENT,
  STUDY_VIEWER_CODE,
} from "./StudyTypes";
import type {
  Step,
  ScenarioMessages,
  ScenarioResponse,
  FamilyViewerUpdate,
  Demographics,
} from "./StudyTypes";
import { shuffle, generateParticipantId } from "./StudyUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MEDICAL_STEPS = [
  "consent",
  "demographics",
  "clinician-intro",
  "clinician-form",
  "clinician-result",
  "family-viewer",
  "clinician-rating",
  "scenario",
  "post-scenario",
  "debrief",
];

const FAMILY_STEPS = [
  "consent",
  "demographics",
  "family-intro",
  "family-viewer",
  "family-rating",
  "scenario",
  "post-scenario",
  "debrief",
];

export default function StudyFlow() {
  const [step, setStep] = useState<Step>("access-code");
  const [participantId] = useState(generateParticipantId);
  const isMedical = useRef(false);

  // Email
  const [verifyEmailHash, setVerifyEmailHash] = useState("");

  // Demographics
  const [demographics, setDemographics] = useState<Demographics>({
    ageRange: "",
    medicalBackground: "",
    priorHospitalization: "",
    communicatedUpdates: "",
  });

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
  const [returnedFromFamilyView, setReturnedFromFamilyView] = useState(false);

  // Family viewer path
  const [familyUpdates, setFamilyUpdates] = useState<FamilyViewerUpdate[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyEaseOfUse, setFamilyEaseOfUse] = useState(0);
  const [familyWouldWant, setFamilyWouldWant] = useState("");
  const [familyFeedback, setFamilyFeedback] = useState("");
  const [familyCompareToNow, setFamilyCompareToNow] = useState("");
  const [cameFromClinicianResult, setCameFromClinicianResult] = useState(false);

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
          demographics,
          path: isMedical.current ? "clinician" : "family",
          currentStep: overrides?.currentStep ?? step,
        }),
      });
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
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
    const missing =
      !understanding ||
      !anxiety ||
      !trust ||
      !reassurance ||
      !perceivedCompleteness;
    if (missing) {
      setAttempted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const scenario = scenarioOrder[currentScenarioIndex];
    const version = versionAssignment[currentScenarioIndex];
    const newResponse: ScenarioResponse = {
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
          demographics,
          path: isMedical.current ? "clinician" : "family",
          clinicianExperience: isMedical.current
            ? {
                easeOfUse: clinicianEaseOfUse,
                wouldUse: clinicianWouldUse,
                feedback: clinicianFeedback,
                hipaaInteresting: clinicianHipaaInteresting,
              }
            : null,
          familyExperience: !isMedical.current
            ? {
                easeOfUse: familyEaseOfUse,
                wouldWant: familyWouldWant,
                feedback: familyFeedback,
                compareToNow: familyCompareToNow,
              }
            : null,
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

  const getStepInfo = () => {
    const steps = isMedical.current ? MEDICAL_STEPS : FAMILY_STEPS;
    const index = steps.indexOf(step);
    if (index === -1) return null;
    return { current: index, total: steps.length, label: steps[index] };
  };

  const stepInfo = getStepInfo();
  const progressCurrent = stepInfo?.current ?? 0;
  const progressTotal = stepInfo?.total ?? 9;

  const goToStep = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ACCESS CODE
  if (step === "access-code") {
    return <StudyAccessCode onContinue={goToStep} />;
  }

  // VERIFY EMAIL
  if (step === "verify-email") {
    return (
      <StudyVerifyEmail
        onContinue={(emailHash) => {
          setVerifyEmailHash(emailHash);
          goToStep("consent");
        }}
        onReturning={(emailHash) => {
          setVerifyEmailHash(emailHash);
          goToStep("returning");
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // RETURNING
  if (step === "returning") {
    return (
      <StudyReturning
        emailHash={verifyEmailHash}
        scenarioOrder={scenarioOrder}
        onRestore={(params) => {
          isMedical.current = params.isMedical;
          setCurrentScenarioIndex(params.scenarioIndex);
          setResponses(params.responses);
          if (params.versionAssignment.length > 0) {
            setVersionAssignment(params.versionAssignment);
          }
          setScenarioOrder(params.scenarioOrder);
          setDemographics(params.demographics);
          const savedStep = params.step;
          const needsPregen = [
            "scenario",
            "clinician-intro",
            "clinician-form",
            "family-intro",
            "family-viewer",
          ].includes(savedStep);
          if (needsPregen) {
            setStep("preparing");
            preGenerateAllScenarios(params.scenarioOrder).then(() => {
              goToStep(savedStep);
            });
          } else {
            goToStep(savedStep);
          }
        }}
      />
    );
  }

  // CONSENT
  if (step === "consent") {
    return (
      <StudyConsent
        onContinue={() => goToStep("demographics")}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // DEMOGRAPHICS
  if (step === "demographics") {
    return (
      <StudyDemographics
        onContinue={(demo) => {
          setDemographics(demo);
          isMedical.current = demo.medicalBackground === "medical";
          setStep("preparing");
          preGenerateAllScenarios(scenarioOrder).then(() => {
            const nextStep = isMedical.current ? "clinician-intro" : "family-intro";
            // Save initial session so returning participants can resume
            fetch("/api/study/save-progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                emailHash: verifyEmailHash,
                participantId,
                currentScenarioIndex: 0,
                responses: [],
                versionAssignment,
                scenarioOrder,
                demographics: demo,
                path: isMedical.current ? "clinician" : "family",
                currentStep: nextStep,
              }),
            }).catch(console.error);
            goToStep(nextStep);
          });
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // PREPARING
  if (step === "preparing") {
    return <StudyPreparing preGenerating={preGenerating} />;
  }

  // CLINICIAN INTRO
  if (step === "clinician-intro") {
    return (
      <ClinicianIntro
        onContinue={() => goToStep("clinician-form")}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // CLINICIAN FORM
  if (step === "clinician-form") {
    return (
      <ClinicianForm
        clinicianStatus={clinicianStatus}
        setClinicianStatus={setClinicianStatus}
        clinicianAction={clinicianAction}
        setClinicianAction={setClinicianAction}
        clinicianChange={clinicianChange}
        setClinicianChange={setClinicianChange}
        clinicianReason={clinicianReason}
        setClinicianReason={setClinicianReason}
        clinicianLoading={clinicianLoading}
        onGenerate={handleClinicianGenerate}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // CLINICIAN RESULT
  if (step === "clinician-result" && clinicianMessages) {
    return (
      <ClinicianResult
        clinicianMessages={clinicianMessages}
        clinicianStatus={clinicianStatus}
        clinicianAction={clinicianAction}
        clinicianChange={clinicianChange}
        clinicianReason={clinicianReason}
        returnedFromFamilyView={returnedFromFamilyView}
        onContinueToRating={() => {
          handleFamilyViewerLoad();
          goToStep("family-viewer");
        }}
        onDismissReturnedModal={() => setReturnedFromFamilyView(false)}
        onViewFamilyFeed={() => {
          handleFamilyViewerLoad();
          goToStep("family-viewer");
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // CLINICIAN RATING
  if (step === "clinician-rating") {
    return (
      <ClinicianRating
        clinicianEaseOfUse={clinicianEaseOfUse}
        setClinicianEaseOfUse={setClinicianEaseOfUse}
        clinicianWouldUse={clinicianWouldUse}
        setClinicianWouldUse={setClinicianWouldUse}
        clinicianHipaaInteresting={clinicianHipaaInteresting}
        setClinicianHipaaInteresting={setClinicianHipaaInteresting}
        clinicianFeedback={clinicianFeedback}
        setClinicianFeedback={setClinicianFeedback}
        onContinue={() => {
          saveProgress({ currentStep: "scenario" });
          goToStep("scenario");
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // FAMILY INTRO
  if (step === "family-intro") {
    return (
      <FamilyIntro
        onContinue={() => {
          handleFamilyViewerLoad();
          saveProgress({ currentStep: "family-viewer" });
          goToStep("family-viewer");
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // FAMILY VIEWER
  if (step === "family-viewer") {
    return (
      <StudyFamilyViewer
        familyUpdates={familyUpdates}
        familyLoading={familyLoading}
        cameFromClinicianResult={cameFromClinicianResult}
        clinicianGeneratedUpdate={clinicianGeneratedUpdate}
        onContinue={() => {
          if (cameFromClinicianResult) {
            setCameFromClinicianResult(false);
            saveProgress({ currentStep: "clinician-rating" });
            goToStep("clinician-rating");
          } else {
            saveProgress({ currentStep: "family-rating" });
            goToStep("family-rating");
          }
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // FAMILY RATING
  if (step === "family-rating") {
    return (
      <FamilyRating
        familyEaseOfUse={familyEaseOfUse}
        setFamilyEaseOfUse={setFamilyEaseOfUse}
        familyWouldWant={familyWouldWant}
        setFamilyWouldWant={setFamilyWouldWant}
        familyCompareToNow={familyCompareToNow}
        setFamilyCompareToNow={setFamilyCompareToNow}
        familyFeedback={familyFeedback}
        setFamilyFeedback={setFamilyFeedback}
        onContinue={() => {
          saveProgress({ currentStep: "scenario" });
          goToStep("scenario");
        }}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // SCENARIO
  if (step === "scenario") {
    const scenario = scenarioOrder[currentScenarioIndex];
    const version = versionAssignment[currentScenarioIndex];
    return (
      <StudyScenario
        currentScenarioIndex={currentScenarioIndex}
        totalScenarios={scenarioOrder.length}
        messages={messages}
        loadingMessages={loadingMessages}
        version={version}
        understanding={understanding}
        setUnderstanding={setUnderstanding}
        anxiety={anxiety}
        setAnxiety={setAnxiety}
        trust={trust}
        setTrust={setTrust}
        reassurance={reassurance}
        setReassurance={setReassurance}
        perceivedCompleteness={perceivedCompleteness}
        setPerceivedCompleteness={setPerceivedCompleteness}
        actionTendency={actionTendency}
        setActionTendency={setActionTendency}
        notes={notes}
        setNotes={setNotes}
        attempted={attempted}
        onNext={handleNextScenario}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // POST-SCENARIO
  if (step === "post-scenario") {
    return (
      <StudyPostScenario
        aiDisclosureEffect={aiDisclosureEffect}
        setAiDisclosureEffect={setAiDisclosureEffect}
        decisionTrust={decisionTrust}
        setDecisionTrust={setDecisionTrust}
        trustDecayResponse={trustDecayResponse}
        setTrustDecayResponse={setTrustDecayResponse}
        onContinue={() => goToStep("debrief")}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // DEBRIEF
  if (step === "debrief") {
    return (
      <StudyDebrief
        debriefReaction={debriefReaction}
        setDebriefReaction={setDebriefReaction}
        wouldWantThis={wouldWantThis}
        setWouldWantThis={setWouldWantThis}
        easeOfUse={easeOfUse}
        setEaseOfUse={setEaseOfUse}
        compareToNow={compareToNow}
        setCompareToNow={setCompareToNow}
        openFeedback={openFeedback}
        setOpenFeedback={setOpenFeedback}
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        progressCurrent={progressCurrent}
        progressTotal={progressTotal}
      />
    );
  }

  // COMPLETE
  return <StudyComplete participantId={participantId} />;
}