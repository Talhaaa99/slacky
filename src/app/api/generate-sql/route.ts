import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Prepare the prompt with database schema context
    const prompt = `You are a SQL expert. Translate the following question into SQL. Only return SQL, no explanations.

Database schema:
${DB_SCHEMA}

Question: ${message}

SQL:`;

    let sqlQuery = "";

    try {
      // Try to use a more reliable model
      const response = await hf.textGeneration({
        model: "microsoft/DialoGPT-medium", // More reliable model
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
      // If the model fails, use fallback logic
    }

    // If no SQL was generated or it doesn't look like SQL, use fallback logic
    if (!sqlQuery || !sqlQuery.toLowerCase().includes("select")) {
      const lowerMessage = message.toLowerCase();

      // Fallback: Create SQL based on common patterns
      if (lowerMessage.includes("count") || lowerMessage.includes("how many")) {
        if (lowerMessage.includes("user")) {
          sqlQuery = "SELECT COUNT(*) FROM users";
          if (
            lowerMessage.includes("week") ||
            lowerMessage.includes("last week")
          ) {
            sqlQuery += " WHERE created_at >= NOW() - INTERVAL '7 days'";
          } else if (
            lowerMessage.includes("month") ||
            lowerMessage.includes("last month")
          ) {
            sqlQuery += " WHERE created_at >= NOW() - INTERVAL '30 days'";
          }
        } else if (lowerMessage.includes("payment")) {
          sqlQuery = "SELECT COUNT(*) FROM payments";
        } else if (lowerMessage.includes("session")) {
          sqlQuery = "SELECT COUNT(*) FROM sessions";
        }
      } else if (
        lowerMessage.includes("payment") ||
        lowerMessage.includes("paying")
      ) {
        if (lowerMessage.includes("top") || lowerMessage.includes("highest")) {
          sqlQuery =
            "SELECT u.name, p.amount FROM payments p JOIN users u ON p.user_id = u.id ORDER BY p.amount DESC LIMIT 5";
        } else {
          sqlQuery = "SELECT * FROM payments ORDER BY amount DESC LIMIT 10";
        }
      } else if (lowerMessage.includes("session")) {
        if (lowerMessage.includes("average") || lowerMessage.includes("avg")) {
          sqlQuery = "SELECT AVG(duration_minutes) FROM sessions";
        } else {
          sqlQuery = "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10";
        }
      } else if (lowerMessage.includes("user")) {
        if (
          lowerMessage.includes("recent") ||
          lowerMessage.includes("latest")
        ) {
          sqlQuery = "SELECT * FROM users ORDER BY created_at DESC LIMIT 10";
        } else {
          sqlQuery = "SELECT * FROM users LIMIT 10";
        }
      } else if (lowerMessage.includes("referral")) {
        sqlQuery = "SELECT * FROM referrals ORDER BY created_at DESC LIMIT 10";
      } else {
        // Default fallback
        sqlQuery = "SELECT * FROM users LIMIT 5";
      }
    }

    // Clean up the SQL query
    sqlQuery = sqlQuery
      .replace(/```sql/g, "")
      .replace(/```/g, "")
      .trim();

    return NextResponse.json({
      query: sqlQuery,
    });
  } catch (error) {
    console.error("Error generating SQL:", error);
    return NextResponse.json(
      {
        error: "Failed to generate SQL query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
