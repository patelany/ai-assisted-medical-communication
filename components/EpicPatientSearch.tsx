"use client";

import { useState, useEffect } from "react";

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

type Step = "connect" | "search" | "results" | "confirm";

export default function EpicPatientSearch({
  onPatientFound,
  onManualEntry,
}: EpicPatientSearchProps) {
  const [step, setStep] = useState<Step>("connect");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [connectError, setConnectError] = useState("");

  useEffect(() => {
    // Check if coming back from Epic OAuth
    const params = new URLSearchParams(window.location.search);
    const epicConnected = params.get("epic_connected");
    const epicError = params.get("epic_error");

    if (epicConnected === "true") {
      setStep("search");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (epicError) {
      setConnectError(`Epic connection failed: ${epicError}. Please try again.`);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Check if already connected by trying a test request
    checkEpicConnection();
  }, []);

  const checkEpicConnection = async () => {
    try {
      const res = await fetch("/api/epic/patient?patientId=test-connection-check");
      const data = await res.json();
      // If we get "Not connected" it means cookie is missing — stay on connect screen
      // If we get any other error (like patient not found) it means we ARE connected
      if (res.status === 401 && data.error?.includes("Not connected")) {
        setStep("connect");
      } else {
        setStep("search");
      }
    } catch (e) {
      setStep("connect");
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/epic/connect";
  };

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

      if (res.status === 401) {
        setStep("connect");
        return;
      }

      if (data.results?.length > 0) {
        setSearchResults(data.results);
        setStep("results");
      } else {
        setSearchError("No patients found. Try a different name or MRN.");
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

      if (res.status === 401) {
        setStep("connect");
        return;
      }

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

  // STEP 1 — CONNECT TO EPIC
  if (step === "connect") {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center py-4">
          <div className="text-4xl mb-3">⚕️</div>
          <h2 className="text-lg font-serif text-gray-800 mb-1">
            Connect to Epic
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
            Sign in with your Epic credentials to search for patients and
            pull clinical data automatically.
          </p>
        </div>

        <button
          onClick={handleConnect}
          className="w-full bg-blue-600 text-white rounded-xl p-4 text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <span>🏥</span>
          Connect to Epic EHR
        </button>

        {connectError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
            {connectError}
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-gray-300 font-mono">
            Epic FHIR R4 Sandbox
          </span>
          <span className="text-xs text-blue-400 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            FHIR R4
          </span>
        </div>
      </div>
    );
  }

  // STEP 2 — SEARCH
  if (step === "search") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-700 font-mono px-2 py-0.5 rounded font-semibold">
              Epic ✓ Connected
            </span>
          </div>
          <button
            onClick={() => setStep("connect")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-all"
          >
            Disconnect
          </button>
        </div>

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
              placeholder="e.g. Lopez or 203713"
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
      </div>
    );
  }

  // STEP 3 — RESULTS
  if (step === "results") {
    return (
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
    );
  }

  // STEP 4 — CONFIRM
  if (step === "confirm" && selectedPatient) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setStep("results")}
          className="text-xs text-gray-400 hover:text-gray-600 transition-all text-left"
        >
          ← Back to results
        </button>

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
            — I&apos;ll type the update myself
          </span>
        </button>

        {searchError && (
          <p className="text-red-500 text-xs">{searchError}</p>
        )}
      </div>
    );
  }

  return null;
}