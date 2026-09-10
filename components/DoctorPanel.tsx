"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "stable", label: "Stable", icon: "🟢" },
  { value: "improving", label: "Improving", icon: "📈" },
  { value: "delayed", label: "Delayed", icon: "⏸" },
  { value: "under-review", label: "Under Review", icon: "🔍" },
  { value: "awaiting-procedure", label: "Awaiting Procedure", icon: "⏳" },
  { value: "critical", label: "Critical", icon: "🔴" },
];

interface DoctorPanelProps {
  onGenerate: (data: any) => void;
  loading: boolean;
  accessCode: string;
  hasMessages: boolean;
}

export default function DoctorPanel({
  onGenerate,
  loading,
  accessCode,
  hasMessages,
}: DoctorPanelProps) {
  const [status, setStatus] = useState("stable");
  const [action, setAction] = useState("");
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const handleSubmit = () => {
    if (!action.trim()) return;
    onGenerate({ status, action, change, reason });
    setStatus("stable");
    setAction("");
    setChange("");
    setReason("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Hi! You can follow updates about our loved one here:\n\nSite: ai-assisted-medical-communication.vercel.app/view\nCode: ${accessCode}\n\nNo account needed — just enter the code.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSms = async () => {
    if (!phoneNumber.trim()) return;
    setSmsSending(true);
    setSmsError("");

    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, accessCode }),
      });

      const data = await res.json();

      if (data.success) {
        setSmsSent(true);
        setPhoneNumber("");
      } else {
        setSmsError(data.error || "Failed to send. Try again.");
      }
    } catch (e) {
      setSmsError("Network error. Check your connection.");
    }

    setSmsSending(false);
  };

  return (
    <>
      {/* MOBILE TOGGLE BUTTON */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed bottom-6 left-6 z-50 bg-stone-900 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-lg"
      >
        {collapsed ? "📋" : "✕"}
      </button>

      {/* SIDEBAR */}
      <div
        className={`
          bg-white border-r border-gray-200 flex flex-col gap-4 overflow-y-auto
          transition-all duration-300
          fixed inset-0 z-40 p-6
          ${collapsed ? "-translate-x-full" : "translate-x-0"}
          md:relative md:inset-auto md:translate-x-0 md:w-72 md:min-w-72 md:z-auto md:p-5
          lg:w-80 lg:min-w-80 lg:p-6
        `}
      >
        {/* MOBILE CLOSE BUTTON */}
        <div className="flex items-center justify-between md:hidden">
          <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">
            Clinical Input
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>

        {/* DESKTOP LABEL */}
        <div className="hidden md:block text-xs font-mono tracking-widest text-gray-400 uppercase border-b border-gray-200 pb-3">
          Clinical Input
        </div>

        <div>
          <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-2">
            Patient Status
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`border rounded-lg p-2 text-xs font-semibold text-center transition-all ${
                  status === s.value
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                <span className="text-base block mb-1">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-2">
            Planned Action
          </div>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. Continue IV antibiotics, prepare for MRI..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-emerald-600 min-h-20"
          />
        </div>

        <div>
          <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-2">
            Change in Plan
          </div>
          <input
            value={change}
            onChange={(e) => setChange(e.target.value)}
            placeholder="e.g. Procedure postponed..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-2">
            Clinical Reason
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Abnormal coagulation markers..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-emerald-600 min-h-16"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex gap-2">
          <span className="flex-shrink-0">🔒</span>
          <span>
            AI will automatically scan for identifying information and remove it
            before generating any update.
          </span>
        </div>

        <button
          onClick={() => {
            handleSubmit();
            setCollapsed(true);
          }}
          disabled={loading || !action.trim()}
          className="bg-emerald-700 text-white rounded-lg p-3 text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-800 transition-all"
        >
          {loading ? "Processing..." : "⚡ Generate & De-identify"}
        </button>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs font-mono tracking-widest text-gray-400 uppercase mb-3">
            Family Access Code
          </div>
          <div className="border-2 border-amber-400 rounded-xl p-4 text-center">
            <div className="text-xs text-gray-400 mb-2 font-mono tracking-widest uppercase">
              Share this code once
            </div>
            <div className="font-mono text-3xl tracking-widest text-gray-800 font-medium">
              {accessCode}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-mono">
              ai-assisted-medical-communication.vercel.app/
              <span className="text-emerald-600">view</span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400 text-left">
                Send Code via SMS
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setSmsSent(false);
                    setSmsError("");
                  }}
                  placeholder="(555) 000-0000"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-600"
                />
                <button
                  onClick={handleSendSms}
                  disabled={smsSending || !phoneNumber.trim() || smsSent}
                  className="bg-emerald-700 text-white rounded-lg px-3 text-xs font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {smsSending ? "..." : smsSent ? "✓ Sent" : "Send"}
                </button>
              </div>

              {smsError && (
                <div className="text-xs text-red-500 text-left">
                  ⚠️ {smsError}
                </div>
              )}

              {smsSent && (
                <div className="text-xs text-emerald-600 text-left">
                  ✓ Code sent successfully. Family member will receive a text shortly.
                </div>
              )}

              <div className="text-xs text-gray-300 text-left leading-relaxed">
                Or copy manually:
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="mt-2 w-full bg-stone-100 text-stone-600 border border-stone-200 rounded-lg p-2 text-xs font-semibold hover:bg-stone-200 transition-all"
            >
              {copied ? "✓ Copied!" : "📋 Copy Share Message"}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE BACKDROP */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}