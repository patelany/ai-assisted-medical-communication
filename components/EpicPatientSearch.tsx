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
  onPatientSelected: (patient: PatientResult) => void;
}

export default function EpicPatientSearch({
  onPatientSelected,
}: EpicPatientSearchProps) {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const res = await fetch(`/api/epic/patient?patientId=${patientId.trim()}`);
      const data = await res.json();

      if (data.error) {
        setError("Patient not found. Check the ID and try again.");
      } else {
        setSearched(true);
        onPatientSelected(data);
      }
    } catch (e) {
      setError("Network error. Check your connection.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-700 text-sm font-semibold">
            ⚕️ Epic Integration
          </span>
          <span className="text-xs text-blue-500 font-mono bg-blue-100 px-2 py-0.5 rounded">
            FHIR R4
          </span>
        </div>
        <p className="text-xs text-blue-600 leading-relaxed">
          Enter a patient ID to automatically pull their demographics, vitals,
          labs, conditions, and emergency contact from Epic.
        </p>
      </div>

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
              setSearched(false);
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
              "Pull →"
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs">{error}</p>
        )}

        {searched && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 flex items-center gap-2">
            ✓ Patient data loaded — form pre-filled below
          </div>
        )}
      </div>

      <div className="text-xs text-gray-300 text-center">
        Using Epic FHIR R4 sandbox — test with Epic sandbox patient IDs
      </div>
    </div>
  );
}