"use client";

import { useState, useEffect } from "react";
import React from "react";
import FamilyChat from "@/components/FamilyChat";

interface Update {
  time: string;
  status: string;
  msg: string;
  raw: string;
}

interface FamilyViewerProps {
  correctCode: string;
}

const STATUS_CLASS: Record<string, string> = {
  stable: "bg-emerald-100 text-emerald-700",
  improving: "bg-blue-100 text-blue-700",
  delayed: "bg-orange-100 text-orange-700",
  "under-review": "bg-purple-100 text-purple-700",
  "awaiting-procedure": "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

function highlightClinicalValues(text: string) {
  // Highlight patterns like "INR 2.8", "WBC 8.2", "SpO2 94%", etc.
  const pattern = /\b([A-Z]{2,6})\s+([\d.]+\s*%?)\b/g;
  const parts: (string | React.ReactElement)[] = [];
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-1.5 py-0.5 text-xs font-mono font-semibold mx-0.5"
      >
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 1 ? parts : text;
}

function ClinicalDetails({ raw }: { raw: string }) {
  const highlighted = highlightClinicalValues(raw);

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs font-semibold text-white tracking-wide">
            Clinical Reference
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          For medical professionals
        </span>
      </div>

      {/* Content */}
      <div className="bg-slate-900 px-4 py-4">
        <p className="text-sm text-slate-200 leading-relaxed">
          {Array.isArray(highlighted)
            ? highlighted.map((part, i) =>
                typeof part === "string" ? (
                  <span key={i}>{part}</span>
                ) : (
                  part
                )
              )
            : highlighted}
        </p>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">
          ⚕️ Clinical data provided for reference only. Contact the care team
          for medical guidance.
        </span>
      </div>
    </div>
  );
}

export default function FamilyViewer({ correctCode }: FamilyViewerProps) {
  const [code, setCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState("");

  useEffect(() => {
    if (!unlocked) return;

    const activeCode = correctCode || enteredCode;

    const fetchUpdates = async () => {
      const res = await fetch(`/api/viewer?code=${activeCode}`);
      const data = await res.json();
      setUpdates(data.updates);
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 10000);
    return () => clearInterval(interval);
  }, [unlocked, correctCode, enteredCode]);

  const handleUnlock = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    if (correctCode) {
      if (trimmed === correctCode) {
        setEnteredCode(trimmed);
        setUnlocked(true);
        setError("");
      } else {
        setError("Code not recognized. Check the code and try again.");
      }
      return;
    }

    const res = await fetch(`/api/viewer?code=${trimmed}`);
    const data = await res.json();

    if (data.updates && data.updates.length > 0) {
      setEnteredCode(trimmed);
      setUnlocked(true);
      setError("");
    } else {
      setError(
        "Code not recognized or no updates available yet. Check your code and try again."
      );
    }
  };

  const handleRequestCode = async () => {
    if (!phoneNumber.trim() || !smsConsent) return;
    setSmsSending(true);
    setSmsError("");

    const codeToSend = correctCode || "000000";

    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, accessCode: codeToSend }),
      });

      const data = await res.json();

      if (data.success) {
        setSmsSent(true);
      } else {
        setSmsError(data.error || "Failed to send. Try again.");
      }
    } catch (e) {
      setSmsError("Network error. Check your connection.");
    }

    setSmsSending(false);
  };

  const latestUpdate = updates.length > 0 ? updates[0].msg : "";

  const termsLink = (
    <a
      href="/terms.html"
      target="_blank"
      rel="noreferrer"
      className="text-emerald-700 underline">
    
      Terms
    </a>
  );

  const privacyLink = (
    <a
      href="/privacy.html"
      target="_blank"
      rel="noreferrer"
      className="text-emerald-700 underline">
      Privacy Policy
    </a>
  );

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto py-16 px-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💙</div>
          <h1 className="text-2xl font-serif mb-2">Patient Update Feed</h1>
          <p className="text-sm text-gray-500">
            Enter the access code shared by the patient&apos;s family to view
            live updates. No account needed.
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="000000"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center font-mono text-2xl tracking-widest focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={handleUnlock}
            className="bg-emerald-700 text-white rounded-lg px-5 text-sm font-semibold hover:bg-emerald-800 transition-all"
          >
            View →
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mt-2 mb-4">{error}</p>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-mono">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-sm font-semibold text-gray-800 mb-1">
            Get your access code via text
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Don&apos;t have your code yet? Enter your phone number and
            we&apos;ll text it to you. You&apos;ll receive one message with
            your code.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Phone Number
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setSmsSent(false);
                  setSmsError("");
                }}
                placeholder="(555) 000-0000"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-0.5 flex-shrink-0 w-4 h-4 accent-emerald-700"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I agree to receive a one-time SMS access code from ClarityAI.
                Message frequency: 1 message per request. Msg &amp; data rates
                may apply. Reply STOP to cancel, HELP for help. View our{" "}
                {termsLink} and {privacyLink}.
              </span>
            </label>

            <button
              onClick={handleRequestCode}
              disabled={
                smsSending || !phoneNumber.trim() || !smsConsent || smsSent
              }
              className="w-full bg-emerald-700 text-white rounded-xl p-3 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {smsSending
                ? "Sending..."
                : smsSent
                ? "✓ Code sent — check your phone"
                : "Send me my access code"}
            </button>

            {smsError && (
              <p className="text-xs text-red-500">⚠️ {smsError}</p>
            )}

            {smsSent && (
              <p className="text-xs text-emerald-600 leading-relaxed">
                ✓ Your access code has been sent. Enter it in the field above
                to view updates.
              </p>
            )}

            <p className="text-xs text-gray-300 text-center">
              Your number will never be shared or used for marketing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-serif mb-1">Live Updates</h1>
          <p className="text-xs text-gray-400">
            Updates from the care team
          </p>
        </div>
        <button
          onClick={() => {
            setUnlocked(false);
            setCode("");
            setEnteredCode("");
            setUpdates([]);
            setExpandedIndex(null);
          }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:border-emerald-600 hover:text-emerald-700 transition-all"
        >
          Sign Out
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-sm font-serif text-gray-600 mb-2">
            No updates yet
          </p>
          <p className="text-xs max-w-xs mx-auto leading-relaxed">
            The care team hasn&apos;t posted an update yet. This page refreshes
            automatically every 10 seconds — you don&apos;t need to do
            anything.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {updates.map((u, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              {/* UPDATE HEADER */}
              <div className="px-5 pt-4 pb-3">
                <div className="text-xs font-mono text-gray-400 tracking-widest uppercase mb-3">
                  🕐 {u.time} today
                </div>
                <p className="text-sm leading-relaxed text-gray-800">
                  {u.msg}
                </p>
              </div>

              {/* STATUS + CLINICAL TOGGLE */}
              <div className="px-5 pb-4 flex items-center justify-between">
                <div
                  className={`inline-flex items-center text-xs font-bold tracking-widest uppercase px-2 py-1 rounded ${
                    STATUS_CLASS[u.status] || STATUS_CLASS.stable
                  }`}
                >
                  {u.status.toUpperCase()}
                </div>

                {u.raw && (
                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === i ? null : i)
                    }
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      expandedIndex === i
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <span>⚕️</span>
                    <span>
                      {expandedIndex === i
                        ? "Hide Clinical Data"
                        : "View Clinical Data"}
                    </span>
                  </button>
                )}
              </div>

              {/* CLINICAL DETAILS PANEL */}
              {expandedIndex === i && u.raw && (
                <div className="px-4 pb-4">
                  <ClinicalDetails raw={u.raw} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {unlocked && <FamilyChat currentUpdate={latestUpdate} />}
    </div>
  );
}