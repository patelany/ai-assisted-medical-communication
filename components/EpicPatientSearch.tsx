"use client";

import { useState } from "react";

interface PatientResult {
  patientId: string;
  patientName: string;
  admissionDate: string | null;
  location: string | null;
  emergencyContact: {
    name: string;
    phone: string;
  } | null;
  suggestedStatus: string;
  suggestedAction: string;
  suggestedReason: string;
  vitals: { name: string; value: string; date: string }[];
  labs: { name: string; value: string; date: string }[];
  conditions: { name: string; status: string }[];
  orders: { name: string; status: string }[];
}

interface EpicPatientSearchProps {
  onPatientFound: (patient: PatientResult) => void;
  onManualEntry: (patientId: string, patientName: string) => void;
}

export default function EpicPatientSearch({
  onPatientFound,
  onManualEntry,
}: EpicPatientSearchProps) {
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [epicFailed, setEpicFailed] = useState(false);

  const handleSearch = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setError("");
    setEpicFailed(false);

    try {
      const res = await fetch(
        `/api/epic/patient?patientId=${patientId.trim()}`
      );
      const data = await res.json();

      if (data.error) {
        // Epic failed — show manual entry option
        setEpicFailed(true);
        setError(
          "Could not pull data from Epic. You can enter notes manually below."
        );
      } else {
        onPatientFound(data);
      }
    } catch (e) {
      setEpicFailed(true);
      setError(
        "Network error connecting to Epic. You can enter notes manually below."
      );
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5 flex-1">
      {/* HEADER */}
      <div className="text-center pt-4">
        <div className="text-4xl mb-3">⚕️</div>
        <h2 className="text-lg font-serif text-gray-800 mb-1">
          Find Patient
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
          Enter the patient ID or MRN to pull their data from Epic and
          pre-fill the update form automatically.
        </p>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Patient ID or MRN
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setError("");
              setEpicFailed(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. eJ4hbHiX4b2GQS..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600 font-mono"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !patientId.trim()}
            className="bg-emerald-700 text-white rounded-lg px-4 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Search →"
            )}
          </button>
        </div>

        {error && (
          <p className="text-amber-600 text-xs leading-relaxed">{error}</p>
        )}
      </div>

      {/* MANUAL ENTRY FALLBACK — shown when Epic fails */}
      {epicFailed && (
        <div className="flex flex-col gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
            Enter Patient Name Manually
          </div>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Patient name or identifier..."
            className="w-full bg-white border border-amber-200 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => {
              if (patientId.trim()) {
                onManualEntry(patientId.trim(), patientName.trim());
              }
            }}
            disabled={!patientId.trim()}
            className="w-full bg-amber-600 text-white rounded-xl p-3 text-sm font-semibold hover:bg-amber-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue with Manual Entry →
          </button>
        </div>
      )}

      {/* EPIC BADGE */}
      <div className="flex items-center justify-center gap-2 mt-auto">
        <span className="text-xs text-gray-300 font-mono">
          Connected to Epic FHIR R4 Sandbox
        </span>
        <span className="text-xs text-blue-400 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          FHIR R4
        </span>
      </div>
    </div>
  );
}