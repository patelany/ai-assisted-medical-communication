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

type Step = "connect" | "search" | "results" | "confirm" | "manual";

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

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualMrn, setManualMrn] = useState("");
  const [manualContact, setManualContact] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const epicConnected = params.get("epic_connected");
    const epicError = params.get("epic_error");

    if (epicConnected === "true") {
      setStep("search");
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (epicError) {
      setConnectError(`Connection failed: ${epicError}. Please try again.`);
      window.history.replaceState({}, "", window.location.pathname);
    }

    checkEpicConnection();
  }, []);

  const checkEpicConnection = async () => {
    try {
      const res = await fetch("/api/epic/patient?patientId=test-connection-check");
      const data = await res.json();
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
      const res = await fetch(`/api/epic/patient?patientId=${selectedPatient.id}`);
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

  const handleManualFromConfirm = () => {
    if (!selectedPatient) return;
    onManualEntry(selectedPatient.id, selectedPatient.name);
  };

  const handleManualSubmit = () => {
    if (!manualName.trim()) {
      setManualError("Patient name is required.");
      return;
    }
    setManualError("");

    // Build a minimal patient-like object for manual entry
    const patientId = manualMrn.trim() || `MANUAL-${Date.now()}`;

    // Pass emergency contact info through the onPatientFound callback
    // so DoctorPanel can pre-fill the phone number
    if (manualContact.trim() || manualPhone.trim()) {
      onPatientFound({
        patientId,
        patientName: manualName.trim(),
        admissionDate: null,
        location: null,
        emergencyContact: {
          name: manualContact.trim() || "Emergency Contact",
          phone: manualPhone.trim(),
        },
        suggestedStatus: "stable",
        suggestedAction: "",
        suggestedReason: "",
        vitals: [],
        labs: [],
        conditions: [],
        orders: [],
      });
    } else {
      onManualEntry(patientId, manualName.trim());
    }
  };

  // CONNECT
  if (step === "connect") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
            Step 1 of 3
          </p>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
            Connect your EHR
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Select your hospital's electronic health record system to search
            patients and pull clinical data automatically.
          </p>
        </div>

        {connectError && (
          <p className="text-xs text-red-500 leading-relaxed">{connectError}</p>
        )}

        <div className="flex flex-col gap-2.5">
          {/* EPIC — active */}
          <button
            onClick={handleConnect}
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 hover:bg-gray-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#e31837] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs tracking-tight">epic</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Epic</p>
              <p className="text-xs text-gray-400 mt-0.5">
                MyChart · Hyperspace · FHIR R4
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* CERNER — coming soon */}
          <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 rounded-lg bg-[#0078c8] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">Oracle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Cerner</p>
              <p className="text-xs text-gray-400 mt-0.5">Oracle Health · FHIR R4</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-shrink-0">Coming soon</span>
          </div>

          {/* ATHENAHEALTH — coming soon */}
          <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 rounded-lg bg-[#005eb8] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">AH</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">athenahealth</p>
              <p className="text-xs text-gray-400 mt-0.5">athenaOne · FHIR R4</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-shrink-0">Coming soon</span>
          </div>

          {/* MEDITECH — coming soon */}
          <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 rounded-lg bg-[#4a4a4a] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">MT</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">MEDITECH</p>
              <p className="text-xs text-gray-400 mt-0.5">Expanse · FHIR R4</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-shrink-0">Coming soon</span>
          </div>
        </div>

        {/* SECURITY NOTE */}
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Your credentials are never stored by ClarityAI. Authentication is
            handled directly by your EHR provider.
          </p>
        </div>

        {/* MANUAL ENTRY DIVIDER */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={() => setStep("manual")}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Enter patient details manually
        </button>

        <p className="text-xs text-gray-300 text-center -mt-2">
          All connections use FHIR R4 · SMART on FHIR · OAuth 2.0 with PKCE
        </p>
      </div>
    );
  }

  // MANUAL ENTRY
  if (step === "manual") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <button
            onClick={() => setStep("connect")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
            Patient details
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Enter the patient's information manually. You'll fill in the
            clinical notes on the next screen.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* PATIENT NAME */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Patient name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => {
                setManualName(e.target.value);
                setManualError("");
              }}
              placeholder="Full name"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* MRN */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              MRN or patient ID
              <span className="text-gray-300 font-normal ml-1">optional</span>
            </label>
            <input
              type="text"
              value={manualMrn}
              onChange={(e) => setManualMrn(e.target.value)}
              placeholder="203713"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors font-mono"
            />
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">Emergency contact</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* CONTACT NAME */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Contact name
              <span className="text-gray-300 font-normal ml-1">optional</span>
            </label>
            <input
              type="text"
              value={manualContact}
              onChange={(e) => setManualContact(e.target.value)}
              placeholder="Sarah Johnson"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* CONTACT PHONE */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Contact phone
              <span className="text-gray-300 font-normal ml-1">optional · used to send access code</span>
            </label>
            <input
              type="tel"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {manualError && (
          <p className="text-xs text-red-500">{manualError}</p>
        )}

        <button
          onClick={handleManualSubmit}
          disabled={!manualName.trim()}
          className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    );
  }

  // SEARCH
  if (step === "search") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
            Step 2 of 3
          </p>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
            Find a patient
          </h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400">Epic connected</span>
          </div>
          <button
            onClick={() => setStep("connect")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">
            Patient name or MRN
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Lopez or 203713"
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="bg-gray-900 text-white rounded-lg px-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
            >
              {searching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {searchError && (
            <p className="text-xs text-red-500">{searchError}</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={() => setStep("manual")}
          className="text-xs text-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          Enter patient details manually
        </button>
      </div>
    );
  }

  // RESULTS
  if (step === "results") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => {
              setStep("search");
              setSearchResults([]);
              setQuery("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            New search
          </button>
        </div>

        <div className="flex flex-col divide-y divide-gray-100">
          {searchResults.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="w-full text-left py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 group"
            >
              <div className="font-medium text-sm text-gray-900 group-hover:text-gray-700">
                {patient.name}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {patient.mrn && (
                  <span className="text-xs text-gray-400">MRN {patient.mrn}</span>
                )}
                {patient.dob && (
                  <span className="text-xs text-gray-400">DOB {patient.dob}</span>
                )}
                {patient.gender && (
                  <span className="text-xs text-gray-400 capitalize">{patient.gender}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // CONFIRM
  if (step === "confirm" && selectedPatient) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
            Step 3 of 3
          </p>
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
            Confirm patient
          </h2>
        </div>

        <button
          onClick={() => setStep("results")}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-left"
        >
          ← Back to results
        </button>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Selected patient</p>
          <p className="font-semibold text-gray-900 text-sm">{selectedPatient.name}</p>
          <div className="flex items-center gap-3 mt-1">
            {selectedPatient.mrn && (
              <span className="text-xs text-gray-400">MRN {selectedPatient.mrn}</span>
            )}
            {selectedPatient.dob && (
              <span className="text-xs text-gray-400">DOB {selectedPatient.dob}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-500">
            How would you like to fill the form?
          </p>

          <button
            onClick={handleAutoFill}
            disabled={loadingPatient}
            className="w-full bg-gray-900 text-white rounded-lg py-3 px-4 text-sm font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingPatient ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Pulling from Epic
              </>
            ) : (
              "Auto-fill from Epic"
            )}
          </button>

          <button
            onClick={handleManualFromConfirm}
            disabled={loadingPatient}
            className="w-full bg-white text-gray-700 rounded-lg py-3 px-4 text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
          >
            Enter notes manually
          </button>
        </div>

        {searchError && (
          <p className="text-xs text-red-500">{searchError}</p>
        )}
      </div>
    );
  }

  return null;
}