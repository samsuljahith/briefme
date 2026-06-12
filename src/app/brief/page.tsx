"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";

interface BriefData {
  snapshot: string;
  news: string[];
  pastContext: string;
  talkingPoints: string[];
  riskFlags: string[];
  pastMeetings: { summary: string; date: string }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function BriefContent() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "";

  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!company) return;

    const fetchBrief = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate brief");
        setBrief(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchBrief();
  }, [company]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSaveMemory = async () => {
    if (!notes.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        // Add the new meeting to the pastMeetings list immediately
        if (brief) {
          const newMeeting = {
            summary: `Meeting notes for ${company}: ${notes}`,
            date: data.dateLabel || new Date().toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setBrief({
            ...brief,
            pastMeetings: [...(brief.pastMeetings || []), newMeeting],
          });
        }
        setNotes("");
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const briefContext = brief
        ? `Snapshot: ${brief.snapshot}\nNews: ${brief.news.join("; ")}\nTalking Points: ${brief.talkingPoints.join("; ")}\nRisk Flags: ${brief.riskFlags.join("; ")}\nPast Context: ${brief.pastContext}`
        : "";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          message: userMessage,
          briefContext,
          chatHistory: chatMessages,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get a response. Try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No company specified.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Researching {company}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-accent mb-6">{company}</h1>

      {brief && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Snapshot */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Snapshot
            </h2>
            <p className="text-gray-800">{brief.snapshot}</p>
          </div>

          {/* News */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Recent News
            </h2>
            <ul className="space-y-1">
              {brief.news.map((item, i) => (
                <li key={i} className="text-gray-700 text-sm">
                  • {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Past Context */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Past Context
            </h2>
            {brief.pastMeetings && brief.pastMeetings.length > 0 ? (
              <div className="space-y-3">
                {brief.pastMeetings.map((meeting, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-accent pl-3 py-1"
                  >
                    <p className="text-xs text-gray-400 font-medium mb-0.5">
                      Meeting {i + 1} — {meeting.date}
                    </p>
                    <p className="text-gray-700 text-sm">{meeting.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 text-sm">
                {brief.pastContext || "No previous interactions recorded."}
              </p>
            )}
          </div>

          {/* Talking Points */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Talking Points
            </h2>
            <ul className="space-y-1">
              {brief.talkingPoints.map((point, i) => (
                <li key={i} className="text-gray-700 text-sm">
                  • {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Flags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Risk Flags
            </h2>
            <ul className="space-y-1">
              {brief.riskFlags.map((flag, i) => (
                <li key={i} className="text-red-600 text-sm">
                  ⚠ {flag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Post-meeting notes */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Post-Meeting Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened in the meeting? Add notes to remember for next time..."
          className="w-full h-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          aria-label="Post-meeting notes"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleSaveMemory}
            disabled={saving || !notes.trim()}
            className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save to Memory"}
          </button>
          {saved && (
            <span className="text-green-600 text-sm">✓ Saved to memory</span>
          )}
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-xl z-50"
        aria-label="Toggle chat assistant"
      >
        {chatOpen ? "✕" : "💬"}
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-accent rounded-t-xl">
            <h3 className="text-white font-semibold text-sm">
              🔍 Sales Research Agent
            </h3>
            <p className="text-blue-100 text-xs">
              Live web search powered — ask anything about {company}
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-8">
                I search the web in real-time to answer your questions about {company}. Try asking about competitors, financials, or recent deals.
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
                  🔍 Searching the web...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendChat}
            className="px-3 py-3 border-t border-gray-100 flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              aria-label="Chat message"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-2 bg-accent text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default function BriefPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
        </div>
      }
    >
      <BriefContent />
    </Suspense>
  );
}
