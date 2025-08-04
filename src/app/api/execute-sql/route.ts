import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to serialize BigInt values
function serializeResult(result: any): any {
  if (result === null || result === undefined) {
    return result;
  }

  if (typeof result === "bigint") {
    return result.toString();
  }

  if (Array.isArray(result)) {
    return result.map(serializeResult);
  }

  if (typeof result === "object") {
    const serialized: any = {};
    for (const [key, value] of Object.entries(result)) {
      serialized[key] = serializeResult(value);
    }
    return serialized;
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    // Additional security check - only allow SELECT statements
    if (!query.toLowerCase().trim().startsWith("select")) {
      return NextResponse.json(
        {
          error: "Only SELECT queries are allowed for security reasons",
        },
        { status: 400 }
      );
    }

    // Execute the query using Prisma's $queryRaw
    const result = await prisma.$queryRawUnsafe(query);

    // Serialize the result to handle BigInt values
    const serializedResult = serializeResult(result);

    return NextResponse.json({
      result: serializedResult,
      query,
    });
  } catch (error) {
    console.error("Error executing SQL:", error);
    return NextResponse.json(
      {
        error: "Failed to execute SQL query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
