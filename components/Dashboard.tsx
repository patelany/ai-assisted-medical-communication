"use client";

import { useState, useEffect } from "react";

interface StudyResponse {
  id: string;
  participant_id: string;
  age_range: string;
  medical_background: string;
  prior_hospitalization: string;
  scenario_id: string;
  message_order: string[];
  raw_understanding: number;
  raw_anxiety: number;
  raw_notes: string;
  hybrid_understanding: number;
  hybrid_anxiety: number;
  hybrid_notes: string;
  context_understanding: number;
  context_anxiety: number;
  context_notes: string;
  debrief_reaction: string;
  submitted_at: string;
}

const VERSION_LABELS: Record<string, string> = {
  raw: "Raw Clinical",
  hybrid: "Hybrid",
  context: "AI + Context",
};

const BAR_COLORS: Record<string, string> = {
  raw: "bg-red-500",
  hybrid: "bg-amber-500",
  context: "bg-emerald-600",
};

function avg(responses: StudyResponse[], key: keyof StudyResponse) {
  const vals = responses
    .map((r) => r[key])
    .filter((v) => typeof v === "number" && v > 0) as number[];
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function BarChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number; cls: string }[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        {title}
      </div>
      <div className="flex flex-col gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 md:gap-3">
            <div className="w-24 text-xs font-mono text-gray-400 text-right flex-shrink-0">
              {d.name}
            </div>
            <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
              <div
                className={`h-full rounded flex items-center justify-end pr-2 text-white text-xs font-bold font-mono transition-all duration-1000 ${d.cls}`}
                style={{ width: d.value > 0 ? `${(d.value / 5) * 100}%` : "0%" }}
              >
                {d.value > 0 ? d.value.toFixed(1) : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupBreakdown({
  title,
  groups,
  responses,
  metricKey,
}: {
  title: string;
  groups: { label: string; filter: (r: StudyResponse) => boolean }[];
  responses: StudyResponse[];
  metricKey: "hybrid_understanding" | "hybrid_anxiety";
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        {title}
      </div>
      <div className="flex flex-col gap-3">
        {groups.map((g) => {
          const filtered = responses.filter(g.filter);
          const value = filtered.length
            ? filtered
                .map((r) => r[metricKey])
                .filter((v) => v > 0)
                .reduce((a, b) => a + b, 0) /
              filtered.filter((r) => r[metricKey] > 0).length
            : 0;
          return (
            <div key={g.label} className="flex items-center gap-3">
              <div className="w-32 text-xs font-mono text-gray-400 text-right flex-shrink-0">
                {g.label}
              </div>
              <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded flex items-center justify-end pr-2 text-white text-xs font-bold font-mono transition-all duration-1000"
                  style={{ width: value > 0 ? `${(value / 5) * 100}%` : "0%" }}
                >
                  {value > 0 ? value.toFixed(1) : ""}
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono w-8 flex-shrink-0">
                n={filtered.length}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [responses, setResponses] = useState<StudyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await fetch("/api/study");
        const data = await res.json();
        if (data.responses) {
          setResponses(data.responses);
        } else {
          setError("Failed to load study data.");
        }
      } catch (e) {
        setError("Network error. Could not load study data.");
      }
      setLoading(false);
    };

    fetchResponses();
  }, []);

  const exportCSV = () => {
    const rows = [
      [
        "Participant ID",
        "Age Range",
        "Medical Background",
        "Prior Hospitalization",
        "Scenario",
        "Message Order",
        "Raw Understanding",
        "Raw Anxiety",
        "Raw Notes",
        "Hybrid Understanding",
        "Hybrid Anxiety",
        "Hybrid Notes",
        "Context Understanding",
        "Context Anxiety",
        "Context Notes",
        "Debrief Reaction",
        "Submitted At",
      ],
    ];

    responses.forEach((r) => {
      rows.push([
        r.participant_id || "",
        r.age_range || "",
        r.medical_background || "",
        r.prior_hospitalization || "",
        r.scenario_id || "",
        (r.message_order || []).join(" → "),
        String(r.raw_understanding || ""),
        String(r.raw_anxiety || ""),
        (r.raw_notes || "").replace(/,/g, ";"),
        String(r.hybrid_understanding || ""),
        String(r.hybrid_anxiety || ""),
        (r.hybrid_notes || "").replace(/,/g, ";"),
        String(r.context_understanding || ""),
        String(r.context_anxiety || ""),
        (r.context_notes || "").replace(/,/g, ";"),
        (r.debrief_reaction || "").replace(/,/g, ";"),
        r.submitted_at || "",
      ]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clarityai_study_data.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
        <div className="text-xs font-mono text-gray-400 tracking-widest">
          Loading study data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-gray-400">
        <div className="text-4xl">⚠️</div>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-gray-400">
        <div className="text-5xl opacity-40">📊</div>
        <div className="text-xl font-serif text-gray-600">No study data yet</div>
        <div className="text-sm text-center max-w-xs leading-relaxed">
          Share the study link with participants at{" "}
          <span className="font-mono text-emerald-600">
            ai-assisted-medical-communication.vercel.app/study
          </span>
        </div>
      </div>
    );
  }

  const uniqueParticipants = new Set(responses.map((r) => r.participant_id)).size;

  return (
    <div className="flex flex-col gap-5">

      {/* EXPORT */}
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
          className="border border-gray-200 rounded-lg px-4 py-2 text-xs font-mono text-gray-400 hover:border-emerald-600 hover:text-emerald-700 transition-all flex items-center gap-2"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-serif text-emerald-700 mb-1">
            {uniqueParticipants}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Participants
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-serif text-emerald-700 mb-1">
            {responses.length}
          </div>
          <div className="text-xs uppercase tracking-widests text-gray-400 font-bold">
            Scenario Ratings
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-serif text-emerald-700 mb-1">
            {avg(responses, "hybrid_understanding") > 0
              ? avg(responses, "hybrid_understanding").toFixed(1)
              : "—"}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Hybrid Understanding
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-serif text-red-500 mb-1">
            {avg(responses, "raw_anxiety") > 0
              ? avg(responses, "raw_anxiety").toFixed(1)
              : "—"}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Raw Anxiety
          </div>
        </div>
      </div>

      {/* UNDERSTANDING CHART */}
      <BarChart
        title="Avg Understanding Score by Message Type (1–5, higher = clearer)"
        data={[
          { name: "Raw Clinical", value: avg(responses, "raw_understanding"), cls: "bg-red-500" },
          { name: "Hybrid", value: avg(responses, "hybrid_understanding"), cls: "bg-amber-500" },
          { name: "AI + Context", value: avg(responses, "context_understanding"), cls: "bg-emerald-600" },
        ]}
      />

      {/* ANXIETY CHART */}
      <BarChart
        title="Avg Anxiety Score by Message Type (1–5, lower = calmer)"
        data={[
          { name: "Raw Clinical", value: avg(responses, "raw_anxiety"), cls: "bg-red-500" },
          { name: "Hybrid", value: avg(responses, "hybrid_anxiety"), cls: "bg-amber-500" },
          { name: "AI + Context", value: avg(responses, "context_anxiety"), cls: "bg-emerald-600" },
        ]}
      />

      {/* BREAKDOWN BY MEDICAL BACKGROUND */}
      <GroupBreakdown
        title="Hybrid Understanding by Medical Background"
        responses={responses}
        metricKey="hybrid_understanding"
        groups={[
          { label: "Medical", filter: (r) => r.medical_background === "medical" },
          { label: "Non-Medical", filter: (r) => r.medical_background === "non-medical" },
        ]}
      />

      {/* BREAKDOWN BY AGE */}
      <GroupBreakdown
        title="Hybrid Understanding by Age Range"
        responses={responses}
        metricKey="hybrid_understanding"
        groups={[
          { label: "18–30", filter: (r) => r.age_range === "18–30" },
          { label: "31–45", filter: (r) => r.age_range === "31–45" },
          { label: "46–60", filter: (r) => r.age_range === "46–60" },
          { label: "60+", filter: (r) => r.age_range === "60+" },
        ]}
      />

      {/* BREAKDOWN BY HOSPITALIZATION */}
      <GroupBreakdown
        title="Hybrid Understanding by Prior Hospitalization Experience"
        responses={responses}
        metricKey="hybrid_understanding"
        groups={[
          { label: "Yes", filter: (r) => r.prior_hospitalization === "yes" },
          { label: "No", filter: (r) => r.prior_hospitalization === "no" },
          { label: "Unsure", filter: (r) => r.prior_hospitalization === "unsure" },
        ]}
      />

      {/* RESPONSE TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Individual Responses
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">ID</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Age</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Background</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Scenario</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Raw U/A</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Hybrid U/A</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Context U/A</th>
                <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="py-2 pr-3 font-mono text-gray-600 font-bold">
                    {r.participant_id}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{r.age_range || "—"}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      r.medical_background === "medical"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {r.medical_background === "medical" ? "🩺 Medical" : "👤 Non-Medical"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-gray-500">{r.scenario_id || "—"}</td>
                  <td className="py-2 pr-3 font-mono">
                    <span className="text-emerald-700">{r.raw_understanding || "—"}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-red-500">{r.raw_anxiety || "—"}</span>
                  </td>
                  <td className="py-2 pr-3 font-mono">
                    <span className="text-emerald-700">{r.hybrid_understanding || "—"}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-red-500">{r.hybrid_anxiety || "—"}</span>
                  </td>
                  <td className="py-2 pr-3 font-mono">
                    <span className="text-emerald-700">{r.context_understanding || "—"}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-red-500">{r.context_anxiety || "—"}</span>
                  </td>
                  <td className="py-2 text-gray-400">
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}