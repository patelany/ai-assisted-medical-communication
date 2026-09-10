"use client";

import { useState } from "react";
import EpicPatientSearch from "@/components/EpicPatientSearch";

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
  onPatientLoaded: (name: string) => void;
  onPatientCleared: () => void;
}

export default function DoctorPanel({
  onGenerate,
  loading,
  accessCode,
  hasMessages,
  onPatientLoaded,
  onPatientCleared,
}: DoctorPanelProps) {
  const [status, setStatus] = useState("stable");
  const [action, setAction] = useState("");
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("");
  const [noChange, setNoChange] = useState(false);
  const [noReason, setNoReason] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [admissionDate, setAdmissionDate] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [epicData, setEpicData] = useState<any>(null);
  const [useAutoFill, setUseAutoFill] = useState(false);

  const handleSubmit = () => {
    if (!action.trim()) return;
    onGenerate({ status, action, change, reason, patientName, patientId });
    setStatus("stable");
    setAction("");
    setChange("");
    setReason("");
    setNoChange(false);
    setNoReason(false);
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

  const handlePatientFound = (patient: any) => {
    setPatientId(patient.patientId || "");
    setPatientName(patient.patientName || "");
    setAdmissionDate(patient.admissionDate || null);
    setLocation(patient.location || null);
    setEpicData(patient);
    setPatientLoaded(true);
    setIsManualEntry(false);
    setUseAutoFill(false);
    onPatientLoaded(patient.patientName || "");
    if (patient.emergencyContact) {
      setEmergencyContact(patient.emergencyContact);
      setPhoneNumber(patient.emergencyContact.phone || "");
    }
  };

  const handleManualEntry = (id: string, name: string) => {
    setPatientId(id);
    setPatientName(name);
    setPatientLoaded(true);
    setIsManualEntry(true);
    setUseAutoFill(false);
    onPatientLoaded(name || id);
  };

  const handleAutoFill = () => {
    if (!epicData) return;
    setStatus(epicData.suggestedStatus || "stable");
    setAction(epicData.suggestedAction || "");
    setReason(epicData.suggestedReason || "");
    setChange("");
    setNoChange(false);
    setNoReason(false);
    setUseAutoFill(true);
  };

  const handleSwitchPatient = () => {
    setPatientLoaded(false);
    setIsManualEntry(false);
    setPatientId("");
    setPatientName("");
    setAdmissionDate(null);
    setLocation(null);
    setEmergencyContact(null);
    setPhoneNumber("");
    setEpicData(null);
    setUseAutoFill(false);
    setAction("");
    setChange("");
    setReason("");
    setStatus("stable");
    setNoChange(false);
    setNoReason(false);
    onPatientCleared();
  };

  // BEFORE PATIENT SELECTED — full screen search, no sidebar
  if (!patientLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-100 p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">⚕️</div>
            <h1 className="text-2xl font-serif text-gray-800 mb-2">
              ClarityAI
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enter a patient ID to pull their data from Epic and begin
              generating plain-language family updates.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <EpicPatientSearch
              onPatientFound={handlePatientFound}
              onManualEntry={handleManualEntry}
            />
          </div>

          <p className="text-xs text-center text-gray-300 mt-4 font-mono">
            Connected to Epic FHIR R4 Sandbox
          </p>
        </div>
      </div>
    );
  }

  // AFTER PATIENT SELECTED — sidebar with clinical form
  return (
    <>
      {/* MOBILE TOGGLE */}
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
        {/* MOBILE CLOSE */}
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

        {/* PATIENT HEADER */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                  isManualEntry ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                }`}>
                  {isManualEntry ? "Manual" : "Epic ✓"}
                </span>
                {patientId && (
                  <span className="text-xs text-slate-400 font-mono truncate">
                    {patientId}
                  </span>
                )}
              </div>
              <div className="text-white font-semibold text-sm">
                {patientName || "Unknown Patient"}
              </div>
              {admissionDate && (
                <div className="text-slate-400 text-xs mt-0.5">
                  Admitted: {new Date(admissionDate).toLocaleDateString()}
                </div>
              )}
              {location && (
                <div className="text-slate-400 text-xs">📍 {location}</div>
              )}
              {emergencyContact && (
                <div className="text-slate-300 text-xs mt-1">
                  📞 {emergencyContact.name} — {emergencyContact.phone}
                </div>
              )}
            </div>
            <button
              onClick={handleSwitchPatient}
              className="text-xs text-slate-400 hover:text-white border border-slate-600 rounded-lg px-2 py-1 transition-all hover:border-slate-400 flex-shrink-0"
            >
              Switch
            </button>
          </div>

          {/* AUTO-FILL BUTTON */}
          {!isManualEntry && epicData && !useAutoFill && (
            <button
              onClick={handleAutoFill}
              className="mt-3 w-full bg-blue-600 text-white rounded-lg p-2 text-xs font-semibold hover:bg-blue-700 transition-all"
            >
              ⚡ Auto-fill from Epic data
            </button>
          )}

          {useAutoFill && (
            <div className="mt-3 bg-blue-900 rounded-lg p-2 text-xs text-blue-200">
              ✓ Form pre-filled from Epic — review and edit below
            </div>
          )}
        </div>

        {/* STATUS */}
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

        {/* PLANNED ACTION */}
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

        {/* CHANGE IN PLAN */}
        <div>
          <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-2">
            Change in Plan
          </div>
          <input
            value={noChange ? "No change in plan" : change}
            onChange={(e) => setChange(e.target.value)}
            disabled={noChange}
            placeholder="e.g. Procedure postponed..."
            className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600 ${
              noChange ? "opacity-40 cursor-not-allowed" : ""
            }`}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noChange}
              onChange={(e) => {
                setNoChange(e.target.checked);
                if (e.target.checked) setChange("");
              }}
              className="w-3.5 h-3.5 accent-emerald-700"
            />
            <span className="text-xs text-gray-400">No change in plan</span>
          </label>
        </div>

        {/* CLINICAL REASON */}
        <div>
          <div className="text-xs font-bold tracking-wide uppercase text-gray-400 mb-2">
            Clinical Reason
          </div>
          <textarea
            value={noReason ? "No additional reason" : reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={noReason}
            placeholder="e.g. Abnormal coagulation markers..."
            className={`w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-emerald-600 min-h-16 ${
              noReason ? "opacity-40 cursor-not-allowed" : ""
            }`}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noReason}
              onChange={(e) => {
                setNoReason(e.target.checked);
                if (e.target.checked) setReason("");
              }}
              className="w-3.5 h-3.5 accent-emerald-700"
            />
            <span className="text-xs text-gray-400">No additional reason</span>
          </label>
        </div>

        {/* HIPAA NOTE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex gap-2">
          <span className="flex-shrink-0">🔒</span>
          <span>
            AI will automatically scan for identifying information and remove
            it before generating any update.
          </span>
        </div>

        {/* GENERATE */}
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

        {/* ACCESS CODE */}
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

            {emergencyContact && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-700">
                📞 Auto-filled from Epic: {emergencyContact.name}
              </div>
            )}

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
                  ✓ Code sent successfully.
                </div>
              )}

              <div className="text-xs text-gray-300 text-left">
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