"use client";

import StudyProgressBar from "./StudyProgressBar";
import { DEMO_PATIENT, STATUS_OPTIONS } from "./StudyTypes";
import type { ScenarioMessages } from "./StudyTypes";

export default function ClinicianResult({
  clinicianMessages,
  clinicianStatus,
  clinicianAction,
  clinicianChange,
  clinicianReason,
  returnedFromFamilyView,
  onContinueToRating,
  onDismissReturnedModal,
  onViewFamilyFeed,
  progressCurrent,
  progressTotal,
}: {
  clinicianMessages: ScenarioMessages;
  clinicianStatus: string;
  clinicianAction: string;
  clinicianChange: string;
  clinicianReason: string;
  returnedFromFamilyView: boolean;
  onContinueToRating: () => void;
  onDismissReturnedModal: () => void;
  onViewFamilyFeed: () => void;
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

      {/* RETURNED FROM FAMILY VIEW MODAL */}
      {returnedFromFamilyView && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                You've seen the family view
              </h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Now that you've experienced both sides of ClarityAI, you're
              ready to rate the clinician experience and continue the study.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onContinueToRating}
                className="relative w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden"
              >
                <span className="relative z-10">Continue to rating</span>
                <span
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite linear",
                  }}
                />
              </button>
              <button
                onClick={onDismissReturnedModal}
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
          onClick={onContinueToRating}
          className="relative bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium shadow-lg hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden"
        >
          <span className="relative z-10">Rate this experience</span>
          <span
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite linear",
            }}
          />
        </button>
      </div>

      <div className="flex flex-1">
        {/* LEFT SIDEBAR */}
        <div className="w-80 min-w-80 bg-white border-r border-gray-100 flex flex-col gap-5 overflow-y-scroll p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-xs font-medium text-emerald-700 mb-1">
              Update generated
            </p>
            <p className="text-xs text-emerald-600 leading-relaxed">
              The HIPAA pipeline ran and the family update has been delivered.
              See the center panel for results.
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
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Patient status
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  disabled
                  className={`rounded-lg py-2 px-1 text-xs font-medium text-center flex items-center justify-center gap-1.5 ${
                    clinicianStatus === s.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-300"
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
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500 leading-relaxed">
              {clinicianAction}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Change in plan
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500">
              {clinicianChange}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Clinical reason
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500 leading-relaxed">
              {clinicianReason}
            </div>
          </div>

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
                  The following information was detected and removed from the
                  clinical text before generating the family update:
                </p>
                {clinicianMessages.hipaa.map((h: any, i: number) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 mb-2 text-xs"
                  >
                    <span className="text-gray-400 w-20 flex-shrink-0">
                      {h.type}
                    </span>
                    <span className="line-through text-red-500 font-mono">
                      {h.original}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-white text-blue-700 font-mono px-2 py-0.5 rounded">
                      {h.replacement}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex gap-2">
                ✓ <strong>No PHI detected</strong> — input appears safe to
                transmit.
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium bg-amber-100 text-amber-700">
                  Update sent to family
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  Delivered to family viewer
                </span>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-gray-800">
                  {clinicianMessages.hybrid}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
              <p className="font-medium text-gray-600 mb-1">
                What happens next in a real deployment:
              </p>
              <p>
                The family member opens the viewer at clarityai.app/view,
                enters their 6-digit access code, and sees this update in
                their feed. The AI chat assistant is available for follow-up
                questions. Every time the clinician generates a new update it
                appears automatically.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-1">
                Want to see what the family sees?
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                View the family update feed to see exactly how your update
                appears to family members.
              </p>
              <button
                onClick={onViewFamilyFeed}
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