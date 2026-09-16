"use client";

import { useState } from "react";
import StudyProgressBar from "./StudyProgressBar";
import type { Step } from "./StudyTypes";

export default function StudyVerifyEmail({
  onContinue,
  onReturning,
  progressCurrent,
  progressTotal,
}: {
  onContinue: (emailHash: string) => void;
  onReturning: (emailHash: string) => void;
  progressCurrent: number;
  progressTotal: number;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/study/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.returning) {
          onReturning(data.emailHash);
        } else {
          onContinue(data.emailHash);
        }
      } else {
        setError(data.error || "Failed to process email.");
      }
    } catch (e) {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  return (
    <div>
      <StudyProgressBar
        current={progressCurrent}
        total={progressTotal}
        label="Enter email"
      />
      <div className="max-w-md mx-auto py-16 px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Enter your email
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your email is used only to prevent duplicate submissions and allow
            you to resume if interrupted. It is never stored — only a secure
            hash is kept.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !email.trim()}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Checking…" : "Continue"}
          </button>
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}