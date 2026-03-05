"use client";

import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function ChatPage() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Auto scroll chat ⭐
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [chat]);

  // Send message to backend route ⭐
  async function sendMessage() {

    if (!message.trim()) return;

    const userMessage = message;

    // Show user message in UI
    setChat(prev => [...prev, {
      role: "user",
      text: userMessage
    }]);

    setMessage("");
    setLoading(true);

    try {

      const res = await fetch(
        "http://localhost:3000/api/v1/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: userMessage
          })
        }
      );

      const data = await res.json();

      setChat(prev => [...prev, {
        role: "ai",
        text: data.reply
      }]);

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

 return (
  <AppLayout>
  <main className="min-h-screen flex flex-col px-6 py-6">

    {/* Header */}
    <div className="mb-6 text-center">
      <h1 className="text-3xl font-semibold text-[#31c2d5]">
        ⚕️ {t.chat.title}
      </h1>
      <p className="text-white/60 text-sm mt-2">
        {t.chat.description}
      </p>
    </div>

    {/* Chat Window */}
    <div className="flex-1 ui-component-styles p-6 rounded-2xl overflow-y-auto space-y-4 max-h-[70vh] scrollbar-hidden ">

      {chat.map((c, i) => (
        <div
          key={i}
          className={`max-w-[75%] px-4 py-3 rounded-xl text-sm transition-all duration-200
            ${
              c.role === "user"
                ? "ml-auto bg-[#31c2d5]/20 border border-[#31c2d5]/40 text-white"
                : "mr-auto bg-white/10 border border-white/20 text-white"
            }`}
        >
          {c.text}
        </div>
      ))}

      {loading && (
        <p className="text-white/50 text-sm animate-pulse">
          {t.chat.thinking}
        </p>
      )}

      <div ref={chatEndRef} />
    </div>

    {/* Input Section */}
    <div className="mt-6 flex gap-3 sticky bottom-0 bg-transparent">

      <input
        type="text"
        placeholder={t.chat.placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        className="flex-1"
      />

      <button
        onClick={sendMessage}
        disabled={loading}
        className={
          loading
            ? "button-style-blue_disabled"
            : "button-style-blue"
        }
      >
        {t.chat.send}
      </button>

    </div>

  </main>
 
  </AppLayout>

 );
}