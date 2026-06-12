import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { company, notes } = await req.json();

    if (!company || !notes) {
      return NextResponse.json(
        { error: "Company and notes are required" },
        { status: 400 }
      );
    }

    if (!process.env.MEM0_API_KEY) {
      return NextResponse.json({ error: "MEM0_API_KEY not found" }, { status: 500 });
    }

    const res = await fetch("https://api.mem0.ai/v1/memories/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${process.env.MEM0_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: `Meeting notes for ${company}: ${notes}` },
        ],
        user_id: "user_1",
        metadata: { company },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Mem0 add error:", res.status, errText);
      return NextResponse.json(
        { error: `Mem0 error: ${errText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Memory save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
