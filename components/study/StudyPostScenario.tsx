"use client";

import StudyProgressBar from "./StudyProgressBar";
import RatingScale from "./RatingScale";

export default function StudyPostScenario({
  aiDisclosureEffect,
  setAiDisclosureEffect,
  decisionTrust,
  setDecisionTrust,
  trustDecayResponse,
  setTrustDecayResponse,
  onContinue,
  progressCurrent,
  progressTotal,
}: {
  aiDisclosureEffect: string;
  setAiDisclosureEffect: (s: string) => void;
  decisionTrust: number;
  setDecisionTrust: (n: number) => void;
  trustDecayResponse: string;
  setTrustDecayResponse: (s: string) => void;
  onContinue: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Final questions"
      />
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            A Few More Questions
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            These questions are about the overall experience.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">
              If you learned that a medical update was written by AI, how
              would that affect your trust in it?
            </p>
            <p className="text-xs text-gray-400 mb-4">
              We'll reveal more about the updates after this section.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "less", label: "It would make me trust it less" },
                { value: "same", label: "It would not change my trust" },
                { value: "more", label: "It would make me trust it more" },
                { value: "unsure", label: "I'm not sure" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAiDisclosureEffect(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${
                    aiDisclosureEffect === opt.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              How comfortable would you be making decisions based on the
              updates you read?
            </p>
            <RatingScale
              value={decisionTrust}
              onChange={setDecisionTrust}
              lowLabel="Not comfortable"
              highLabel="Very comfortable"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              If one of these updates contained an error, how would that
              affect your trust in future updates? (optional)
            </p>
            <textarea
              value={trustDecayResponse}
              onChange={(e) => setTrustDecayResponse(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20"
            />
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}