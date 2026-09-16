"use client";

import type { Step, ScenarioResponse } from "./StudyTypes";
import type { SCENARIOS } from "./StudyTypes";

export default function StudyReturning({
  emailHash,
  scenarioOrder,
  onRestore,
}: {
  emailHash: string;
  scenarioOrder: typeof SCENARIOS;
  onRestore: (params: {
    step: Step;
    scenarioIndex: number;
    responses: ScenarioResponse[];
    versionAssignment: string[];
    scenarioOrder: typeof SCENARIOS;
    isMedical: boolean;
    demographics: {
      ageRange: string;
      medicalBackground: string;
      priorHospitalization: string;
      communicatedUpdates: string;
    };
  }) => void;
}) {
  const handleSelect = async (medicalValue: string) => {
    const isMedical = medicalValue === "medical";
    try {
      const res = await fetch("/api/study/get-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailHash }),
      });
      const data = await res.json();
      if (data.session) {
        const session = data.session;
        const savedStep = (session.current_step as Step) || "scenario";
        onRestore({
          step: savedStep,
          scenarioIndex: session.current_scenario_index ?? 0,
          responses: session.responses || [],
          versionAssignment: session.version_assignment || [],
          scenarioOrder: session.scenario_order || scenarioOrder,
          isMedical: session.demographics?.medicalBackground === "medical" || isMedical,
          demographics: {
            ageRange: session.demographics?.ageRange || "",
            medicalBackground: session.demographics?.medicalBackground || medicalValue,
            priorHospitalization: session.demographics?.priorHospitalization || "",
            communicatedUpdates: session.demographics?.communicatedUpdates || "",
          },
        });
      } else {
        onRestore({
          step: "scenario",
          scenarioIndex: 0,
          responses: [],
          versionAssignment: [],
          scenarioOrder,
          isMedical,
          demographics: {
            ageRange: "",
            medicalBackground: medicalValue,
            priorHospitalization: "",
            communicatedUpdates: "",
          },
        });
      }
    } catch (e) {
      onRestore({
        step: "scenario",
        scenarioIndex: 0,
        responses: [],
        versionAssignment: [],
        scenarioOrder,
        isMedical,
        demographics: {
          ageRange: "",
          medicalBackground: medicalValue,
          priorHospitalization: "",
          communicatedUpdates: "",
        },
      });
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Your email is recognized. We'll take you back to where you left off.
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
              onClick={() => handleSelect(opt.value)}
              className="border rounded-xl p-3 text-sm text-left transition-all cursor-pointer border-gray-200 text-gray-500 hover:border-gray-400"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}