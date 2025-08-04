import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { HfInference } from "@huggingface/inference";

const prisma = new PrismaClient();
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
    const body = await request.json();

    // Handle Slack URL verification
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle Slack events
    if (body.type === "event_callback") {
      const event = body.event;

      // Only process message events in the specified channel
      if (
        event.type === "message" &&
        event.channel === process.env.SLACK_CHANNEL_ID &&
        !event.bot_id && // Ignore bot messages
        !event.thread_ts
      ) {
        // Only respond to main messages, not thread replies

        const startTime = Date.now();

        try {
          // Generate SQL from natural language
          const prompt = `You are a SQL expert. Translate the following question into SQL. Only return SQL, no explanations.

Database schema:
${DB_SCHEMA}

Question: ${event.text}

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
            const lowerMessage = event.text.toLowerCase();

            // Fallback: Create SQL based on common patterns
            if (
              lowerMessage.includes("count") ||
              lowerMessage.includes("how many")
            ) {
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
              if (
                lowerMessage.includes("top") ||
                lowerMessage.includes("highest")
              ) {
                sqlQuery =
                  "SELECT u.name, p.amount FROM payments p JOIN users u ON p.user_id = u.id ORDER BY p.amount DESC LIMIT 5";
              } else {
                sqlQuery =
                  "SELECT * FROM payments ORDER BY amount DESC LIMIT 10";
              }
            } else if (lowerMessage.includes("session")) {
              if (
                lowerMessage.includes("average") ||
                lowerMessage.includes("avg")
              ) {
                sqlQuery = "SELECT AVG(duration_minutes) FROM sessions";
              } else {
                sqlQuery =
                  "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10";
              }
            } else if (lowerMessage.includes("user")) {
              if (
                lowerMessage.includes("recent") ||
                lowerMessage.includes("latest")
              ) {
                sqlQuery =
                  "SELECT * FROM users ORDER BY created_at DESC LIMIT 10";
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
            await postSlackMessage(
              event.channel,
              event.ts,
              "❌ Sorry, I can only execute SELECT queries for security reasons."
            );
            return NextResponse.json({ ok: true });
          }

          // Execute the SQL query
          const result = await prisma.$queryRawUnsafe(sqlQuery);

          // Format the result
          let formattedResult = "";
          if (Array.isArray(result)) {
            if (result.length === 0) {
              formattedResult = "No results found for your query.";
            } else if (result.length === 1 && typeof result[0] === "object") {
              const row = result[0];
              const keys = Object.keys(row);
              if (keys.length === 1) {
                const value = row[keys[0]];
                const keyName = keys[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                formattedResult = `${keyName}: ${value}`;
              } else {
                formattedResult = `Found ${result.length} result(s):\n\n${result.map((item, index) => {
                  const details = Object.entries(item).map(([key, value]) => {
                    const keyName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `• ${keyName}: ${value}`;
                  }).join('\n');
                  return `**Result ${index + 1}:**\n${details}`;
                }).join('\n\n')}`;
              }
            } else {
              formattedResult = `Found ${result.length} results:\n\n${result.map((item, index) => {
                const details = Object.entries(item).map(([key, value]) => {
                  const keyName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return `• ${keyName}: ${value}`;
                }).join('\n');
                return `**Result ${index + 1}:**\n${details}`;
              }).join('\n\n')}`;
            }
          } else {
            formattedResult = `Result: ${JSON.stringify(result)}`;
          }

          const executionTime = Date.now() - startTime;

          // Log the query
          await prisma.queryLog.create({
            data: {
              user: event.user,
              channel: event.channel,
              originalQuery: event.text,
              generatedSQL: sqlQuery,
              result: result as unknown,
              executionTime,
            },
          });

          // Post the result in a thread
          await postSlackMessage(
            event.channel,
            event.ts,
            `✅ Query executed successfully (${executionTime}ms)\n\n${formattedResult}`
          );
        } catch (error) {
          console.error("Error processing Slack message:", error);

          const executionTime = Date.now() - startTime;

          // Log the error
          await prisma.queryLog.create({
            data: {
              user: event.user,
              channel: event.channel,
              originalQuery: event.text,
              generatedSQL: "",
              error: error instanceof Error ? error.message : "Unknown error",
              executionTime,
            },
          });

          await postSlackMessage(
            event.channel,
            event.ts,
            `❌ Sorry, I encountered an error while processing your request: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error handling Slack event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function postSlackMessage(
  channel: string,
  threadTs: string,
  text: string
) {
  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        thread_ts: threadTs,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Failed to post Slack message:", await response.text());
    }
  } catch (error) {
    console.error("Error posting Slack message:", error);
  }
}
