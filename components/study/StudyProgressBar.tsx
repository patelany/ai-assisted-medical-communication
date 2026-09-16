"use client";

export default function StudyProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="w-full bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-gray-900 w-6"
                : i === current
                ? "bg-gray-400 w-6"
                : "bg-gray-200 w-3"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 flex-shrink-0">
        Step {current + 1} of {total} — {label}
      </p>
    </div>
  );
}