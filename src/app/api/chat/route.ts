import { NextRequest, NextResponse } from "next/server";

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // Build conversation context
    const historyText = Array.isArray(chatHistory)
      ? chatHistory
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join("\n")
      : "";

    const prompt = `You are a helpful sales assistant. A salesperson is preparing to pitch "${company}".

Here is the research brief they already have:
${briefContext || "No brief available."}

${historyText ? `Previous conversation:\n${historyText}\n` : ""}

The salesperson asks: "${message}"

Provide a concise, actionable answer that helps them with their pitch. Be specific to ${company}. Keep your response focused and practical.`;

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
