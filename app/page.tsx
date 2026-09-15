"use client";

import { useState, useEffect, useRef } from "react";
import ClinicianPanel from "@/components/ClinicianPanel";
import FamilyViewer from "@/components/FamilyViewer";
import Dashboard from "@/components/Dashboard";
import ResearcherAuth from "@/components/ResearcherAuth";
import ClinicianAuth from "@/components/ClinicianAuth";

function generateCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
}

const TABS = [
  { key: "compose", label: "Clinician View" },
  { key: "viewer", label: "Family View" },
  { key: "dashboard", label: "Dashboard" },
];

export default function Home() {
  const [tab, setTab] = useState("compose");
  const [loading, setLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [accessCode, setAccessCode] = useState("");
  const [dashboardUnlocked, setDashboardUnlocked] = useState(false);
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState("");
  const [clinicianAuthed, setClinicianAuthed] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [fetchingUpdates, setFetchingUpdates] = useState(false);
  const accessCodeRef = useRef("");

  useEffect(() => {
    const authed = localStorage.getItem("clarityai_clinician_authed");
    const authedAt = localStorage.getItem("clarityai_clinician_authed_at");
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    if (authed === "true" && authedAt && Date.now() - parseInt(authedAt) < EIGHT_HOURS) {
      setClinicianAuthed(true);
      const storedName = localStorage.getItem("clarityai_clinician_name") || "";
      if (storedName) setCurrentPatientName(storedName);
    } else {
      localStorage.removeItem("clarityai_clinician_authed");
      localStorage.removeItem("clarityai_clinician_authed_at");
      localStorage.removeItem("clarityai_clinician_name");
      localStorage.removeItem("clarityai_clinician_email");
    }

    const stored = localStorage.getItem("clarityai_access_code");
    if (stored) {
      setAccessCode(stored);
      accessCodeRef.current = stored;
      fetchExistingUpdates(stored);
    } else {
      const newCode = generateCode();
      localStorage.setItem("clarityai_access_code", newCode);
      setAccessCode(newCode);
      accessCodeRef.current = newCode;
    }
  }, []);

    const fetchExistingUpdates = async (code: string) => {
    setFetchingUpdates(true);
    try {
      const res = await fetch(`/api/viewer?code=${code}`);
      const data = await res.json();
      if (data.updates && data.updates.length > 0) {
        setHistory(data.updates);
      }
    } catch (e) {
      console.error("Failed to fetch existing updates:", e);
    }
    setFetchingUpdates(false);
  };

  const handleGenerate = async (formData: any) => {
    setCurrentMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setCurrentMessage(data);

      const update = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: formData.status,
        msg: data.hybrid,
        raw: data.raw,
        action: formData.action,
        change: formData.change,
        reason: formData.reason,
      };

           if (editingUpdate) {
        console.log("Editing update id:", editingUpdate.id);
        const patchRes = await fetch(`/api/viewer/${editingUpdate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ update }),
        });
        const patchData = await patchRes.json();
        console.log("PATCH response:", patchData);
        setHistory((prev) =>
          prev.map((h) =>
            h.id === editingUpdate.id
              ? { ...update, id: editingUpdate.id }
              : h
          )
        );
        setEditingUpdate(null);
      } else {
        const viewerRes = await fetch("/api/viewer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: accessCode, update }),
        });
        const viewerData = await viewerRes.json();
        setHistory((prev) => [{ ...update, id: viewerData.id }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const handleDeleteUpdate = async (id: string) => {
    try {
      await fetch(`/api/viewer/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (editingUpdate?.id === id) setEditingUpdate(null);
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

    const handlePatientLoaded = (name: string) => {
    setPatientLoaded(true);
    setCurrentPatientName(name);
    fetchExistingUpdates(accessCodeRef.current);
  };

  const handlePatientCleared = () => {
    setPatientLoaded(false);
    setCurrentPatientName("");
    setCurrentMessage(null);
    setHistory([]);
    setEditingUpdate(null);
  };

  const handleSignOut = () => {
    localStorage.removeItem("clarityai_clinician_authed");
    localStorage.removeItem("clarityai_clinician_authed_at");
    localStorage.removeItem("clarityai_clinician_name");
    localStorage.removeItem("clarityai_clinician_email");
    setClinicianAuthed(false);
    setPatientLoaded(false);
    setCurrentPatientName("");
    setCurrentMessage(null);
    setHistory([]);
    setEditingUpdate(null);
  };

  const handleTabClick = (key: string) => {
    if (key === "dashboard" && !dashboardUnlocked) {
      setTab("dashboard");
      return;
    }
    setTab(key);
  };

  if (!clinicianAuthed) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-100">
        <header className="bg-stone-900 text-white px-4 md:px-9 h-14 flex items-center flex-shrink-0">
          <span className="font-serif text-base md:text-xl">ClarityAI</span>
        </header>
        <ClinicianAuth onAuthenticated={(clinician) => {
          setClinicianAuthed(true);
          if (clinician?.name) setCurrentPatientName(clinician.name);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">

      <header className="bg-stone-900 text-white px-4 md:px-9 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-baseline gap-2 md:gap-3 min-w-0">
          <span className="font-serif text-base md:text-xl whitespace-nowrap">
            ClarityAI
          </span>
          <span className="font-mono text-xs text-stone-500 tracking-widest uppercase hidden lg:block">
            Medical Communication Platform
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {patientLoaded && currentPatientName && (
            <span className="font-mono text-xs text-emerald-400 tracking-wide hidden sm:block">
              Patient: {currentPatientName}
            </span>
          )}
          {dashboardUnlocked && (
            <span className="font-mono text-xs text-emerald-500 tracking-widest uppercase hidden sm:flex items-center gap-1">
              🔓
            </span>
          )}
          <nav className="flex gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={`px-2 md:px-4 py-1.5 rounded text-xs font-mono tracking-wide border transition-all cursor-pointer ${
                  tab === key
                    ? "bg-stone-700 text-white border-stone-600"
                    : "border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800"
                }`}
              >
                {key === "dashboard" && !dashboardUnlocked ? "🔒 " : ""}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">
                  {key === "compose" ? "📋" : key === "viewer" ? "👁" : "📊"}
                </span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleSignOut}
            className="text-xs text-stone-500 hover:text-white border border-stone-700 rounded-lg px-3 py-1.5 transition-all hover:border-stone-500 hidden sm:block cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {tab === "compose" && (
          <>
            <ClinicianPanel
              onGenerate={handleGenerate}
              loading={loading}
              accessCode={accessCode}
              hasMessages={history.length > 0}
              onPatientLoaded={handlePatientLoaded}
              onPatientCleared={handlePatientCleared}
              editingUpdate={editingUpdate}
              onCancelEdit={() => setEditingUpdate(null)}
            />

            {patientLoaded && (
              <main className="flex-1 overflow-y-auto p-4 md:p-7 bg-stone-100">

                                {fetchingUpdates && (
                  <div className="flex flex-col items-center justify-center min-h-96 gap-5">
                    <div className="w-9 h-9 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
                    <div className="font-mono text-xs text-stone-400 tracking-widest">
                      Loading updates…
                    </div>
                  </div>
                )}

                {history.length === 0 && !loading && !fetchingUpdates && (
                  <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-stone-400">
                    <div className="text-5xl opacity-40">📋</div>
                    <div className="text-xl md:text-2xl font-serif text-stone-600">
                      No updates yet
                    </div>
                    <div className="text-sm text-center max-w-xs leading-relaxed">
                      Fill in the clinical form and click Generate to send a
                      plain-language update to the family viewer.
                    </div>
                  </div>
                )}

                  {loading && !fetchingUpdates && (
                  <div className="flex flex-col items-center justify-center min-h-96 gap-5">
                    <div className="w-9 h-9 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
                    <div className="font-mono text-xs text-stone-400 tracking-widest">
                      De-identifying & transforming…
                    </div>
                  </div>
                )}

                {!loading && history.length > 0 && (
                  <div className="max-w-2xl mx-auto flex flex-col gap-4">

                    {currentMessage && (
                      <>
                        {currentMessage.hipaa?.length > 0 ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="text-xs font-bold tracking-widest uppercase text-blue-700 mb-3">
                              HIPAA De-identification Report
                            </div>
                            {currentMessage.hipaa.map((h: any, i: number) => (
                              <div key={i} className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                                <span className="text-gray-400 w-20 flex-shrink-0">{h.type}</span>
                                <span className="line-through text-red-500 font-mono">{h.original}</span>
                                <span className="text-gray-400">→</span>
                                <span className="bg-white text-blue-700 font-mono px-2 py-0.5 rounded">{h.replacement}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex gap-2">
                            ✓ <strong>No PHI detected</strong> — input appears safe to transmit.
                          </div>
                        )}
                      </>
                    )}

                    {history.map((update, i) => (
                      <div key={update.id || i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium bg-amber-100 text-amber-700">
                            {i === 0 ? "Latest Update" : `Update — ${update.time}`}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{update.time}</span>
                            <button
                              onClick={() => setEditingUpdate(update)}
                              className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUpdate(update.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="p-5">
                          <p className="text-sm leading-relaxed text-gray-800">
                            {update.msg}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </main>
            )}
          </>
        )}

        {tab === "viewer" && (
          <main className="flex-1 overflow-y-auto bg-stone-100">
            <FamilyViewer correctCode={accessCode} />
          </main>
        )}

        {tab === "dashboard" && (
          <main className="flex-1 overflow-y-auto p-4 md:p-7 bg-stone-100">
            {!dashboardUnlocked ? (
              <ResearcherAuth
                onAuthenticated={() => setDashboardUnlocked(true)}
              />
            ) : (
              <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                <Dashboard />
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}