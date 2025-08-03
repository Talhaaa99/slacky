import dotenv from "dotenv";
import { execSync } from "child_process";

// Load environment variables
dotenv.config();

async function testAgenticSearch() {
  console.log("🧪 Testing Agentic Search...");

  try {
    // Test the agentic search via the Next.js API
    const queries = [
      "Show me AI and machine learning communities",
      "Find startup and entrepreneur groups",
      "Technology and programming communities",
    ];

    for (const query of queries) {
      console.log(`\n🔍 Testing query: "${query}"`);

      try {
        const response = await fetch(
          "http://localhost:3000/api/agentic-search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log("✅ AI Interpretation:", result.interpretation);
          console.log("📊 Results found:", result.results?.length || 0);
          console.log(
            "🏷️ Suggested filters:",
            result.suggestedFilters?.slice(0, 5) || []
          );

          if (result.results && result.results.length > 0) {
            console.log("🏆 Top result:", result.results[0].name);
            console.log(
              "📈 Similarity score:",
              result.results[0].similarity?.toFixed(3) || "N/A"
            );
            console.log("💭 Reasoning:", result.results[0].reasoning || "N/A");
          }
        } else {
          console.log("❌ API request failed:", response.status);
        }
      } catch (error) {
        console.log("❌ Error making API request:", error.message);
      }
    }

    console.log("\n🎉 Agentic search test completed!");
  } catch (error) {
    console.error("❌ Error testing agentic search:", error);
  }
}

testAgenticSearch();
