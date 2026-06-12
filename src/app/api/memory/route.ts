import { NextRequest, NextResponse } from "next/server";
import MemoryClient from "mem0ai";

export async function POST(req: NextRequest) {
  try {
    const { company, notes } = await req.json();

    if (!company || !notes) {
      return NextResponse.json(
        { error: "Company and notes are required" },
        { status: 400 }
      );
    }

    const mem0 = new MemoryClient(process.env.MEM0_API_KEY!);

    await mem0.add(
      [{ role: "user", content: `Meeting notes for ${company}: ${notes}` }],
      { user_id: "user_1", metadata: { company } }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Memory save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
