"use client";

export default function StudyPreparing({
  preGenerating,
}: {
  preGenerating: boolean;
}) {
  return (
    <div className="max-w-md mx-auto py-20 px-6 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Preparing your study
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            We're generating your scenarios. This takes about 30 seconds —
            please keep this tab open.
          </p>
        </div>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full"
            style={{
              width: preGenerating ? "60%" : "100%",
              transition: "width 15s ease-in-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}