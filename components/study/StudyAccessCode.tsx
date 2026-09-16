"use client";

import { useState } from "react";
import { STUDY_CODE } from "./StudyTypes";
import type { Step } from "./StudyTypes";

export default function StudyAccessCode({
  onContinue,
}: {
  onContinue: (step: Step) => void;
}) {
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");

  const handleSubmit = () => {
    if (accessCode.trim() === STUDY_CODE) {
      onContinue("verify-email");
    } else {
      setAccessError("Invalid code. Check with the researcher.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          ClarityAI Research Study
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Enter the study access code provided by the researcher to begin.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={accessCode}
          onChange={(e) => {
            setAccessCode(e.target.value.toUpperCase());
            setAccessError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter study code"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-gray-400 transition-colors"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
        >
          Begin Study
        </button>
        {accessError && (
          <p className="text-red-500 text-xs text-center">{accessError}</p>
        )}
      </div>
    </div>
  );
}