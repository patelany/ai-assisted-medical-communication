"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FamilyChatProps {
  currentUpdate: string;
}

export default function FamilyChat({ currentUpdate }: FamilyChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm here to help you understand medical updates about your loved one. I can explain medical terms and answer general questions. For specific medical advice, always contact the care team directly. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentUpdate,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* CHAT BUBBLE BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-4 md:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-50 ${
          open
            ? "bg-stone-800 text-white"
            : "bg-emerald-700 text-white hover:bg-emerald-800"
        }`}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div
          className={`
            fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden

            /* Mobile — nearly full screen */
            inset-x-3 bottom-24 top-20
            
            /* Tablet+ — fixed size in corner */
            md:inset-auto md:bottom-24 md:right-6 md:w-80 md:h-[420px]
          `}
        >
          {/* HEADER */}
          <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="font-semibold text-sm">Care Assistant</div>
              <div className="text-xs text-emerald-200">
                Ask questions about the update
              </div>
            </div>
            {/* Mobile close button inside header */}
            <button
              onClick={() => setOpen(false)}
              className="md:hidden text-emerald-200 hover:text-white text-lg w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* DISCLAIMER */}
          <div className="bg-amber-50 border-b border-amber-100 px-3 py-2 text-xs text-amber-700 flex-shrink-0">
            ⚠️ Not a substitute for medical advice. Contact the care team for
            clinical questions.
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-64 rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-700 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="border-t border-gray-100 p-3 flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 md:py-2 text-sm md:text-xs focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-emerald-700 text-white rounded-lg px-4 md:px-3 text-sm md:text-xs font-semibold hover:bg-emerald-800 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}