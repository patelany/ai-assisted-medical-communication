"use client";

export default function RatingScale({
  value,
  onChange,
  lowLabel,
  highLabel,
  danger,
}: {
  value: number;
  onChange: (n: number) => void;
  lowLabel: string;
  highLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
        {lowLabel}
      </span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
              value === n
                ? danger
                  ? "bg-red-100 border-red-500 text-red-700"
                  : "bg-gray-900 border-gray-900 text-white"
                : "border-gray-200 text-gray-400 hover:border-gray-400 bg-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{highLabel}</span>
    </div>
  );
}