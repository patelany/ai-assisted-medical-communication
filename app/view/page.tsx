"use client";

import FamilyViewer from "@/components/FamilyViewer";

export default function ViewPage() {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white px-9 h-14 flex items-center flex-shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-xl">ClarityAI</span>
          <span className="font-mono text-xs text-stone-500 tracking-widest uppercase">
            Patient Update Feed
          </span>
        </div>
      </header>
      <FamilyViewer correctCode="" />
    </div>
  );
}