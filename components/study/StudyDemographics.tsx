"use client";

import { useState } from "react";
import StudyProgressBar from "./StudyProgressBar";
import { AGE_RANGES } from "./StudyTypes";
import type { Demographics } from "./StudyTypes";

export default function StudyDemographics({
  onContinue,
  progressCurrent,
  progressTotal,
}: {
  onContinue: (demographics: Demographics) => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  const [ageRange, setAgeRange] = useState("");
  const [medicalBackground, setMedicalBackground] = useState("");
  const [priorHospitalization, setPriorHospitalization] = useState("");
  const [communicatedUpdates, setCommunicatedUpdates] = useState("");

  const complete = ageRange && medicalBackground && priorHospitalization && communicatedUpdates;

  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="About you"
      />
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            About You
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            These questions help us analyze results across different groups.
            All responses are anonymous.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              What is your age range?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AGE_RANGES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAgeRange(a)}
                  className={`border rounded-xl p-3 text-sm font-medium transition-all cursor-pointer ${
                    ageRange === a
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              Do you have a medical or healthcare background?
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "medical", label: "Yes — I work in healthcare or have medical training" },
                { value: "non-medical", label: "No — I do not have a medical background" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMedicalBackground(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${
                    medicalBackground === opt.value
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
              Have you ever had a close family member or friend hospitalized?
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unsure", label: "Prefer not to say" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriorHospitalization(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${
                    priorHospitalization === opt.value
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
              Have you ever had to communicate medical updates to family members
              on behalf of a hospitalized loved one?
            </p>
            <div className="flex flex-col gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCommunicatedUpdates(opt.value)}
                  className={`border rounded-xl p-3 text-sm text-left transition-all cursor-pointer ${
                    communicatedUpdates === opt.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              complete &&
              onContinue({ ageRange, medicalBackground, priorHospitalization, communicatedUpdates })
            }
            disabled={!complete}
            className="w-full bg-gray-900 text-white rounded-xl p-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}