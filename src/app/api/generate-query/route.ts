import { NextRequest, NextResponse } from "next/server";

function createSystemPrompt(schema: any, mapping: any, databaseType: string) {
  let prompt = `You are a database assistant that converts natural language queries to ${databaseType.toUpperCase()} queries.

Database Schema:
`;

  // Add null checks for schema
  if (schema) {
    if (
      databaseType === "postgresql" &&
      schema.tables &&
      Array.isArray(schema.tables)
    ) {
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
    } else if (
      databaseType === "mongodb" &&
      schema.collections &&
      Array.isArray(schema.collections)
    ) {
      schema.collections.forEach((collection: any) => {
        prompt += `\nCollection: ${collection.name}\n`;
        if (collection.fields && Array.isArray(collection.fields)) {
          collection.fields.forEach((field: any) => {
            prompt += `  - ${field.name} (${field.type})\n`;
          });
        }
      });
    } else {
      prompt += `\nNo schema information available. Please provide a general ${databaseType.toUpperCase()} query.\n`;
    }
  } else {
    prompt += `\nNo schema information available. Please provide a general ${databaseType.toUpperCase()} query.\n`;
  }

  // Add mapping information if available
  if (mapping && Object.keys(mapping).length > 0) {
    prompt += `\nTable/Collection Mappings:\n`;
    Object.entries(mapping).forEach(([semantic, actual]) => {
      prompt += `  - ${semantic} -> ${actual}\n`;
    });
  }

  prompt += `

Instructions:
1. Generate only the ${databaseType.toUpperCase()} query, no explanations
2. Use proper syntax and formatting
3. Include appropriate WHERE clauses and JOINs when needed
4. For MongoDB, use proper aggregation pipeline syntax
5. Limit results to reasonable amounts (e.g., LIMIT 100 for SQL)

Example outputs:
- For PostgreSQL: SELECT * FROM users WHERE created_at >= '2024-01-01' LIMIT 100
- For MongoDB: db.users.find({created_at: {$gte: new Date("2024-01-01")}}).limit(100)`;

  return prompt;
}

function generateIntelligentQuery(
  message: string,
  schema: any,
  mapping: any,
  databaseType: string
): {
  query: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
} {
  const systemPrompt = createSystemPrompt(schema, mapping, databaseType);

  // Simple keyword-based query generation as fallback
  const lowerMessage = message.toLowerCase();

  // Check if we have multiple tables that could match the query
  const availableTables =
    schema?.tables?.map((t: any) => t.name.toLowerCase()) || [];
  const availableCollections =
    schema?.collections?.map((c: any) => c.name.toLowerCase()) || [];

  if (databaseType === "postgresql") {
    // Check for ambiguous table references
    const userKeywords = ["user", "customer", "client"];
    const orderKeywords = ["order", "purchase", "transaction"];
    const productKeywords = ["product", "item", "goods"];

    const matchingUserTables = availableTables.filter((table: string) =>
      userKeywords.some((keyword) => table.includes(keyword))
    );
    const matchingOrderTables = availableTables.filter((table: string) =>
      orderKeywords.some((keyword) => table.includes(keyword))
    );
    const matchingProductTables = availableTables.filter((table: string) =>
      productKeywords.some((keyword) => table.includes(keyword))
    );

    // If multiple tables match, ask for clarification
    if (lowerMessage.includes("user") || lowerMessage.includes("customer")) {
      if (matchingUserTables.length > 1) {
        return {
          query: "",
          needsClarification: true,
          clarificationQuestion: `I found multiple user-related tables: ${matchingUserTables.join(
            ", "
          )}. Which table contains the user data you're looking for?`,
        };
      }
    }

    if (lowerMessage.includes("order") || lowerMessage.includes("purchase")) {
      if (matchingOrderTables.length > 1) {
        return {
          query: "",
          needsClarification: true,
          clarificationQuestion: `I found multiple order-related tables: ${matchingOrderTables.join(
            ", "
          )}. Which table contains the order data you're looking for?`,
        };
      }
    }

    if (lowerMessage.includes("product") || lowerMessage.includes("item")) {
      if (matchingProductTables.length > 1) {
        return {
          query: "",
          needsClarification: true,
          clarificationQuestion: `I found multiple product-related tables: ${matchingProductTables.join(
            ", "
          )}. Which table contains the product data you're looking for?`,
        };
      }
    }

    // Default query generation
    if (lowerMessage.includes("user") || lowerMessage.includes("customer")) {
      return { query: "SELECT * FROM users LIMIT 100" };
    } else if (
      lowerMessage.includes("order") ||
      lowerMessage.includes("purchase")
    ) {
      return { query: "SELECT * FROM orders LIMIT 100" };
    } else if (lowerMessage.includes("product")) {
      return { query: "SELECT * FROM products LIMIT 100" };
    } else if (
      lowerMessage.includes("revenue") ||
      lowerMessage.includes("sales")
    ) {
      return { query: "SELECT SUM(total_amount) as total_revenue FROM orders" };
    } else if (
      lowerMessage.includes("count") ||
      lowerMessage.includes("total")
    ) {
      return { query: "SELECT COUNT(*) as total_count FROM users" };
    } else {
      return { query: "SELECT * FROM users LIMIT 100" };
    }
  } else if (databaseType === "mongodb") {
    // Similar logic for MongoDB collections
    const userKeywords = ["user", "customer", "client"];
    const orderKeywords = ["order", "purchase", "transaction"];
    const productKeywords = ["product", "item", "goods"];

    const matchingUserCollections = availableCollections.filter(
      (collection: string) =>
        userKeywords.some((keyword) => collection.includes(keyword))
    );
    const matchingOrderCollections = availableCollections.filter(
      (collection: string) =>
        orderKeywords.some((keyword) => collection.includes(keyword))
    );
    const matchingProductCollections = availableCollections.filter(
      (collection: string) =>
        productKeywords.some((keyword) => collection.includes(keyword))
    );

    if (lowerMessage.includes("user") || lowerMessage.includes("customer")) {
      if (matchingUserCollections.length > 1) {
        return {
          query: "",
          needsClarification: true,
          clarificationQuestion: `I found multiple user-related collections: ${matchingUserCollections.join(
            ", "
          )}. Which collection contains the user data you're looking for?`,
        };
      }
    }

    if (lowerMessage.includes("order") || lowerMessage.includes("purchase")) {
      if (matchingOrderCollections.length > 1) {
        return {
          query: "",
          needsClarification: true,
          clarificationQuestion: `I found multiple order-related collections: ${matchingOrderCollections.join(
            ", "
          )}. Which collection contains the order data you're looking for?`,
        };
      }
    }

    if (lowerMessage.includes("product") || lowerMessage.includes("item")) {
      if (matchingProductCollections.length > 1) {
        return {
          query: "",
          needsClarification: true,
          clarificationQuestion: `I found multiple product-related collections: ${matchingProductCollections.join(
            ", "
          )}. Which collection contains the product data you're looking for?`,
        };
      }
    }

    // Default query generation
    if (lowerMessage.includes("user") || lowerMessage.includes("customer")) {
      return { query: "db.users.find({}).limit(100)" };
    } else if (
      lowerMessage.includes("order") ||
      lowerMessage.includes("purchase")
    ) {
      return { query: "db.orders.find({}).limit(100)" };
    } else if (lowerMessage.includes("product")) {
      return { query: "db.products.find({}).limit(100)" };
    } else if (
      lowerMessage.includes("revenue") ||
      lowerMessage.includes("sales")
    ) {
      return {
        query:
          'db.orders.aggregate([{$group: {_id: null, total_revenue: {$sum: "$total_amount"}}}])',
      };
    } else if (
      lowerMessage.includes("count") ||
      lowerMessage.includes("total")
    ) {
      return { query: "db.users.countDocuments({})" };
    } else {
      return { query: "db.users.find({}).limit(100)" };
    }
  }

  return {
    query:
      databaseType === "postgresql"
        ? "SELECT * FROM users LIMIT 100"
        : "db.users.find({}).limit(100)",
  };
}

function generateResultSummary(
  result: any,
  query: string,
  databaseType: string
): string {
  if (!result || !Array.isArray(result)) {
    return "No results found for your query.";
  }

  const count = result.length;

  if (count === 0) {
    return "Your query returned no results.";
  }

  // Try to determine what the query is about based on keywords
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("count") || lowerQuery.includes("count(")) {
    return `Found ${count} total records matching your criteria.`;
  }

  if (
    lowerQuery.includes("sum") ||
    lowerQuery.includes("total") ||
    lowerQuery.includes("revenue")
  ) {
    if (result[0] && typeof result[0] === "object") {
      const firstResult = result[0];
      const totalKey = Object.keys(firstResult).find(
        (key) =>
          key.toLowerCase().includes("total") ||
          key.toLowerCase().includes("sum") ||
          key.toLowerCase().includes("revenue")
      );
      if (totalKey) {
        return `Total ${totalKey.replace(/_/g, " ")}: ${firstResult[totalKey]}`;
      }
    }
    return `Found ${count} aggregated results.`;
  }

  if (lowerQuery.includes("user") || lowerQuery.includes("customer")) {
    return `Found ${count} user${count !== 1 ? "s" : ""} in the database.`;
  }

  if (lowerQuery.includes("order") || lowerQuery.includes("purchase")) {
    return `Found ${count} order${count !== 1 ? "s" : ""} in the database.`;
  }

  if (lowerQuery.includes("product") || lowerQuery.includes("item")) {
    return `Found ${count} product${count !== 1 ? "s" : ""} in the database.`;
  }

  // Default summary
  return `Found ${count} record${count !== 1 ? "s" : ""} matching your query.`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, schema, mapping, databaseType } = await request.json();

    // Validate required parameters
    if (!message || !databaseType) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if API key is available
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Hugging Face API key not configured" },
        { status: 500 }
      );
    }

    console.log("API Key available:", apiKey.substring(0, 10) + "...");

    // Create system prompt with schema context
    const systemPrompt = createSystemPrompt(schema, mapping, databaseType);

    console.log("Attempting Hugging Face API with GPT-OSS-20B...");

    // Try Hugging Face API with GPT-OSS-20B model
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/openai/gpt-oss-20b",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `<s>[INST] ${systemPrompt}

User: ${message} [/INST]`,
            parameters: {
              max_new_tokens: 256,
              temperature: 0.1,
              do_sample: true,
              top_p: 0.95,
              return_full_text: false,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Hugging Face API response:", result);

        const generatedQuery = result[0]?.generated_text?.trim();

        if (generatedQuery) {
          return NextResponse.json({
            success: true,
            query: generatedQuery,
            model: "openai/gpt-oss-20b",
            source: "huggingface",
          });
        }
      } else {
        console.log("Hugging Face API failed, using fallback...");
      }
    } catch (error) {
      console.log("Hugging Face API error, using fallback:", error);
    }

    // Fallback to intelligent query generation
    console.log("Using intelligent fallback query generator...");
    const fallbackResult = generateIntelligentQuery(
      message,
      schema,
      mapping,
      databaseType
    );

    // Check if clarification is needed
    if (fallbackResult.needsClarification) {
      return NextResponse.json({
        success: true,
        needsClarification: true,
        clarificationQuestion: fallbackResult.clarificationQuestion,
        model: "intelligent-fallback",
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      query: fallbackResult.query,
      model: "intelligent-fallback",
      source: "fallback",
    });
  } catch (error) {
    console.error("Error generating query:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate query" },
      { status: 500 }
    );
  }
}
