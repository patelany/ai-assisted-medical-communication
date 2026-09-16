"use client";

import StudyProgressBar from "./StudyProgressBar";
import RatingScale from "./RatingScale";

export default function ClinicianRating({
  clinicianEaseOfUse,
  setClinicianEaseOfUse,
  clinicianWouldUse,
  setClinicianWouldUse,
  clinicianHipaaInteresting,
  setClinicianHipaaInteresting,
  clinicianFeedback,
  setClinicianFeedback,
  onContinue,
  progressCurrent,
  progressTotal,
}: {
  clinicianEaseOfUse: number;
  setClinicianEaseOfUse: (n: number) => void;
  clinicianWouldUse: string;
  setClinicianWouldUse: (s: string) => void;
  clinicianHipaaInteresting: string;
  setClinicianHipaaInteresting: (s: string) => void;
  clinicianFeedback: string;
  setClinicianFeedback: (s: string) => void;
  onContinue: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Rate clinician experience"
      />
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Rate the Clinician Experience
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Based on what you just experienced, share your thoughts on
            ClarityAI as a clinical tool.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              How easy was the clinician workflow to use?
            </p>
            <RatingScale
              value={clinicianEaseOfUse}
              onChange={setClinicianEaseOfUse}
              lowLabel="Very hard"
              highLabel="Very easy"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              Would you use a tool like this in your clinical practice?
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "maybe", label: "Maybe" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setClinicianWouldUse(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${
                    clinicianWouldUse === opt.value
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
            <p className="text-sm font-semibold text-gray-800 mb-3">
              What did you think of the HIPAA de-identification report?
              (optional)
            </p>
            <textarea
              value={clinicianHipaaInteresting}
              onChange={(e) => setClinicianHipaaInteresting(e.target.value)}
              placeholder="Was it useful? Accurate? Surprising?"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Any other feedback on the clinician experience? (optional)
            </p>
            <textarea
              value={clinicianFeedback}
              onChange={(e) => setClinicianFeedback(e.target.value)}
              placeholder="What worked well? What would you change?"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors min-h-20"
            />
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Continue to Message Ratings
          </button>
        </div>
      </div>
    </div>
  );
}