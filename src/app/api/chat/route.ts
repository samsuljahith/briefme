import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";

export async function POST(req: NextRequest) {
  try {
    const { company, message, briefContext, chatHistory } = await req.json();

    if (!company || !message) {
      return NextResponse.json(
        { error: "Company and message are required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not found" }, { status: 500 });
    }
    if (!process.env.EXA_API_KEY) {
      return NextResponse.json({ error: "EXA_API_KEY not found" }, { status: 500 });
    }

    // Live web search using Exa based on the user's question
    let liveSearchResults = "";
    try {
      const exa = new Exa(process.env.EXA_API_KEY);
      const searchQuery = `${company} ${message}`;
      const exaResults = await exa.searchAndContents(searchQuery, {
        numResults: 5,
        text: { maxCharacters: 600 },
      });
      liveSearchResults = exaResults.results
        .map((r: { title?: string; text?: string; url?: string }) =>
          `[${r.title}](${r.url})\n${r.text}`
        )
        .join("\n\n");
    } catch (exaError: unknown) {
      console.error("Exa search error in chat:", exaError);
      liveSearchResults = "Live search unavailable.";
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // Build conversation history
    const historyText = Array.isArray(chatHistory)
      ? chatHistory
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join("\n")
      : "";

    const prompt = `You are a Sales Research Agent. Your job is to help salespeople prepare for and refine their pitch to "${company}".

You have access to LIVE web search results — use them to give accurate, up-to-date answers. Always ground your answers in the search data provided.

COMPANY BRIEF (already gathered):
${briefContext || "No brief available."}

LIVE WEB SEARCH RESULTS (just retrieved for this question):
${liveSearchResults}

${historyText ? `CONVERSATION SO FAR:\n${historyText}\n` : ""}

SALESPERSON'S QUESTION: "${message}"

Instructions:
- Answer based on the live search results and brief context
- Be concise, specific, and actionable
- If the search results contain relevant data points, numbers, or quotes — use them
- Focus on what helps the salesperson succeed in their pitch
- If you reference specific info from search results, mention the source briefly`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini error: ${errText}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
