"use client";

import { useState, useEffect } from "react";
import DoctorPanel from "@/components/DoctorPanel";
import MessageCards from "@/components/MessageCards";
import FamilyViewer from "@/components/FamilyViewer";
import Dashboard from "@/components/Dashboard";
import ResearcherAuth from "@/components/ResearcherAuth";

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
  const [responses, setResponses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [dashboardUnlocked, setDashboardUnlocked] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("clarityai_access_code");
    if (stored) {
      setAccessCode(stored);
    } else {
      const newCode = generateCode();
      localStorage.setItem("clarityai_access_code", newCode);
      setAccessCode(newCode);
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
        msg: data.context,
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

  const handleSubmitRatings = (
    ratings: any,
    notes: any,
    participantId: string,
    participantType: string
  ) => {
    setResponses((prev) => [
      ...prev,
      {
        id: Date.now(),
        ratings,
        notes,
        participantId,
        participantType,
        action: "Scenario",
        status: "stable",
      },
    ]);
    setTab("dashboard");
  };

  const handleStartNextParticipant = () => {
    const newCode = generateCode();
    localStorage.setItem("clarityai_access_code", newCode);
    setAccessCode(newCode);
    setMessages(null);
    setDashboardUnlocked(false);
    setParticipantCount((prev) => prev + 1);
    setTab("compose");
  };

  const handleTabClick = (key: string) => {
    if (key === "dashboard" && !dashboardUnlocked) {
      setTab("dashboard");
      return;
    }
    setTab(key);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">

      {/* HEADER */}
      <header className="bg-stone-900 text-white px-4 md:px-9 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-baseline gap-2 md:gap-3 min-w-0">
          <span className="font-serif text-base md:text-xl whitespace-nowrap">
            AI-Assisted Medical
          </span>
          <span className="font-mono text-xs text-stone-500 tracking-widest uppercase hidden lg:block">
            Simplification & Family Update Platform
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <span className="font-mono text-xs text-stone-500 tracking-widest uppercase hidden sm:block">
            P{participantCount}
          </span>
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
            />

            <main className="flex-1 overflow-y-auto p-4 md:p-7 bg-stone-100">
              {!messages && !loading && (
                <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-stone-400">
                  <div className="text-5xl opacity-40">🏥</div>
                  <div className="text-xl md:text-2xl font-serif text-stone-600">
                    No update yet
                  </div>
                  <div className="text-sm text-center max-w-xs leading-relaxed">
                    Fill in the clinical input and click Generate. AI will
                    de-identify the content and produce three message versions.
                  </div>
                  {/* Mobile hint */}
                  <div className="md:hidden bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-500 text-center max-w-xs">
                    Tap the <span className="font-bold">📋</span> button in the
                    bottom left to open the clinical input form.
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
                <div className="max-w-2xl mx-auto">
                  <MessageCards
                    messages={messages}
                    onSubmitRatings={handleSubmitRatings}
                  />
                </div>
              )}
            </main>
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
                <div className="flex justify-end">
                  <button
                    onClick={handleStartNextParticipant}
                    className="bg-stone-900 text-white rounded-lg px-4 md:px-5 py-2.5 text-xs font-mono tracking-wide hover:bg-stone-700 transition-all flex items-center gap-2"
                  >
                    Start Next Participant →
                  </button>
                </div>
                <Dashboard responses={responses} />
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}