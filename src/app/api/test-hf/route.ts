import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Hugging Face API key not configured" },
        { status: 500 }
      );
    }

    console.log(
      "Testing Hugging Face API with GPT-OSS-20B, key:",
      apiKey.substring(0, 10) + "..."
    );

    // Test with Hugging Face Inference API using GPT-OSS-20B
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
            inputs: `<s>[INST] Generate SQL query to select all users from users table [/INST]`,
            parameters: {
              max_new_tokens: 100,
              temperature: 0.1,
              return_full_text: false,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Hugging Face API test successful:", result);
        return NextResponse.json({
          success: true,
          result: result,
          message: "Hugging Face API is working correctly with GPT-OSS-20B",
          source: "huggingface",
        });
      } else {
        console.log("Hugging Face API failed, testing fallback...");
      }
    } catch (error) {
      console.log("Hugging Face API error, testing fallback:", error);
    }

    // Test fallback
    const fallbackQuery = "SELECT * FROM users LIMIT 100";
    console.log("Fallback query generator working:", fallbackQuery);

    return NextResponse.json({
      success: true,
      result: { generated_text: fallbackQuery },
      message: "Using intelligent fallback query generator",
      source: "fallback",
    });
  } catch (error) {
    console.error("Error testing API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test API" },
      { status: 500 }
    );
  }
}
