"use client";

import { useState } from "react";
import StudyProgressBar from "./StudyProgressBar";
import FamilyChat from "@/components/FamilyChat";
import { STATUS_COLORS } from "./StudyTypes";
import type { FamilyViewerUpdate } from "./StudyTypes";

export default function StudyFamilyViewer({
  familyUpdates,
  familyLoading,
  cameFromClinicianResult,
  clinicianGeneratedUpdate,
  onContinue,
  progressCurrent,
  progressTotal,
}: {
  familyUpdates: FamilyViewerUpdate[];
  familyLoading: boolean;
  cameFromClinicianResult: boolean;
  clinicianGeneratedUpdate: string;
  onContinue: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Family viewer"
      />
      <div className="max-w-xl mx-auto py-10 px-4 md:px-6 pb-24">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
            Family View
          </p>
          <h1 className="text-xl font-semibold text-gray-900 mb-0.5">
            Live updates
          </h1>
          <p className="text-xs text-gray-400">
            From the care team · fictional patient
          </p>
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
                  <p className="text-sm leading-relaxed text-gray-800">
                    {clinicianGeneratedUpdate}
                  </p>
                </div>
              </div>
            )}

            {familyUpdates.map((update, i) => (
              <div
                key={update.id || i}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        STATUS_COLORS[update.status] || "bg-gray-400"
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-600 capitalize">
                      {update.status.replace(/-/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {update.time} today
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-800">
                    {update.msg}
                  </p>
                </div>
                {update.raw && (
                  <div className="px-5 pb-4">
                    <button
                      onClick={() =>
                        setExpandedIndex(expandedIndex === i ? null : i)
                      }
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${
                          expandedIndex === i ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      {expandedIndex === i
                        ? "Hide clinical data"
                        : "View clinical data"}
                    </button>
                    {expandedIndex === i && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                        <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-xs font-medium text-white">
                            Clinical reference
                          </span>
                        </div>
                        <div className="bg-gray-950 px-4 py-4">
                          <p className="text-sm text-gray-200 leading-relaxed">
                            {update.raw}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!familyLoading && (
          <FamilyChat
            currentUpdate={familyUpdates[0]?.msg || ""}
            offset={true}
          />
        )}

        {/* STICKY FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-4 z-50">
          <p className="text-sm text-gray-400">
            {cameFromClinicianResult
              ? "Done viewing the family experience?"
              : "Finished reading the updates?"}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="relative bg-gray-900 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden flex items-center gap-2 flex-shrink-0"
          >
            <span className="relative z-10 flex items-center gap-2">
              {cameFromClinicianResult ? "Continue to rating" : "Rate this experience"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
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

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
              <h2 className="text-base font-semibold text-gray-900">
                {cameFromClinicianResult
                  ? "Ready to rate?"
                  : "Ready to rate?"}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                {cameFromClinicianResult
                  ? "You've now seen both the clinician and family sides of ClarityAI. Continue to rate your experience."
                  : "You'll rate your experience with the family viewer. Make sure you've read all three updates above."}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    onContinue();
                  }}
                  className="relative w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer overflow-hidden"
                >
                  <span className="relative z-10">
                    Continue to rating
                  </span>
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
                  onClick={() => setShowModal(false)}
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