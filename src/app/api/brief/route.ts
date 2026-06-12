import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json();

    if (!company) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    if (!process.env.EXA_API_KEY) {
      return NextResponse.json({ error: "EXA_API_KEY not found in environment" }, { status: 500 });
    }
    if (!process.env.MEM0_API_KEY) {
      return NextResponse.json({ error: "MEM0_API_KEY not found in environment" }, { status: 500 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not found in environment" }, { status: 500 });
    }

    // Exa search for live company research
    let exaContext = "";
    try {
      const exa = new Exa(process.env.EXA_API_KEY);
      const exaResults = await exa.searchAndContents(company, {
        numResults: 5,
        text: { maxCharacters: 800 },
      });
      exaContext = exaResults.results
        .map((r) => `${r.title || ""}: ${r.text || ""}`)
        .join("\n\n");
    } catch (exaError: unknown) {
      console.error("Exa API error:", exaError);
      exaContext = `Could not fetch live research for ${company}.`;
    }

    // Mem0 search via REST API — get individual meeting entries
    let memoryContext = "No previous interactions recorded.";
    interface MeetingEntry {
      summary: string;
      date: string;
    }
    let pastMeetings: MeetingEntry[] = [];
    try {
      const mem0Res = await fetch("https://api.mem0.ai/v1/memories/search/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${process.env.MEM0_API_KEY}`,
        },
        body: JSON.stringify({
          query: company,
          user_id: "user_1",
          limit: 20,
        }),
      });

      if (mem0Res.ok) {
        const mem0Data = await mem0Res.json();
        const memories = mem0Data.results || mem0Data;
        if (Array.isArray(memories) && memories.length > 0) {
          // Group memories by the same meeting (within 5 minutes of each other)
          const grouped: { date: Date; dateLabel: string; summaries: string[] }[] = [];

          for (const m of memories) {
            if (!m.memory) continue;
            const dateStr = m.metadata?.timestamp || m.created_at || "";
            const memDate = dateStr ? new Date(dateStr) : new Date();

            // Check if this memory belongs to an existing meeting group (within 5 min)
            let foundGroup = false;
            for (const group of grouped) {
              const diffMs = Math.abs(memDate.getTime() - group.date.getTime());
              if (diffMs < 5 * 60 * 1000) {
                // Same meeting — append to group
                group.summaries.push(m.memory);
                foundGroup = true;
                break;
              }
            }

            if (!foundGroup) {
              const dateLabel = memDate.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              grouped.push({ date: memDate, dateLabel, summaries: [m.memory] });
            }
          }

          // Sort by date (oldest first)
          grouped.sort((a, b) => a.date.getTime() - b.date.getTime());

          // Merge each group into a single meeting entry
          pastMeetings = grouped.map((g) => ({
            summary: g.summaries.join(". "),
            date: g.dateLabel,
          }));

          memoryContext = pastMeetings
            .map((m) => `[${m.date}] ${m.summary}`)
            .join("\n");
        }
      } else {
        const errText = await mem0Res.text();
        console.error("Mem0 search error:", mem0Res.status, errText);
      }
    } catch (memError: unknown) {
      console.error("Mem0 API error:", memError);
    }

    // Gemini 2.5 Flash API call
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `You are a corporate research assistant. Based on the following research data about "${company}", return ONLY valid JSON (no markdown, no code fences) with these exact keys:

{
  "snapshot": "A 2-3 sentence company overview",
  "news": ["array of 3-5 recent news items or developments"],
  "pastContext": "Summary of past interactions or 'No previous interactions recorded.'",
  "talkingPoints": ["array of 3-5 suggested talking points for a meeting"],
  "riskFlags": ["array of 1-3 potential risk factors or concerns"]
}

RESEARCH DATA:
${exaContext}

PAST INTERACTION MEMORY:
${memoryContext}

Return ONLY the JSON object, nothing else.`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API response:", errText);
      return NextResponse.json(
        { error: `Gemini API error (${geminiRes.status}): ${errText}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini returned empty response" },
        { status: 500 }
      );
    }

    // Clean up potential markdown fences
    const cleanedText = rawText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const briefData = JSON.parse(cleanedText);

    // Attach the raw past meetings array for the frontend
    briefData.pastMeetings = pastMeetings;

    return NextResponse.json(briefData);
  } catch (error: unknown) {
    console.error("Brief generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
