"use client";

import StudyProgressBar from "./StudyProgressBar";

export default function ClinicianIntro({
  onContinue,
  progressCurrent,
  progressTotal,
}: {
  onContinue: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Clinician view"
      />
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Clinician Experience
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Since you have a clinical background, you'll first experience
            ClarityAI from the clinician's perspective.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 mb-6 text-sm text-gray-600 leading-relaxed">
          <p>
            <strong className="text-gray-800">What you'll do:</strong> You'll
            see a pre-filled clinical form for a fictional patient. Review the
            information, make any edits you'd like, then click Generate to see
            how ClarityAI processes the clinical input.
          </p>
          <p>
            <strong className="text-gray-800">What to look for:</strong> Pay
            attention to the HIPAA de-identification report that appears after
            generating — it shows exactly what was detected and removed from
            the clinical text.
          </p>
          <p>
            <strong className="text-gray-800">Patient:</strong> Marcus Williams
            (fictional) — all information is completely made up.
          </p>
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
        >
          View Clinician Form
        </button>
      </div>
    </div>
  );
}