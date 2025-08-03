import { generateEmbedding, interpretQuery } from "./src/lib/free-ai.ts";

async function testFreeAI() {
  console.log("Testing Free AI (Hugging Face) connection...");

  try {
    // Test 1: Embedding generation
    console.log("\n1. Testing embedding generation...");
    const embeddingResult = await generateEmbedding("AI agents and automation");
    console.log(
      "✅ Embedding generated:",
      embeddingResult.embedding.length,
      "dimensions"
    );

    // Test 2: Query interpretation
    console.log("\n2. Testing query interpretation...");
    const interpretedQuery = await interpretQuery(
      "Show me AI agent-focused communities"
    );
    console.log("✅ Query interpreted:", interpretedQuery);

    console.log(
      "\n🎉 Free AI is working! Your app can now use AI features without OpenAI."
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 The app will fall back to simple keyword matching.");
  }
}

testFreeAI();
