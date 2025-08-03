import { NextRequest, NextResponse } from "next/server";
import { agenticSearch } from "@/lib/agentic-search";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await agenticSearch(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in agentic search API:", error);
    return NextResponse.json(
      { error: "Failed to perform agentic search" },
      { status: 500 }
    );
  }
}
