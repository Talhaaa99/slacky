import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { DatabaseConnection } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { connectionId, query, connection } = await request.json();

    console.log("=== EXECUTE QUERY DEBUG ===");
    console.log("ConnectionId:", connectionId);
    console.log("Connection:", connection);
    console.log("Query:", query);
    console.log("=== END DEBUG ===");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Missing query" },
        { status: 400 }
      );
    }

    // Handle both old format (connection) and new format (connectionId)
    let dbConnection: DatabaseConnection;

    if (connection) {
      // Old format - direct connection object
      dbConnection = connection;
    } else if (connectionId) {
      // New format - need to get connection from somewhere
      // For now, we'll return an error asking for the full connection
      return NextResponse.json(
        {
          success: false,
          error:
            "Connection details required. Please reconnect to the database.",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Missing connection information" },
        { status: 400 }
      );
    }

    // Execute the query
    const result = await executeQuery(dbConnection, query);

    return NextResponse.json({
      success: true,
      result,
      query,
    });
  } catch (error) {
    console.error("Error executing query:", error);

    // Handle specific database errors that might need clarification
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // PostgreSQL errors for missing tables/columns
      if (
        errorMessage.includes("relation") &&
        errorMessage.includes("does not exist")
      ) {
        const relationMatch = error.message.match(
          /relation "([^"]+)" does not exist/
        );
        if (relationMatch) {
          const tableName = relationMatch[1];
          return NextResponse.json(
            {
              success: false,
              error: `Table "${tableName}" does not exist in the database. Please check the available tables in the Schema tab or ask me to clarify which table you meant.`,
              errorType: "TABLE_NOT_FOUND",
              missingTable: tableName,
            },
            { status: 400 }
          );
        }
      }

      if (
        errorMessage.includes("column") &&
        errorMessage.includes("does not exist")
      ) {
        const columnMatch = error.message.match(
          /column "([^"]+)" does not exist/
        );
        if (columnMatch) {
          const columnName = columnMatch[1];
          return NextResponse.json(
            {
              success: false,
              error: `Column "${columnName}" does not exist. Please check the available columns in the Schema tab or ask me to clarify which column you meant.`,
              errorType: "COLUMN_NOT_FOUND",
              missingColumn: columnName,
            },
            { status: 400 }
          );
        }
      }

      if (errorMessage.includes("missing from-clause entry")) {
        const tableMatch = error.message.match(
          /missing FROM-clause entry for table "([^"]+)"/
        );
        if (tableMatch) {
          const tableName = tableMatch[1];
          return NextResponse.json(
            {
              success: false,
              error: `The query references table "${tableName}" but it's not properly included in the FROM clause. This appears to be an incomplete query - please try your question again.`,
              errorType: "INCOMPLETE_QUERY",
              missingFromTable: tableName,
            },
            { status: 400 }
          );
        }
      }

      // MongoDB errors (if needed later)
      if (
        errorMessage.includes("collection") &&
        errorMessage.includes("not found")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Collection not found. Please check the available collections in the Schema tab.",
            errorType: "COLLECTION_NOT_FOUND",
          },
          { status: 400 }
        );
      }
    }

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
