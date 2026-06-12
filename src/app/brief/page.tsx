"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface BriefData {
  snapshot: string;
  news: string[];
  pastContext: string;
  talkingPoints: string[];
  riskFlags: string[];
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
      if (res.ok) {
        setSaved(true);
        setNotes("");
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
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
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
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
            <p className="text-gray-700 text-sm">
              {brief.pastContext || "No previous interactions recorded."}
            </p>
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
            <span className="text-green-600 text-sm">
              ✓ Saved to memory
            </span>
          )}
        </div>
      </div>
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
