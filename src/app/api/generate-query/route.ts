import { NextRequest, NextResponse } from "next/server";

function createSystemPrompt(
  schema: any,
  mapping: any,
  databaseType: string
): string {
  let prompt = `You are a database query assistant. Your job is to convert natural language questions into ${
    databaseType === "postgresql" ? "SQL" : "MongoDB"
  } queries.

CRITICAL: Before generating any query, you must analyze the schema carefully and understand the relationships between tables.

Database Schema:
`;

  if (databaseType === "postgresql" && schema?.tables) {
    schema.tables.forEach((table: any) => {
      prompt += `\nTable: ${table.name}\n`;
      if (table.columns && Array.isArray(table.columns)) {
        table.columns.forEach((column: any) => {
          prompt += `  - ${column.name} (${column.type})${
            column.isPrimary ? " [PRIMARY KEY]" : ""
          }\n`;
        });
      }
    });
  } else if (databaseType === "mongodb" && schema?.collections) {
    schema.collections.forEach((collection: any) => {
      prompt += `\nCollection: ${collection.name}\n`;
      if (collection.fields && Array.isArray(collection.fields)) {
        collection.fields.forEach((field: any) => {
          prompt += `  - ${field.name} (${field.type})\n`;
        });
      }
    });
  }

  if (mapping && Object.keys(mapping).length > 0) {
    prompt += `\nTable Mappings:\n`;
    Object.entries(mapping).forEach(([semanticName, actualName]) => {
      prompt += `  - ${semanticName} → ${actualName}\n`;
    });
  }

  prompt += `\nINSTRUCTIONS:
1. ANALYZE the schema first to understand table relationships
2. Look for foreign key patterns (e.g., user_id references users.id)
3. If the query requires joining tables, identify the correct foreign key columns
4. If you're unsure about which table or column to use, respond with "CLARIFICATION_NEEDED" followed by your question
5. Only generate a query if you're confident about the table/column relationships
6. Use proper JOIN syntax with the correct foreign key relationships
7. Use LIMIT clauses to prevent large result sets
8. IMPORTANT: Generate COMPLETE SQL queries including FROM, JOIN, WHERE, GROUP BY, ORDER BY clauses as needed
9. Do NOT truncate or abbreviate the query - provide the full, executable SQL statement

Examples of when to ask for clarification:
- Multiple tables could contain the data (e.g., "orders" and "order_summary")
- Ambiguous column references (e.g., multiple tables with similar columns)
- Complex business logic questions where table meaning isn't clear

Response format:
- If confident: Return ONLY the complete SQL query (no explanations, no comments)
- If uncertain: Return "CLARIFICATION_NEEDED: [your specific question]"

Example complete queries:
- SELECT u.first_name, u.last_name, COUNT(o.id) AS order_count FROM orders o JOIN users u ON o.user_id = u.id GROUP BY u.id, u.first_name, u.last_name ORDER BY order_count DESC LIMIT 10;
- SELECT * FROM products WHERE category = 'Electronics' LIMIT 100;`;

  return prompt;
}

async function analyzeSchemaForQuery(
  userMessage: string,
  schema: any,
  databaseType: string
) {
  // Analyze the user's question and schema to detect potential issues
  const lowerMessage = userMessage.toLowerCase();

  if (databaseType === "postgresql" && schema?.tables) {
    // Check for queries that might need clarification

    // Customer/User queries
    if (lowerMessage.includes("customer") || lowerMessage.includes("user")) {
      const userTables = schema.tables.filter(
        (t: any) =>
          t.name.toLowerCase().includes("user") ||
          t.name.toLowerCase().includes("customer")
      );

      if (userTables.length > 1) {
        return {
          needsClarification: true,
          question: `I found multiple user-related tables: ${userTables
            .map((t: any) => t.name)
            .join(
              ", "
            )}. Which table contains the user data you're looking for?`,
          options: userTables.map((t: any) => t.name),
        };
      }
    }

    // Order queries
    if (lowerMessage.includes("order")) {
      const orderTables = schema.tables.filter((t: any) =>
        t.name.toLowerCase().includes("order")
      );

      if (orderTables.length > 1) {
        return {
          needsClarification: true,
          question: `I found multiple order-related tables: ${orderTables
            .map((t: any) => t.name)
            .join(", ")}. Which table contains the order data you need?`,
          options: orderTables.map((t: any) => t.name),
        };
      }
    }
  }

  return { needsClarification: false };
}

export async function POST(request: NextRequest) {
  try {
    const { message, schema, mapping, databaseType, clarificationResponse } =
      await request.json();

    console.log("=== QUERY GENERATION DEBUG ===");
    console.log("Message:", message);
    console.log("Database type:", databaseType);
    console.log(
      "Schema tables:",
      schema?.tables?.map((t: any) => t.name)
    );
    console.log("Mapping:", mapping);
    console.log("Clarification response:", clarificationResponse);
    console.log("=== END DEBUG ===");

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // First, check if we need clarification (unless this is a clarification response)
    if (!clarificationResponse) {
      const analysis = await analyzeSchemaForQuery(
        message,
        schema,
        databaseType
      );
      if (analysis.needsClarification) {
        return NextResponse.json({
          success: false,
          needsClarification: true,
          question: analysis.question,
          options: analysis.options,
        });
      }
    }

    const apiKey =
      process.env.HUGGING_FACE_API_KEY ||
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_API_KEY ||
      process.env.HF_TOKEN;
    console.log("Environment variables check:");
    console.log(
      "HUGGING_FACE_API_KEY:",
      process.env.HUGGING_FACE_API_KEY ? "exists" : "not found"
    );
    console.log(
      "HUGGINGFACE_API_KEY:",
      process.env.HUGGINGFACE_API_KEY ? "exists" : "not found"
    );
    console.log("HF_API_KEY:", process.env.HF_API_KEY ? "exists" : "not found");
    console.log("HF_TOKEN:", process.env.HF_TOKEN ? "exists" : "not found");

    if (!apiKey) {
      console.error("No Hugging Face API key found in environment variables");
      return NextResponse.json(
        {
          success: false,
          error:
            "Hugging Face API key not configured. Please check your .env file.",
        },
        { status: 500 }
      );
    }

    console.log("API Key available:", apiKey.substring(0, 10) + "...");
    console.log("Attempting Hugging Face Router API...");

    try {
      const systemPrompt = createSystemPrompt(schema, mapping, databaseType);

      // If this is a clarification response, include the context
      let userPrompt = message;
      if (clarificationResponse) {
        userPrompt = `Original question: ${message}\nClarification: User selected "${clarificationResponse.selectedTable}" table.\nNow generate the SQL query using the correct table.`;
      }

      console.log("Making API request to Hugging Face Router...");

      const response = await fetch(
        `https://router.huggingface.co/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:cerebras",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            max_tokens: 500,
            temperature: 0.1,
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const result = await response.json();
        console.log("API response:", result);
        const aiResponse = result.choices?.[0]?.message?.content?.trim() || "";

        // Check if AI is asking for clarification
        if (aiResponse.includes("CLARIFICATION_NEEDED")) {
          const question = aiResponse
            .replace("CLARIFICATION_NEEDED:", "")
            .trim();

          // Extract table options from the schema based on the question
          let options: string[] = [];
          if (question.toLowerCase().includes("table")) {
            if (question.toLowerCase().includes("order")) {
              options =
                schema?.tables
                  ?.filter((t: any) => t.name.toLowerCase().includes("order"))
                  .map((t: any) => t.name) || [];
            } else if (
              question.toLowerCase().includes("user") ||
              question.toLowerCase().includes("customer")
            ) {
              options =
                schema?.tables
                  ?.filter(
                    (t: any) =>
                      t.name.toLowerCase().includes("user") ||
                      t.name.toLowerCase().includes("customer")
                  )
                  .map((t: any) => t.name) || [];
            }
          }

          return NextResponse.json({
            success: false,
            needsClarification: true,
            question: question,
            options: options.length > 0 ? options : undefined,
          });
        }

        // Validate that we got a proper query
        console.log("=== AI RESPONSE VALIDATION ===");
        console.log("Raw AI Response:", JSON.stringify(aiResponse));
        console.log("Response length:", aiResponse?.length);
        console.log(
          "Response includes 'sorry':",
          aiResponse?.toLowerCase().includes("sorry")
        );
        console.log(
          "Response includes 'cannot':",
          aiResponse?.toLowerCase().includes("cannot")
        );
        console.log(
          "Response includes 'clarification':",
          aiResponse?.toLowerCase().includes("clarification")
        );
        console.log("=== END VALIDATION DEBUG ===");

        if (
          aiResponse &&
          aiResponse.trim().length > 0 &&
          !aiResponse.toLowerCase().includes("sorry") &&
          !aiResponse.toLowerCase().includes("cannot") &&
          !aiResponse.toLowerCase().includes("clarification_needed")
        ) {
          console.log("Hugging Face API successful, query:", aiResponse);
          return NextResponse.json({
            success: true,
            query: aiResponse.trim(),
            source: "huggingface",
          });
        } else {
          console.log(
            "Hugging Face API returned invalid response:",
            aiResponse
          );
          return NextResponse.json(
            {
              success: false,
              error: "Failed to generate valid query from AI model",
            },
            { status: 500 }
          );
        }
      } else {
        const errorText = await response.text();
        console.log("Hugging Face API failed with status:", response.status);
        console.log("Error response:", errorText);

        // Try fallback model if first one fails
        if (response.status === 400 || response.status === 503) {
          console.log(
            "Trying fallback model: mistralai/Mistral-7B-Instruct-v0.2..."
          );

          try {
            const fallbackResponse = await fetch(
              `https://router.huggingface.co/v1/chat/completions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "mistralai/Mistral-7B-Instruct-v0.2",
                  messages: [
                    {
                      role: "system",
                      content: systemPrompt,
                    },
                    {
                      role: "user",
                      content: userPrompt,
                    },
                  ],
                  max_tokens: 500,
                  temperature: 0.1,
                }),
              }
            );

            if (fallbackResponse.ok) {
              const fallbackResult = await fallbackResponse.json();
              console.log("Fallback API response:", fallbackResult);
              const aiResponse =
                fallbackResult.choices?.[0]?.message?.content?.trim() || "";

              // Check for clarification in fallback too
              if (aiResponse.includes("CLARIFICATION_NEEDED")) {
                const question = aiResponse
                  .replace("CLARIFICATION_NEEDED:", "")
                  .trim();
                return NextResponse.json({
                  success: false,
                  needsClarification: true,
                  question: question,
                });
              }

              if (
                aiResponse &&
                aiResponse.trim().length > 0 &&
                !aiResponse.toLowerCase().includes("sorry") &&
                !aiResponse.toLowerCase().includes("cannot") &&
                !aiResponse.toLowerCase().includes("clarification_needed")
              ) {
                console.log("Fallback API successful, query:", aiResponse);
                return NextResponse.json({
                  success: true,
                  query: aiResponse.trim(),
                  source: "huggingface-fallback",
                });
              }
            }
          } catch (fallbackError) {
            console.error("Fallback API error:", fallbackError);
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: `Hugging Face API request failed: ${response.status} - ${errorText}`,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Hugging Face API error:", error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to Hugging Face API: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating query:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
