import { NextRequest, NextResponse } from "next/server";
import {
  testConnection,
  getPostgresSchema,
  getMongoSchema,
} from "@/lib/database";
import { DatabaseConnection } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { connection } = await request.json();

    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Missing connection data" },
        { status: 400 }
      );
    }

    // Test the connection
    const isConnected = await testConnection(connection);

    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: "Connection failed" },
        { status: 400 }
      );
    }

    // Get schema
    let schema;
    if (connection.type === "postgresql") {
      schema = await getPostgresSchema(connection);
    } else if (connection.type === "mongodb") {
      schema = await getMongoSchema(connection);
    }

    return NextResponse.json({
      success: true,
      schema,
    });
  } catch (error) {
    console.error("Error testing connection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
