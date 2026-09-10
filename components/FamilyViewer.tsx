"use client";

import { useState, useEffect } from "react";
import FamilyChat from "@/components/FamilyChat";

interface Update {
  time: string;
  status: string;
  msg: string;
  raw: string;
}

interface FamilyViewerProps {
  correctCode: string;
}

const STATUS_CLASS: Record<string, string> = {
  stable: "bg-emerald-100 text-emerald-700",
  improving: "bg-blue-100 text-blue-700",
  delayed: "bg-orange-100 text-orange-700",
  "under-review": "bg-purple-100 text-purple-700",
  "awaiting-procedure": "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

function ClipboardDetails({ raw }: { raw: string }) {
  return (
    <div className="mt-4 relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-5 bg-gray-300 rounded-b-md border border-gray-400 z-10 flex items-center justify-center">
        <div className="w-5 h-3 bg-gray-400 rounded-sm" />
      </div>
      <div
        className="bg-amber-50 border border-amber-200 rounded-lg pt-6 pb-4 px-4"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 24px, #e5e7eb 24px, #e5e7eb 25px)",
          backgroundPositionY: "32px",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 font-mono">
            📋 Clinical Details
          </span>
          <span className="text-xs text-gray-400 font-mono">
            — For medical reference only
          </span>
        </div>
        <p className="font-mono text-xs text-gray-600 leading-relaxed bg-transparent">
          {raw}
        </p>
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-600 italic">
            This clinical information is provided for reference. Please consult
            directly with the care team for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FamilyViewer({ correctCode }: FamilyViewerProps) {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!unlocked) return;

    const fetchUpdates = async () => {
      const res = await fetch(`/api/viewer?code=${correctCode}`);
      const data = await res.json();
      setUpdates(data.updates);
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 10000);
    return () => clearInterval(interval);
  }, [unlocked, correctCode]);

  const handleUnlock = () => {
    if (code.trim() === correctCode) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Code not recognized. Check the code and try again.");
    }
  };

  // Most recent update text for the chat assistant context
  const latestUpdate = updates.length > 0 ? updates[0].msg : "";

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto py-16 px-6">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💙</div>
          <h1 className="text-2xl font-serif mb-2">Patient Update Feed</h1>
          <p className="text-sm text-gray-500">
            Enter the access code shared by the patient's family to view live
            updates. No account needed.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center font-mono text-2xl tracking-widest focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={handleUnlock}
            className="bg-emerald-700 text-white rounded-lg px-5 text-sm font-semibold hover:bg-emerald-800 transition-all"
          >
            View →
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mt-3">{error}</p>
        )}

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-700">
            💡 <strong>Demo:</strong> Ask the care team for your 6-digit access
            code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-serif mb-1">Live Updates</h1>
          <p className="text-xs text-gray-400">
            AI-simplified updates from the care team
          </p>
        </div>
        <button
          onClick={() => {
            setUnlocked(false);
            setCode("");
            setUpdates([]);
            setExpandedIndex(null);
          }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:border-emerald-600 hover:text-emerald-700 transition-all"
        >
          Sign Out
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-sm font-serif text-gray-600 mb-2">
            No updates yet
          </p>
          <p className="text-xs max-w-xs mx-auto leading-relaxed">
            The care team hasn't posted an update yet. This page refreshes
            automatically every 10 seconds — you don't need to do anything.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {updates.map((u, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="text-xs font-mono text-gray-400 tracking-widest uppercase mb-2">
                🕐 {u.time} today
              </div>
              <p className="text-sm leading-relaxed text-gray-800">{u.msg}</p>

              <div className="flex items-center justify-between mt-3">
                <div
                  className={`inline-flex items-center text-xs font-bold tracking-widest uppercase px-2 py-1 rounded ${
                    STATUS_CLASS[u.status] || STATUS_CLASS.stable
                  }`}
                >
                  {u.status.toUpperCase()}
                </div>

                {u.raw && (
                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === i ? null : i)
                    }
                    className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      expandedIndex === i
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
                    }`}
                  >
                    <span>📋</span>
                    <span>
                      {expandedIndex === i
                        ? "Hide Clinical Details"
                        : "View Clinical Details"}
                    </span>
                  </button>
                )}
              </div>

              {expandedIndex === i && u.raw && (
                <ClipboardDetails raw={u.raw} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAMILY CHAT ASSISTANT — shown whenever viewer is unlocked */}
      {unlocked && (
        <FamilyChat currentUpdate={latestUpdate} />
      )}
    </div>
  );
}