"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const exampleCompanies = [
  "Standard Chartered Bank",
  "Singtel",
  "DBS Bank",
];

interface PitchEntry {
  company: string;
  timestamp: string;
}

export default function Home() {
  const [company, setCompany] = useState("");
  const [recentPitches, setRecentPitches] = useState<PitchEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("briefme_pitches");
    if (stored) {
      try {
        setRecentPitches(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) {
      savePitch(company.trim());
      router.push(`/brief?company=${encodeURIComponent(company.trim())}`);
    }
  };

  const handleChipClick = (name: string) => {
    savePitch(name);
    router.push(`/brief?company=${encodeURIComponent(name)}`);
  };

  const savePitch = (name: string) => {
    const stored = localStorage.getItem("briefme_pitches");
    let pitches: PitchEntry[] = stored ? JSON.parse(stored) : [];
    // Remove duplicate if exists
    pitches = pitches.filter((p) => p.company.toLowerCase() !== name.toLowerCase());
    // Add to front
    pitches.unshift({ company: name, timestamp: new Date().toISOString() });
    // Keep last 10
    pitches = pitches.slice(0, 10);
    localStorage.setItem("briefme_pitches", JSON.stringify(pitches));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-4xl font-bold text-accent mb-2">BriefMe</h1>
      <p className="text-gray-600 mb-8 text-center">
        Get an AI-powered research brief before your next meeting
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-md flex gap-2">
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Enter company name..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          aria-label="Company name"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Brief Me
        </button>
      </form>

      <div className="mt-6 flex gap-2 flex-wrap justify-center">
        {exampleCompanies.map((name) => (
          <button
            key={name}
            onClick={() => handleChipClick(name)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors shadow-sm"
          >
            {name}
          </button>
        ))}
      </div>

      {/* Recent Pitches */}
      {recentPitches.length > 0 && (
        <div className="mt-12 w-full max-w-md">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Pitches
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {recentPitches.map((pitch, i) => (
              <button
                key={i}
                onClick={() => handleChipClick(pitch.company)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-gray-800 font-medium text-sm">
                  {pitch.company}
                </span>
                <span className="text-gray-400 text-xs">
                  {formatDate(pitch.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
