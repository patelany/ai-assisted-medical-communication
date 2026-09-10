"use client";

import { useState, useEffect } from "react";
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

function ClipboardDetails({ raw }: { raw: string }) {
  return (
    <div className="mt-4 relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-5 bg-gray-300 rounded-b-md border border-gray-400 z-10 flex items-center justify-center">
        <div className="w-5 h-3 bg-gray-400 rounded-sm" />
      </div>
      <div
        className="bg-amber-50 border border-amber-200 rounded-lg pt-6 pb-4 px-4"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 24px, #e5e7eb 24px, #e5e7eb 25px)",
          backgroundPositionY: "32px",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono">
            📋 Clinical Details
          </span>
          <span className="text-xs text-gray-400 font-mono">
            — For medical reference only
          </span>
        </div>
        <p className="font-mono text-xs text-gray-600 leading-relaxed bg-transparent">
          {raw}
        </p>
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-600 italic">
            This clinical information is provided for reference. Please consult
            directly with the care team for medical advice.
          </p>
        </div>
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
      setError("Code not recognized or no updates available yet. Check your code and try again.");
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
    <a href="/terms.html" target="_blank" rel="noreferrer" className="text-emerald-700 underline">
      Terms
    </a>
  );

  const privacyLink = (
    <a href="/privacy.html" target="_blank" rel="noreferrer" className="text-emerald-700 underline">
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
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-serif mb-1">Live Updates</h1>
          <p className="text-xs text-gray-400">
            AI-simplified updates from the care team
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
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="text-xs font-mono text-gray-400 tracking-widest uppercase mb-2">
                🕐 {u.time} today
              </div>
              <p className="text-sm leading-relaxed text-gray-800">{u.msg}</p>

              <div className="flex items-center justify-between mt-3">
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
                    className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      expandedIndex === i
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
                    }`}
                  >
                    <span>📋</span>
                    <span>
                      {expandedIndex === i
                        ? "Hide Clinical Details"
                        : "View Clinical Details"}
                    </span>
                  </button>
                )}
              </div>

              {expandedIndex === i && u.raw && (
                <ClipboardDetails raw={u.raw} />
              )}
            </div>
          ))}
        </div>
      )}

      {unlocked && <FamilyChat currentUpdate={latestUpdate} />}
    </div>
  );
}