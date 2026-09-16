"use client";

import StudyProgressBar from "./StudyProgressBar";
import { DEMO_PATIENT, STATUS_OPTIONS } from "./StudyTypes";
import type { ScenarioMessages } from "./StudyTypes";

export default function ClinicianForm({
  clinicianStatus,
  setClinicianStatus,
  clinicianAction,
  setClinicianAction,
  clinicianChange,
  setClinicianChange,
  clinicianReason,
  setClinicianReason,
  clinicianLoading,
  onGenerate,
  progressCurrent,
  progressTotal,
}: {
  clinicianStatus: string;
  setClinicianStatus: (s: string) => void;
  clinicianAction: string;
  setClinicianAction: (s: string) => void;
  clinicianChange: string;
  setClinicianChange: (s: string) => void;
  clinicianReason: string;
  setClinicianReason: (s: string) => void;
  clinicianLoading: boolean;
  onGenerate: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Clinician view"
      />
      <div className="flex flex-1">
        {/* LEFT SIDEBAR */}
        <div className="w-80 min-w-80 bg-white border-r border-gray-100 flex flex-col gap-5 overflow-y-scroll p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">
              Study context
            </p>
            <p className="text-xs text-amber-600 leading-relaxed">
              In a real deployment, this form is auto-filled from the patient's
              Epic EHR record. You're seeing a pre-filled fictional example.
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-xs text-gray-400">
                Manual entry — fictional patient
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              {DEMO_PATIENT.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              MRN {DEMO_PATIENT.mrn}
            </p>
            <p className="text-xs text-gray-300 mt-2 italic">
              Normally: room, admission date, emergency contact auto-filled
              from Epic
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Patient status
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setClinicianStatus(s.value)}
                  className={`rounded-lg py-2 px-1 text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    clinicianStatus === s.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.color}`}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Planned action
            </p>
            <textarea
              value={clinicianAction}
              onChange={(e) => setClinicianAction(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300 transition-colors min-h-24"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Change in plan
            </p>
            <input
              value={clinicianChange}
              onChange={(e) => setClinicianChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-gray-300 transition-colors"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Clinical reason
            </p>
            <textarea
              value={clinicianReason}
              onChange={(e) => setClinicianReason(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300 transition-colors min-h-24"
            />
          </div>

          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Patient information is automatically scanned and removed before
              any update is generated.
            </p>
          </div>

          <div className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700">
              Notify family via SMS
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              In a real deployment, the patient's phone number is pulled from
              Epic and pre-filled here automatically. The clinician checks a
              consent box and the SMS sends when Generate is clicked.
            </p>
          </div>

          <button
            onClick={onGenerate}
            disabled={clinicianLoading || !clinicianAction.trim()}
            className="bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {clinicianLoading ? "Processing..." : "Generate update"}
          </button>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-500 mb-3">
              Family access code
            </p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Share this code once</p>
              <p className="font-mono text-2xl tracking-widest text-gray-900 font-semibold">
                STUDY
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ai-assisted-medical-communication.vercel.app/view
              </p>
              <p className="text-xs text-gray-300 mt-2 italic leading-relaxed">
                In production, a unique 6-digit code is generated per patient
                and sent to their family via SMS automatically.
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
                <p className="text-sm text-gray-400">
                  Processing clinical input…
                </p>
              </div>
            ) : (
              <>
                <div className="w-full bg-white border border-gray-200 rounded-2xl p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">
                    How it works
                  </p>
                  <div className="flex flex-col gap-4">
                    {[
                      {
                        step: "1",
                        title: "Patient data pulled from Epic",
                        desc: "Demographics, vitals, labs, conditions, and emergency contact are fetched automatically via FHIR R4.",
                      },
                      {
                        step: "2",
                        title: "Form pre-fills for review",
                        desc: "The clinician reviews AI-suggested action and reason pulled from clinical notes. Edits are optional.",
                      },
                      {
                        step: "3",
                        title: "Two-layer HIPAA pipeline runs",
                        desc: "AWS Comprehend Medical + Claude scan for PHI and remove it before any message is generated.",
                      },
                      {
                        step: "4",
                        title: "Family receives plain-language update",
                        desc: "The hybrid message posts to the family viewer. An SMS with the access code is sent to the patient.",
                      },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Fill in the form on the left and click Generate to see the
                  output here.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}