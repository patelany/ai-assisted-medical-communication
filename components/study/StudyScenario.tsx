"use client";

import StudyProgressBar from "./StudyProgressBar";
import RatingScale from "./RatingScale";
import type { ScenarioMessages } from "./StudyTypes";

export default function StudyScenario({
  currentScenarioIndex,
  totalScenarios,
  messages,
  loadingMessages,
  version,
  understanding,
  setUnderstanding,
  anxiety,
  setAnxiety,
  trust,
  setTrust,
  reassurance,
  setReassurance,
  perceivedCompleteness,
  setPerceivedCompleteness,
  actionTendency,
  setActionTendency,
  notes,
  setNotes,
  attempted,
  onNext,
  progressCurrent,
  progressTotal,
}: {
  currentScenarioIndex: number;
  totalScenarios: number;
  messages: ScenarioMessages | null;
  loadingMessages: boolean;
  version: string;
  understanding: number;
  setUnderstanding: (n: number) => void;
  anxiety: number;
  setAnxiety: (n: number) => void;
  trust: number;
  setTrust: (n: number) => void;
  reassurance: number;
  setReassurance: (n: number) => void;
  perceivedCompleteness: number;
  setPerceivedCompleteness: (n: number) => void;
  actionTendency: number;
  setActionTendency: (n: number) => void;
  notes: string;
  setNotes: (s: string) => void;
  attempted: boolean;
  onNext: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  const versionLabels: Record<string, string> = {
    raw: "Message A",
    hybrid: "Message B",
    context: "Message C",
  };
  const label = versionLabels[version] || "Message";

  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Message ratings"
      />
      <div className="max-w-2xl mx-auto py-8 px-4 md:px-6">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest">
            Scenario {currentScenarioIndex + 1} of {totalScenarios}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Read this update and rate it
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Imagine you have a loved one in the hospital. The care team has
            sent the following update. Read it carefully and answer the
            questions below.
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
                <p className="text-sm leading-relaxed text-gray-800">
                  {(messages as any)[version]}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-6">
              <p className="text-sm font-semibold text-gray-800">
                Rate this message
              </p>

              {[
                {
                  label: "How clearly did you understand this message?",
                  value: understanding,
                  onChange: setUnderstanding,
                  low: "Not clear",
                  high: "Very clear",
                  required: true,
                },
                {
                  label: "How anxious did this message make you feel?",
                  value: anxiety,
                  onChange: setAnxiety,
                  low: "Not anxious",
                  high: "Very anxious",
                  required: true,
                  danger: true,
                },
                {
                  label: "How much do you trust this message is accurate?",
                  value: trust,
                  onChange: setTrust,
                  low: "Not at all",
                  high: "Completely",
                  required: true,
                },
                {
                  label: "How reassured do you feel after reading this?",
                  value: reassurance,
                  onChange: setReassurance,
                  low: "Not reassured",
                  high: "Very reassured",
                  required: true,
                },
                {
                  label: "Do you feel you have enough information about your loved one's condition?",
                  value: perceivedCompleteness,
                  onChange: setPerceivedCompleteness,
                  low: "Not enough",
                  high: "More than enough",
                  required: true,
                },
                {
                  label: "How likely would you be to call the hospital after reading this?",
                  value: actionTendency,
                  onChange: setActionTendency,
                  low: "Not likely",
                  high: "Very likely",
                  required: false,
                },
              ].map(({ label, value, onChange, low, high, required, danger }) => (
                <div key={label} className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-gray-500">
                    {label}
                    {required ? (
                      <span className="text-red-400 ml-1">*</span>
                    ) : (
                      <span className="text-gray-300 ml-1">(optional)</span>
                    )}
                  </p>
                  <RatingScale
                    value={value}
                    onChange={onChange}
                    lowLabel={low}
                    highLabel={high}
                    danger={danger}
                  />
                  {attempted && required && !value && (
                    <p className="text-xs text-red-500">Required</p>
                  )}
                </div>
              ))}

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">
                  Any thoughts? (optional)
                </p>
                <textarea
                  placeholder="What did you understand? What was unclear?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-16"
                />
              </div>
            </div>

            <button
              onClick={onNext}
              className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {currentScenarioIndex < totalScenarios - 1
                ? "Next Scenario"
                : "Continue"}
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