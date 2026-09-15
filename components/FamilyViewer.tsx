"use client";

import { useState, useEffect, useRef } from "react";
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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  stable: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  improving: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  delayed: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  "under-review": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  "awaiting-procedure": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

function highlightClinicalValues(text: string) {
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
        className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 text-xs font-mono font-semibold mx-0.5"
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
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
      <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs font-medium text-white">
            Clinical reference
          </span>
        </div>
        <span className="text-xs text-gray-500">
          For medical professionals
        </span>
      </div>

      <div className="bg-gray-950 px-4 py-4">
        <p className="text-sm text-gray-200 leading-relaxed">
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

      <div className="bg-gray-900 px-4 py-2">
        <p className="text-xs text-gray-500">
          Clinical data provided for reference only. Contact the care team
          for medical guidance.
        </p>
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
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState("");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Poll for updates
  useEffect(() => {
    if (!unlocked) return;
    const activeCode = correctCode || enteredCode;
    const fetchUpdates = async () => {
      const res = await fetch(`/api/viewer?code=${activeCode}`);
      const data = await res.json();
      setUpdates(data.updates || []);
    };
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 10000);
    return () => clearInterval(interval);
  }, [unlocked, correctCode, enteredCode]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
    if (newDigits.every((d) => d !== "")) {
      setCode(newDigits.join(""));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === "Enter") handleUnlock();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      setCode(pasted);
      inputRefs[5].current?.focus();
    }
    e.preventDefault();
  };

  const handleUnlock = async () => {
    if (lockedUntil) return;

    const trimmed = code.trim();
    if (trimmed.length !== 6) return;

    if (correctCode) {
      if (trimmed === correctCode) {
        setEnteredCode(trimmed);
        setUnlocked(true);
        setError("");
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
          setLockedUntil(lockUntil);
          setError(`Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`);
        } else {
          setError(
            `Code not recognized. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`
          );
        }
      }
      return;
    }

    const res = await fetch(`/api/viewer?code=${trimmed}`);
    const data = await res.json();

    if (data.updates && data.updates.length > 0) {
      setEnteredCode(trimmed);
      setUnlocked(true);
      setError("");
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        setLockedUntil(lockUntil);
        setError(`Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`);
      } else {
        setError(
          `Code not recognized. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`
        );
      }
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

  // LOCKED OUT
  if (lockedUntil) {
    return (
      <div className="max-w-sm mx-auto py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9a2 2 0 10-4 0v3m-2 0h8" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Access temporarily locked
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          Too many incorrect attempts. Please wait before trying again.
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 inline-block">
          <p className="text-2xl font-mono font-semibold text-gray-900">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </p>
          <p className="text-xs text-gray-400 mt-1">remaining</p>
        </div>
      </div>
    );
  }

  // ACCESS CODE ENTRY
  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto py-16 px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Patient updates
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Enter the 6-digit code shared by the care team to view
            live updates. No account needed.
          </p>
        </div>

        {/* 6-DIGIT INPUT */}
        <div className="flex gap-2 justify-center mb-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-mono font-semibold text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
            />
          ))}
        </div>

        <button
          onClick={handleUnlock}
          disabled={digits.some((d) => d === "")}
          className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed mt-2"
        >
          View updates
        </button>

        {error && (
          <p className="text-xs text-red-500 text-center mt-3">{error}</p>
        )}

        {attempts > 0 && !error && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} remaining
          </p>
        )}

        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* SMS REQUEST */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Get your code via text
          </p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Enter your phone number and we'll send your access code. One
            message only.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Phone number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setSmsSent(false);
                  setSmsError("");
                }}
                placeholder="(555) 000-0000"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-0.5 flex-shrink-0 w-4 h-4 accent-gray-700"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                I agree to receive a one-time SMS access code from ClarityAI.
                Message frequency: 1 message per request. Msg &amp; data rates
                may apply. Reply STOP to cancel.{" "}
                <a href="/terms.html" target="_blank" rel="noreferrer" className="text-gray-600 underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy.html" target="_blank" rel="noreferrer" className="text-gray-600 underline">
                  Privacy Policy
                </a>.
              </span>
            </label>

            <button
              onClick={handleRequestCode}
              disabled={smsSending || !phoneNumber.trim() || !smsConsent || smsSent}
              className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {smsSending ? "Sending..." : smsSent ? "Code sent — check your phone" : "Send my access code"}
            </button>

            {smsError && (
              <p className="text-xs text-red-500">{smsError}</p>
            )}

            {smsSent && (
              <p className="text-xs text-emerald-600 leading-relaxed">
                Code sent. Enter it in the fields above to view updates.
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

  // UPDATES FEED
  return (
    <div className="max-w-xl mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-0.5">
            Live updates
          </h1>
          <p className="text-xs text-gray-400">
            From the care team · refreshes automatically
          </p>
        </div>
        <button
          onClick={() => {
            setUnlocked(false);
            setCode("");
            setDigits(["", "", "", "", "", ""]);
            setEnteredCode("");
            setUpdates([]);
            setExpandedIndex(null);
            setAttempts(0);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300"
        >
          Sign out
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            No updates yet
          </p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            The care team hasn't posted an update yet. This page refreshes
            automatically every 10 seconds.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {updates.map((u, i) => {
            const statusStyle = STATUS_COLORS[u.status] || STATUS_COLORS.stable;
            return (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    <span className={`text-xs font-medium ${statusStyle.text} ${statusStyle.bg} px-2 py-0.5 rounded-full`}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1).replace(/-/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {u.time} today
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-800">
                    {u.msg}
                  </p>
                </div>

                {u.raw && (
                  <div className="px-5 pb-4">
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
                    >
                      <svg className={`w-3 h-3 transition-transform ${expandedIndex === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {expandedIndex === i ? "Hide clinical data" : "View clinical data"}
                    </button>

                    {expandedIndex === i && (
                      <ClinicalDetails raw={u.raw} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {unlocked && <FamilyChat currentUpdate={latestUpdate} />}
    </div>
  );
}