"use client";

import { useState, useEffect } from "react";
import DoctorPanel from "@/components/DoctorPanel";
import FamilyViewer from "@/components/FamilyViewer";
import Dashboard from "@/components/Dashboard";
import ResearcherAuth from "@/components/ResearcherAuth";
import DoctorAuth from "@/components/DoctorAuth";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const TABS = [
  { key: "compose", label: "Doctor View" },
  { key: "viewer", label: "Family View" },
  { key: "dashboard", label: "Dashboard" },
];

export default function Home() {
  const [tab, setTab] = useState("compose");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [dashboardUnlocked, setDashboardUnlocked] = useState(false);
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState("");
  const [doctorAuthed, setDoctorAuthed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("clarityai_access_code");
    if (stored) {
      setAccessCode(stored);
    } else {
      const newCode = generateCode();
      localStorage.setItem("clarityai_access_code", newCode);
      setAccessCode(newCode);
    }

    // Check if doctor is already authenticated
    const authed = localStorage.getItem("clarityai_doctor_authed");
    if (authed === "true") {
      setDoctorAuthed(true);
    }
  }, []);

  const handleGenerate = async (formData: any) => {
    setMessages(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setMessages(data);

      const update = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: formData.status,
        msg: data.hybrid,
        raw: data.raw,
      };

      setHistory((prev) => [update, ...prev]);

      await fetch("/api/viewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode, update }),
      });
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const handlePatientLoaded = (name: string) => {
    setPatientLoaded(true);
    setCurrentPatientName(name);
    setMessages(null);
  };

  const handlePatientCleared = () => {
    setPatientLoaded(false);
    setCurrentPatientName("");
    setMessages(null);
  };

  const handleSignOut = () => {
    localStorage.removeItem("clarityai_doctor_authed");
    setDoctorAuthed(false);
    setPatientLoaded(false);
    setCurrentPatientName("");
    setMessages(null);
  };

  const handleTabClick = (key: string) => {
    if (key === "dashboard" && !dashboardUnlocked) {
      setTab("dashboard");
      return;
    }
    setTab(key);
  };

  // DOCTOR AUTH GATE
  if (!doctorAuthed) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-100">
        <header className="bg-stone-900 text-white px-4 md:px-9 h-14 flex items-center flex-shrink-0">
          <span className="font-serif text-base md:text-xl">ClarityAI</span>
        </header>
        <DoctorAuth onAuthenticated={() => setDoctorAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">

      {/* HEADER */}
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
                className={`px-2 md:px-4 py-1.5 rounded text-xs font-mono tracking-wide border transition-all ${
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

          {/* SIGN OUT */}
          <button
            onClick={handleSignOut}
            className="text-xs text-stone-500 hover:text-white border border-stone-700 rounded-lg px-3 py-1.5 transition-all hover:border-stone-500 hidden sm:block"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* COMPOSE TAB */}
        {tab === "compose" && (
          <>
            <DoctorPanel
              onGenerate={handleGenerate}
              loading={loading}
              accessCode={accessCode}
              hasMessages={!!messages}
              onPatientLoaded={handlePatientLoaded}
              onPatientCleared={handlePatientCleared}
            />

            {patientLoaded && (
              <main className="flex-1 overflow-y-auto p-4 md:p-7 bg-stone-100">

                {!messages && !loading && (
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

                {loading && (
                  <div className="flex flex-col items-center justify-center min-h-96 gap-5">
                    <div className="w-9 h-9 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
                    <div className="font-mono text-xs text-stone-400 tracking-widest">
                      De-identifying & transforming…
                    </div>
                  </div>
                )}

                {messages && !loading && (
                  <div className="max-w-2xl mx-auto flex flex-col gap-4">

                    {messages.hipaa?.length > 0 ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="text-xs font-bold tracking-widest uppercase text-blue-700 mb-3">
                          🔒 HIPAA De-identification Report
                        </div>
                        {messages.hipaa.map((h: any, i: number) => (
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

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium bg-amber-100 text-amber-700">
                          Update Sent to Family
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ Delivered to family viewer
                        </span>
                      </div>
                      <div className="p-5">
                        <p className="text-sm leading-relaxed text-gray-800">
                          {messages.hybrid}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setMessages(null)}
                      className="w-full border border-gray-200 bg-white rounded-xl p-3 text-sm text-gray-500 font-medium hover:border-emerald-600 hover:text-emerald-700 transition-all"
                    >
                      + Generate New Update
                    </button>

                  </div>
                )}
              </main>
            )}
          </>
        )}

        {/* VIEWER TAB */}
        {tab === "viewer" && (
          <main className="flex-1 overflow-y-auto bg-stone-100">
            <FamilyViewer correctCode={accessCode} />
          </main>
        )}

        {/* DASHBOARD TAB */}
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