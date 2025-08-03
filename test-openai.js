const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log("Testing OpenAI connection...");
  console.log(
    "API Key (first 20 chars):",
    process.env.OPENAI_API_KEY?.substring(0, 20)
  );

  try {
    // Test 1: Simple chat completion
    console.log("\n1. Testing chat completion...");
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 10,
    });
    console.log(
      "✅ Chat completion works:",
      chatResponse.choices[0].message.content
    );

    // Test 2: Embeddings
    console.log("\n2. Testing embeddings...");
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "Hello world",
      encoding_format: "float",
    });
    console.log(
      "✅ Embeddings work:",
      embeddingResponse.data[0].embedding.length,
      "dimensions"
    );

    console.log("\n🎉 All tests passed! Your OpenAI setup is working.");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Status:", error.status);
    console.error("Code:", error.code);
    console.error("Type:", error.type);

    if (error.code === "insufficient_quota") {
      console.log("\n💡 Solutions:");
      console.log(
        "1. Check your billing at: https://platform.openai.com/account/billing"
      );
      console.log("2. Make sure you have a payment method on file");
      console.log("3. Check if you have usage limits set");
      console.log("4. Try waiting a few minutes and retry");
    }
  }
}

testOpenAI();
