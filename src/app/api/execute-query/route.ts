import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { DatabaseConnection } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { connection, query } = await request.json();

    if (!connection || !query) {
      return NextResponse.json(
        { success: false, error: "Missing connection or query" },
        { status: 400 }
      );
    }

    // Execute the query
    const result = await executeQuery(connection, query);

    return NextResponse.json({
      success: true,
      result,
      query,
    });
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute query",
      },
      { status: 500 }
    );
  }
}
