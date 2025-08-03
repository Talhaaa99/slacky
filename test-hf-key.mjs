import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testHuggingFace() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    console.log("❌ HUGGINGFACE_API_KEY not found in environment");
    return;
  }

  console.log("🔑 Testing Hugging Face API key...");
  console.log("📝 API Key (first 10 chars):", apiKey.substring(0, 10) + "...");

  try {
    // Initialize the official client
    const hf = new InferenceClient(apiKey);

    // Test feature extraction (embeddings)
    console.log("🧪 Testing feature extraction...");
    const embedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: "test sentence for embedding",
    });

    console.log(
      "📊 Raw embedding response:",
      typeof embedding,
      Array.isArray(embedding)
    );

    if (embedding && Array.isArray(embedding)) {
      console.log("✅ Hugging Face API working!");
      console.log(`📊 Embedding length: ${embedding.length}`);
      if (embedding[0] && Array.isArray(embedding[0])) {
        console.log(
          `🔢 Sample values: [${embedding[0].slice(0, 5).join(", ")}...]`
        );
      } else {
        console.log("🔢 First embedding:", embedding[0]);
      }
    } else {
      console.log("❌ Unexpected embedding format:", embedding);
    }

    // Test text generation
    console.log("\n🧪 Testing text generation...");
    const textResult = await hf.textGeneration({
      model: "gpt2",
      inputs: "Hello world",
      parameters: {
        max_length: 20,
        temperature: 0.7,
      },
    });

    if (textResult && textResult.generated_text) {
      console.log("✅ Text generation working!");
      console.log(`📝 Generated text: ${textResult.generated_text}`);
    } else {
      console.log("❌ Text generation failed:", textResult);
    }
  } catch (error) {
    console.log("❌ Hugging Face API error:", error.message);
  }
}

testHuggingFace();
