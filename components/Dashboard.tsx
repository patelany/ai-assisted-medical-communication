"use client";

interface Rating {
  understanding: number;
  anxiety: number;
}

interface Response {
  id: number;
  action: string;
  status: string;
  ratings: Record<string, Rating>;
  notes: Record<string, string>;
  participantId: string;
  participantType: string;
}

interface DashboardProps {
  responses: Response[];
}

const VERSIONS = ["raw", "simplified", "context"] as const;

const VERSION_LABELS: Record<string, string> = {
  raw: "Raw Clinical",
  simplified: "AI Simplified",
  context: "AI + Context",
};

const BAR_COLORS: Record<string, string> = {
  raw: "bg-red-500",
  simplified: "bg-amber-500",
  context: "bg-emerald-600",
};

function avg(responses: Response[], version: string, key: "understanding" | "anxiety") {
  const vals = responses
    .filter((r) => r.ratings[version]?.[key])
    .map((r) => r.ratings[version][key]);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function BarChart({
  title,
  responses,
  metricKey,
}: {
  title: string;
  responses: Response[];
  metricKey: "understanding" | "anxiety";
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        {title}
      </div>
      <div className="flex flex-col gap-3">
        {VERSIONS.map((version) => {
          const value = avg(responses, version, metricKey);
          return (
            <div key={version} className="flex items-center gap-3">
              <div className="w-24 text-xs font-mono text-gray-400 text-right">
                {VERSION_LABELS[version]}
              </div>
              <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                <div
                  className={`h-full rounded flex items-center justify-end pr-2 text-white text-xs font-bold font-mono transition-all duration-1000 ${BAR_COLORS[version]}`}
                  style={{ width: value > 0 ? `${(value / 5) * 100}%` : "0%" }}
                >
                  {value > 0 ? value.toFixed(1) : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ responses }: DashboardProps) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-gray-400">
        <div className="text-5xl opacity-40">📊</div>
        <div className="text-xl font-serif text-gray-600">No data yet</div>
        <div className="text-sm text-center max-w-xs leading-relaxed">
          Submit ratings on the Doctor View to populate the dashboard.
        </div>
      </div>
    );
  }

const exportCSV = () => {
    const rows = [
      ["Participant ID", "Participant Type", "Version", "Understanding", "Anxiety", "Notes"],
    ];
    responses.forEach((r) => {
      VERSIONS.forEach((v) => {
        rows.push([
          r.participantId || "",
          r.participantType || "",
          VERSION_LABELS[v],
          String(r.ratings[v]?.understanding || ""),
          String(r.ratings[v]?.anxiety || ""),
          (r.notes[v] || "").replace(/,/g, ";"),
        ]);
      });
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clarityai_research_data.csv";
    a.click();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
          className="border border-gray-200 rounded-lg px-4 py-2 text-xs font-mono text-gray-400 hover:border-emerald-600 hover:text-emerald-700 transition-all flex items-center gap-2"
        >
          ⬇ Export CSV
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-4xl font-serif text-emerald-700 mb-1">
            {responses.length}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Responses
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-4xl font-serif text-emerald-700 mb-1">
            {avg(responses, "context", "understanding") > 0
              ? avg(responses, "context", "understanding").toFixed(1)
              : "—"}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Avg Understanding (AI+Context)
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-4xl font-serif text-red-600 mb-1">
            {avg(responses, "raw", "anxiety") > 0
              ? avg(responses, "raw", "anxiety").toFixed(1)
              : "—"}
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Avg Anxiety (Raw)
          </div>
        </div>
      </div>

      <BarChart
        title="Avg Understanding Score (1–5, higher = clearer)"
        responses={responses}
        metricKey="understanding"
      />

      <BarChart
        title="Avg Anxiety Score (1–5, lower = calmer)"
        responses={responses}
        metricKey="anxiety"
      />

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Qualitative Responses
        </div>
        <table className="w-full text-xs">
          <thead>
<tr className="border-b border-gray-100">
              <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">ID</th>
              <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Type</th>
              <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Version</th>
              <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Understanding</th>
              <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Anxiety</th>
              <th className="text-left pb-2 text-gray-400 font-bold uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody>
            {responses.flatMap((r) =>
              VERSIONS.map((v) => (
<tr key={`${r.id}-${v}`} className="border-b border-gray-50">
                  <td className="py-2 pr-3 font-mono text-gray-600 font-bold">
                    {r.participantId || "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      r.participantType === "medical"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {r.participantType === "medical" ? "🩺 Medical" : "👤 Non-Medical"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      v === "raw" ? "bg-red-100 text-red-700" :
                      v === "simplified" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {VERSION_LABELS[v]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-emerald-700 font-bold">
                    {r.ratings[v]?.understanding || "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-red-600 font-bold">
                    {r.ratings[v]?.anxiety || "—"}
                  </td>
                  <td className="py-2 text-gray-400 italic">
                    {r.notes[v] || "No notes"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}