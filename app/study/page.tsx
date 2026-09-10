import StudyFlow from "@/components/StudyFlow";

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-xl">ClarityAI</span>
          <span className="font-mono text-xs text-stone-500 tracking-widest uppercase hidden sm:block">
            Research Study
          </span>
        </div>
        <div className="font-mono text-xs text-stone-500 tracking-widest uppercase">
          Anonymous & Confidential
        </div>
      </header>
      <StudyFlow />
    </div>
  );
}