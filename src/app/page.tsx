"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const exampleCompanies = [
  "Standard Chartered Bank",
  "Singtel",
  "DBS Bank",
];

export default function Home() {
  const [company, setCompany] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) {
      router.push(`/brief?company=${encodeURIComponent(company.trim())}`);
    }
  };

  const handleChipClick = (name: string) => {
    router.push(`/brief?company=${encodeURIComponent(name)}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
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
    </main>
  );
}
