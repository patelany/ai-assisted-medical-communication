"use client";

import { useState } from "react";

interface HipaaRedaction {
  original: string;
  replacement: string;
  type: string;
}

interface Messages {
  hipaa: HipaaRedaction[];
  raw: string;
  hybrid: string;
  context: string;
}

interface Rating {
  understanding: number;
  anxiety: number;
}

interface Ratings {
  raw: Rating;
  hybrid: Rating;
  context: Rating;
}

interface MessageCardsProps {
  messages: Messages;
  onSubmitRatings: (
    ratings: Ratings,
    notes: Record<string, string>,
    participantId: string,
    participantType: string
  ) => void;
}

const VERSION_META = {
  raw: {
    label: "Raw Clinical",
    tagClass: "bg-red-100 text-red-700",
    desc: "Unmodified clinical language for medical professionals.",
  },
  hybrid: {
    label: "Hybrid",
    tagClass: "bg-amber-100 text-amber-700",
    desc: "Plain language with key clinical values preserved.",
  },
  context: {
    label: "AI + Context",
    tagClass: "bg-emerald-100 text-emerald-700",
    desc: "Fully plain language, warm and reassuring.",
  },
};

function StarRating({
  value,
  onChange,
  danger,
}: {
  value: number;
  onChange: (n: number) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-8 h-8 md:w-7 md:h-7 rounded border text-xs font-bold font-mono transition-all ${
            value >= n
              ? danger
                ? "bg-red-100 border-red-600 text-red-700"
                : "bg-emerald-100 border-emerald-600 text-emerald-700"
              : "border-gray-200 text-gray-400"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function MessageCards({
  messages,
  onSubmitRatings,
}: MessageCardsProps) {
  const [ratings, setRatings] = useState<Partial<Ratings>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [participantId, setParticipantId] = useState(
    `P${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [participantType, setParticipantType] = useState("");
  const [attempted, setAttempted] = useState(false);

  const updateRating = (
    version: string,
    key: "understanding" | "anxiety",
    value: number
  ) => {
    setRatings((prev) => ({
      ...prev,
      [version]: {
        ...(prev as any)[version],
        [key]: value,
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4">

      {/* PARTICIPANT INFO */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Participant Information
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Participant ID
            </div>
            <input
              type="text"
              placeholder="Auto-generated"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Participant Type
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: "medical", label: "🩺 Medical Professional" },
                { value: "non-medical", label: "👤 Non-Medical" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setParticipantType(type.value)}
                  className={`border rounded-lg p-3 md:p-2 text-xs font-semibold text-left transition-all px-3 ${
                    participantType === type.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : attempted && !participantType
                      ? "border-red-400 text-gray-400"
                      : "border-gray-200 text-gray-400"
                  }`}
                >
                  {type.label}
                </button>
              ))}
              {attempted && !participantType && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <span>ⓘ</span>
                  <span>Please select a participant type</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HIPAA REPORT */}
      {messages?.hipaa?.length > 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs font-bold tracking-widest uppercase text-blue-700 mb-3">
            🔒 HIPAA De-identification Report
          </div>
          {messages.hipaa.map((h, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 text-xs"
            >
              <span className="text-gray-400 w-20 md:w-24 flex-shrink-0">
                {h.type}
              </span>
              <span className="line-through text-red-500 font-mono">
                {h.original}
              </span>
              <span className="text-gray-400">→</span>
              <span className="bg-white text-blue-700 font-mono px-2 py-0.5 rounded">
                {h.replacement}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex gap-2">
          ✓ <strong>No PHI detected</strong> — input appears safe to transmit.
        </div>
      )}

      {/* MESSAGE CARDS */}
      {(["raw", "hybrid", "context"] as const).map((version) => {
        const meta = VERSION_META[version];
        const missingUnderstanding = !(ratings as any)[version]?.understanding;
        const missingAnxiety = !(ratings as any)[version]?.anxiety;
        const cardIncomplete =
          attempted && (missingUnderstanding || missingAnxiety);

        return (
          <div
            key={version}
            className={`bg-white border rounded-xl overflow-hidden transition-all ${
              cardIncomplete
                ? "border-red-400 shadow-sm shadow-red-100"
                : "border-gray-200"
            }`}
          >
            {/* CARD HEADER */}
            <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-2 md:gap-3">
              <span
                className={`text-xs font-mono tracking-widest uppercase px-2 py-1 rounded font-medium flex-shrink-0 ${meta.tagClass}`}
              >
                {meta.label}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {meta.desc}
              </span>
            </div>

            <div className="p-4">
              <p
                className={`text-sm leading-relaxed ${
                  version === "raw"
                    ? "font-mono text-gray-500 bg-gray-50 p-3 rounded-lg text-xs"
                    : "text-gray-800"
                }`}
              >
                {messages[version]}
              </p>

              {/* RATINGS — stacked on mobile, side by side on tablet+ */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">

                {/* Understanding + Anxiety side by side on tablet, stacked on phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Understanding
                    </div>
                    <StarRating
                      value={(ratings as any)[version]?.understanding || 0}
                      onChange={(n) =>
                        updateRating(version, "understanding", n)
                      }
                    />
                    {attempted && missingUnderstanding && (
                      <div className="flex items-center gap-1 text-red-500 text-xs">
                        <span>ⓘ</span>
                        <span>Please rate understanding</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Anxiety Level
                    </div>
                    <StarRating
                      danger
                      value={(ratings as any)[version]?.anxiety || 0}
                      onChange={(n) => updateRating(version, "anxiety", n)}
                    />
                    {attempted && missingAnxiety && (
                      <div className="flex items-center gap-1 text-red-500 text-xs">
                        <span>ⓘ</span>
                        <span>Please rate anxiety</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  placeholder="What do you think is happening? What's unclear?"
                  value={notes[version] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [version]: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs md:p-2 resize-none focus:outline-none focus:border-emerald-600 min-h-14 md:min-h-12"
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* SUBMIT BUTTON */}
      <button
        onClick={() => {
          const missingRatings = (["raw", "hybrid", "context"] as const).some(
            (v) =>
              !(ratings as any)[v]?.understanding ||
              !(ratings as any)[v]?.anxiety
          );
          const hasErrors = missingRatings || !participantType;
          if (hasErrors) {
            setAttempted(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          onSubmitRatings(
            ratings as Ratings,
            notes,
            participantId,
            participantType
          );
        }}
        className="bg-emerald-700 text-white rounded-lg p-4 md:p-3 text-sm font-semibold hover:bg-emerald-800 transition-all"
      >
        Submit Ratings →
      </button>
    </div>
  );
}