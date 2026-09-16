"use client";

import { useState } from "react";
import StudyProgressBar from "./StudyProgressBar";

export default function StudyConsent({
  onContinue,
  progressCurrent,
  progressTotal,
}: {
  onContinue: () => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Consent"
      />
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Informed Consent
          </h1>
          <p className="text-sm text-gray-400">
            Please read carefully before proceeding.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-sm text-gray-600 leading-relaxed flex flex-col gap-4">
          <p>
            <strong className="text-gray-800">Purpose:</strong> This research
            investigates how different styles of medical communication affect
            understanding and emotional response in non-clinical settings.
          </p>
          <p>
            <strong className="text-gray-800">What you will do:</strong> Based
            on your background, you will experience ClarityAI either as a
            clinician or as a family member, then rate fictional medical update
            scenarios. This takes approximately 15–20 minutes.
          </p>
          <p>
            <strong className="text-gray-800">Anonymity:</strong> Your
            responses are completely anonymous. You will be assigned a random
            participant ID. No personally identifying information is collected.
          </p>
          <p>
            <strong className="text-gray-800">
              All scenarios are fictional.
            </strong>{" "}
            No real patient data is used at any point in this study.
          </p>
          <p>
            <strong className="text-gray-800">
              Voluntary participation:
            </strong>{" "}
            You may stop at any time without consequence.
          </p>
          <p>
            <strong className="text-gray-800">Contact:</strong> Questions can
            be directed to the researcher who shared this link with you.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-gray-700 flex-shrink-0 cursor-pointer"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I have read and understood the above information. I am 18 years of
            age or older and I consent to participate in this research study.
          </span>
        </label>
        <button
          onClick={() => consentChecked && onContinue()}
          disabled={!consentChecked}
          className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          I Consent — Continue
        </button>
      </div>
    </div>
  );
}