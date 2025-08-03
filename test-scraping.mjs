import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testScraping() {
  console.log("🧪 Testing Community Scraping...");

  const testUrls = [
    "https://slofile.com",
    "https://slack.com/community",
    "https://github.com/slackhq",
    "https://www.reddit.com/r/Slack/",
    "https://www.producthunt.com/topics/slack",
  ];

  for (const url of testUrls) {
    console.log(`\n🔍 Testing scraping: ${url}`);

    try {
      const response = await fetch(
        "http://localhost:3000/api/scrape-community",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Scraping successful!");

        if (Array.isArray(result.data)) {
          console.log(`📊 Found ${result.data.length} communities:`);
          result.data.forEach((community, index) => {
            console.log(`  ${index + 1}. ${community.name}`);
            console.log(
              `     Description: ${community.description?.substring(0, 100)}...`
            );
            console.log(`     Invite URL: ${community.inviteUrl || "N/A"}`);
          });
        } else {
          console.log("📝 Name:", result.data?.name || "N/A");
          console.log(
            "📄 Description:",
            result.data?.description?.substring(0, 100) + "..." || "N/A"
          );
          console.log("🏷️ Tags:", result.data?.tags || "N/A");
          console.log("🔗 Invite URL:", result.data?.inviteUrl || "N/A");
        }
      } else {
        const error = await response.json();
        console.log("❌ Scraping failed:", error.error || "Unknown error");
      }
    } catch (error) {
      console.log("❌ Error making scraping request:", error.message);
    }
  }

  console.log("\n🎉 Scraping test completed!");
}

testScraping();
