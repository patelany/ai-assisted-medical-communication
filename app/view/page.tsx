import FamilyViewer from "@/components/FamilyViewer";

export const metadata = {
  title: "ClarityAI — Family Updates",
  description: "Stay updated on your loved one's care",
  manifest: "/manifest.json",
};

export default function ViewPage() {
  return (
    <>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ClarityAI" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#111827" />
      </head>
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
    </>
  );
}