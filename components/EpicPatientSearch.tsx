"use client";

import { useState } from "react";

interface PatientResult {
  patientId: string;
  patientName: string;
  admissionDate: string | null;
  location: string | null;
  emergencyContact: { name: string; phone: string } | null;
  suggestedStatus: string;
  suggestedAction: string;
  suggestedReason: string;
  vitals: { name: string; value: string; date: string }[];
  labs: { name: string; value: string; date: string }[];
  conditions: { name: string; status: string }[];
  orders: { name: string; status: string }[];
}

interface SearchResult {
  id: string;
  name: string;
  mrn: string;
  dob: string;
  gender: string;
}

interface EpicPatientSearchProps {
  onPatientFound: (patient: PatientResult) => void;
  onManualEntry: (patientId: string, patientName: string) => void;
}

type Step = "search" | "results" | "confirm";

export default function EpicPatientSearch({
  onPatientFound,
  onManualEntry,
}: EpicPatientSearchProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [step, setStep] = useState<Step>("search");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    setStep("search");

    try {
      const res = await fetch(
        `/api/epic/patient?search=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();

      if (data.results?.length > 0) {
        setSearchResults(data.results);
        setStep("results");
      } else {
        setSearchError(
          "No patients found. Try a different name or MRN."
        );
      }
    } catch (e) {
      setSearchError("Network error. Check your connection.");
    }

    setSearching(false);
  };

  const handleSelectPatient = (patient: SearchResult) => {
    setSelectedPatient(patient);
    setStep("confirm");
  };

  const handleAutoFill = async () => {
    if (!selectedPatient) return;
    setLoadingPatient(true);

    try {
      const res = await fetch(
        `/api/epic/patient?patientId=${selectedPatient.id}`
      );
      const data = await res.json();

      if (data.error) {
        setSearchError("Failed to load patient data. Try again.");
        setStep("results");
      } else {
        onPatientFound(data);
      }
    } catch (e) {
      setSearchError("Network error. Check your connection.");
      setStep("results");
    }

    setLoadingPatient(false);
  };

  const handleManual = () => {
    if (!selectedPatient) return;
    onManualEntry(selectedPatient.id, selectedPatient.name);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* STEP 1 — SEARCH */}
      {step === "search" && (
        <>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Search by Name or MRN
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Smith or 203713"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="bg-emerald-700 text-white rounded-lg px-4 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
              >
                {searching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Search →"
                )}
              </button>
            </div>

            {searchError && (
              <p className="text-red-500 text-xs leading-relaxed">
                {searchError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-300 font-mono">
              Epic FHIR R4 Sandbox
            </span>
            <span className="text-xs text-blue-400 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              FHIR R4
            </span>
          </div>
        </>
      )}

      {/* STEP 2 — RESULTS LIST */}
      {step === "results" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {searchResults.length} Patient{searchResults.length !== 1 ? "s" : ""} Found
            </div>
            <button
              onClick={() => {
                setStep("search");
                setSearchResults([]);
                setQuery("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-all"
            >
              ← New Search
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {searchResults.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="w-full text-left border border-gray-200 rounded-xl p-3 hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
              >
                <div className="font-semibold text-sm text-gray-800 group-hover:text-emerald-700">
                  {patient.name}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {patient.mrn && (
                    <span className="text-xs text-gray-400 font-mono">
                      MRN: {patient.mrn}
                    </span>
                  )}
                  {patient.dob && (
                    <span className="text-xs text-gray-400">
                      DOB: {patient.dob}
                    </span>
                  )}
                  {patient.gender && (
                    <span className="text-xs text-gray-400 capitalize">
                      {patient.gender}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 — CONFIRM + CHOOSE FILL METHOD */}
      {step === "confirm" && selectedPatient && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setStep("results")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-all text-left"
          >
            ← Back to results
          </button>

          {/* SELECTED PATIENT CARD */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wide mb-1">
              Selected Patient
            </div>
            <div className="text-white font-semibold text-sm mb-1">
              {selectedPatient.name}
            </div>
            <div className="flex items-center gap-3">
              {selectedPatient.mrn && (
                <span className="text-xs text-slate-400 font-mono">
                  MRN: {selectedPatient.mrn}
                </span>
              )}
              {selectedPatient.dob && (
                <span className="text-xs text-slate-400">
                  DOB: {selectedPatient.dob}
                </span>
              )}
            </div>
          </div>

          {/* FILL OPTIONS */}
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
            How would you like to fill the update form?
          </div>

          <button
            onClick={handleAutoFill}
            disabled={loadingPatient}
            className="w-full bg-emerald-700 text-white rounded-xl p-4 text-sm font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingPatient ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Pulling from Epic…
              </>
            ) : (
              <>
                ⚡ Auto-fill from Epic
                <span className="text-emerald-200 text-xs font-normal">
                  — vitals, labs, conditions
                </span>
              </>
            )}
          </button>

          <button
            onClick={handleManual}
            disabled={loadingPatient}
            className="w-full border border-gray-200 bg-white rounded-xl p-4 text-sm text-gray-500 font-medium hover:border-gray-400 hover:text-gray-700 transition-all disabled:cursor-not-allowed"
          >
            ✏️ Enter notes manually
            <span className="text-gray-300 text-xs font-normal ml-1">
              — I'll type the update myself
            </span>
          </button>

          {searchError && (
            <p className="text-red-500 text-xs">{searchError}</p>
          )}
        </div>
      )}
    </div>
  );
}