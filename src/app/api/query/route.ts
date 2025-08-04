import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { HfInference } from "@huggingface/inference";

const prisma = new PrismaClient();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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

// Database schema for context
const DB_SCHEMA = `
Tables:
- users (id, name, email, created_at, signup_source)
- payments (id, user_id, amount, created_at, status)
- sessions (id, user_id, duration_minutes, created_at, referrer)
- referrals (id, referrer_id, referred_id, created_at, status)
`;

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      userId = "api-user",
      channel = "api",
    } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const startTime = Date.now();

    try {
      // Generate SQL from natural language
      const prompt = `You are a SQL expert. Translate the following question into SQL. Only return SQL, no explanations.

Database schema:
${DB_SCHEMA}

Question: ${query}

SQL:`;

      let sqlQuery = "";

      try {
        const response = await hf.textGeneration({
          model: "gpt2",
          inputs: prompt,
          parameters: {
            max_new_tokens: 128,
            temperature: 0.1,
            do_sample: false,
            return_full_text: false,
          },
        });

        sqlQuery = response.generated_text.trim();
      } catch (modelError) {
        console.log("Model error, using fallback logic:", modelError);
      }

      // If no SQL was generated or it doesn't look like SQL, use fallback logic
      if (!sqlQuery || !sqlQuery.toLowerCase().includes("select")) {
        const lowerQuery = query.toLowerCase();

        // Fallback: Create SQL based on common patterns
        if (lowerQuery.includes("count") || lowerQuery.includes("how many")) {
          if (lowerQuery.includes("user")) {
            sqlQuery = "SELECT COUNT(*) FROM users";
            if (
              lowerQuery.includes("week") ||
              lowerQuery.includes("last week")
            ) {
              sqlQuery += " WHERE created_at >= NOW() - INTERVAL '7 days'";
            } else if (
              lowerQuery.includes("month") ||
              lowerQuery.includes("last month")
            ) {
              sqlQuery += " WHERE created_at >= NOW() - INTERVAL '30 days'";
            }
          } else if (lowerQuery.includes("payment")) {
            sqlQuery = "SELECT COUNT(*) FROM payments";
          } else if (lowerQuery.includes("session")) {
            sqlQuery = "SELECT COUNT(*) FROM sessions";
          }
        } else if (
          lowerQuery.includes("payment") ||
          lowerQuery.includes("paying")
        ) {
          if (lowerQuery.includes("top") || lowerQuery.includes("highest")) {
            sqlQuery =
              "SELECT u.name, p.amount FROM payments p JOIN users u ON p.user_id = u.id ORDER BY p.amount DESC LIMIT 5";
          } else {
            sqlQuery = "SELECT * FROM payments ORDER BY amount DESC LIMIT 10";
          }
        } else if (lowerQuery.includes("session")) {
          if (lowerQuery.includes("average") || lowerQuery.includes("avg")) {
            sqlQuery = "SELECT AVG(duration_minutes) FROM sessions";
          } else {
            sqlQuery =
              "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10";
          }
        } else if (lowerQuery.includes("user")) {
          if (lowerQuery.includes("recent") || lowerQuery.includes("latest")) {
            sqlQuery = "SELECT * FROM users ORDER BY created_at DESC LIMIT 10";
          } else {
            sqlQuery = "SELECT * FROM users LIMIT 10";
          }
        } else {
          // Default fallback
          sqlQuery = "SELECT * FROM users LIMIT 5";
        }
      }

      // Security check - only allow SELECT statements
      if (!sqlQuery.toLowerCase().startsWith("select")) {
        return NextResponse.json(
          {
            error: "Only SELECT queries are allowed for security reasons",
          },
          { status: 400 }
        );
      }

      // Execute the SQL query
      const result = await prisma.$queryRawUnsafe(sqlQuery);

      // Serialize the result to handle BigInt values
      const serializedResult = serializeResult(result);

      const executionTime = Date.now() - startTime;

      // Log the query
      await prisma.queryLog.create({
        data: {
          user: userId,
          channel,
          originalQuery: query,
          generatedSQL: sqlQuery,
          result: serializedResult as unknown,
          executionTime,
        },
      });

      return NextResponse.json({
        success: true,
        originalQuery: query,
        generatedSQL: sqlQuery,
        result: serializedResult,
        executionTime,
      });
    } catch (error) {
      console.error("Error processing query:", error);

      const executionTime = Date.now() - startTime;

      // Log the error
      await prisma.queryLog.create({
        data: {
          user: userId,
          channel,
          originalQuery: query,
          generatedSQL: "",
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error handling query request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
