"use client";

import { useState } from "react";
import EpicPatientSearch from "@/components/EpicPatientSearch";

const STATUS_OPTIONS = [
  { value: "stable", label: "Stable", color: "bg-emerald-400" },
  { value: "improving", label: "Improving", color: "bg-blue-400" },
  { value: "delayed", label: "Delayed", color: "bg-yellow-400" },
  { value: "under-review", label: "Under Review", color: "bg-purple-400" },
  { value: "awaiting-procedure", label: "Awaiting", color: "bg-orange-400" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
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

  // FULL SCREEN PATIENT SEARCH
  if (!patientLoaded) {
    return (
      <div className="flex-1 flex bg-gray-50">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col justify-between w-80 min-w-80 bg-white border-r border-gray-100 p-10">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <span className="text-2xl leading-none">⚕️</span>
              <span className="font-serif text-lg text-gray-900">ClarityAI</span>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <div className="w-8 h-px bg-gray-200 mb-3" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Connect to your EHR to search patients and generate
                  plain-language family updates in seconds.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { label: "HIPAA de-identification", desc: "Two-layer PHI detection on every update" },
                  { label: "EHR integration", desc: "Live patient data from Epic FHIR R4" },
                  { label: "Family viewer", desc: "Secure access code delivery via SMS" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-300">
            Medical Communication Platform
          </p>
        </div>

        {/* RIGHT — SEARCH CONTENT */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
              <EpicPatientSearch
                onPatientFound={handlePatientFound}
                onManualEntry={handleManualEntry}
              />
            </div>
          </div>
        </div>

      </div>
    );
  }

  // SIDEBAR WITH CLINICAL FORM
  return (
    <>
      {/* MOBILE TOGGLE */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed bottom-6 left-6 z-50 bg-gray-900 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-sm font-medium"
      >
        {collapsed ? "+" : "✕"}
      </button>

      {/* SIDEBAR */}
      <div
        className={`
          bg-white border-r border-gray-100 flex flex-col gap-5 overflow-y-auto
          transition-all duration-300
          fixed inset-0 z-40 p-6
          ${collapsed ? "-translate-x-full" : "translate-x-0"}
          md:relative md:inset-auto md:translate-x-0 md:w-72 md:min-w-72 md:z-auto md:p-5
          lg:w-80 lg:min-w-80 lg:p-6
        `}
      >
        {/* MOBILE CLOSE */}
        <div className="flex items-center justify-between md:hidden">
          <span className="text-sm font-medium text-gray-900">
            Clinical Input
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Close
          </button>
        </div>

        {/* PATIENT HEADER */}
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isManualEntry ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                <span className="text-xs text-gray-400">
                  {isManualEntry ? "Manual entry" : "Via Epic"}
                </span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {patientName || "Unknown Patient"}
              </p>
              {admissionDate && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Admitted {new Date(admissionDate).toLocaleDateString()}
                </p>
              )}
              {location && (
                <p className="text-xs text-gray-400">{location}</p>
              )}
              {emergencyContact && (
                <p className="text-xs text-gray-400 mt-1">
                  Contact: {emergencyContact.name}
                </p>
              )}
            </div>
            <button
              onClick={handleSwitchPatient}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 pt-0.5"
            >
              Switch
            </button>
          </div>

          {!isManualEntry && epicData && !useAutoFill && (
            <button
              onClick={handleAutoFill}
              className="mt-3 w-full bg-white border border-gray-200 text-gray-700 rounded-lg py-2 text-xs font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Auto-fill from Epic
            </button>
          )}

          {useAutoFill && (
            <p className="mt-3 text-xs text-emerald-600">
              Form pre-filled from Epic. Review before generating.
            </p>
          )}
        </div>

        {/* STATUS */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Patient status
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-lg py-2 px-1 text-xs font-medium text-center transition-all flex items-center justify-center gap-1.5 ${
                  status === s.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.color}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* PLANNED ACTION */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Planned action
          </p>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Continue IV antibiotics, prepare for MRI..."
            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-300 transition-colors min-h-20"
          />
        </div>

        {/* CHANGE IN PLAN */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Change in plan
          </p>
          <input
            value={noChange ? "No change in plan" : change}
            onChange={(e) => setChange(e.target.value)}
            disabled={noChange}
            placeholder="Procedure postponed..."
            className={`w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-300 transition-colors ${
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
              className="w-3.5 h-3.5 accent-gray-700"
            />
            <span className="text-xs text-gray-400">No change in plan</span>
          </label>
        </div>

        {/* CLINICAL REASON */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Clinical reason
          </p>
          <textarea
            value={noReason ? "No additional reason" : reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={noReason}
            placeholder="Abnormal coagulation markers..."
            className={`w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-300 transition-colors min-h-16 ${
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
              className="w-3.5 h-3.5 accent-gray-700"
            />
            <span className="text-xs text-gray-400">No additional reason</span>
          </label>
        </div>

        {/* HIPAA NOTE */}
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Patient information is automatically scanned and removed before
            any update is generated.
          </p>
        </div>

        {/* GENERATE */}
        <button
          onClick={() => {
            handleSubmit();
            setCollapsed(true);
          }}
          disabled={loading || !action.trim()}
          className="bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Generate update"}
        </button>

        {/* ACCESS CODE */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-medium text-gray-500 mb-3">
            Family access code
          </p>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-2">
              Share this code once
            </p>
            <p className="font-mono text-2xl tracking-widest text-gray-900 font-semibold">
              {accessCode}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ai-assisted-medical-communication.vercel.app/view
            </p>

            {emergencyContact && (
              <p className="text-xs text-emerald-600 mt-2">
                Contact pre-filled from Epic: {emergencyContact.name}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500">
                Send via SMS
              </p>
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
                  className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-300 transition-colors"
                />
                <button
                  onClick={handleSendSms}
                  disabled={smsSending || !phoneNumber.trim() || smsSent}
                  className="bg-gray-900 text-white rounded-lg px-3 text-xs font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {smsSending ? "..." : smsSent ? "Sent" : "Send"}
                </button>
              </div>

              {smsError && (
                <p className="text-xs text-red-500">{smsError}</p>
              )}
              {smsSent && (
                <p className="text-xs text-emerald-600">Sent successfully.</p>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="mt-3 w-full bg-white border border-gray-200 text-gray-600 rounded-lg py-2 text-xs font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {copied ? "Copied" : "Copy share message"}
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