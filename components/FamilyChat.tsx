"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FamilyChatProps {
  currentUpdate: string;
  offset?: boolean;
}

export default function FamilyChat({ currentUpdate, offset = false }: FamilyChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleOpen = () => {
    setOpen(true);
    setHasBeenOpened(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi — I can help explain anything in the update or answer general questions about what to expect. What would you like to know?",
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: currentUpdate,
          history: messages,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I couldn't process that. Try again." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className={`fixed ${offset ? "bottom-24" : "bottom-6"} right-6 z-50 flex flex-col items-end gap-3`}>

      {/* CHAT WINDOW */}
      {open && (
        <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">

          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-xs font-semibold text-gray-800">
                Ask a question
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-xs"
            >
              Close
            </button>
          </div>

          {/* DISCLAIMER */}
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed">
              For medical advice or emergencies, contact the care team directly.
            </p>
          </div>

          {/* MESSAGES */}
          <div className="flex flex-col gap-3 p-4 overflow-y-auto max-h-72">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-3 py-2 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about this update..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* TRIGGER BUTTON */}
      {!open && (
        <button
          onClick={handleOpen}
          className="group flex items-center gap-3 bg-gray-900 text-white rounded-2xl pl-4 pr-5 py-3 shadow-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer"
        >
          {/* PULSING DOT */}
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            {!hasBeenOpened && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>

          <div className="flex flex-col items-start">
            <p className="text-xs font-semibold leading-tight">
              Have questions about this update?
            </p>
            <p className="text-xs text-gray-400 leading-tight">
              Ask our care assistant
            </p>
          </div>

          {/* ARROW */}
          <svg
            className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}