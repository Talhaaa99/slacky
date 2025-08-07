import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, results, userQuestion } = await request.json();

    if (!results || !query) {
      return NextResponse.json(
        { success: false, error: "Query and results are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || process.env.HF_TOKEN;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Hugging Face API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a data analyst assistant. Your job is to analyze SQL query results and provide clear, insightful summaries in natural language.

Instructions:
1. Analyze the query and results to understand what was requested
2. Provide a conversational, insightful summary of the findings
3. Highlight key insights, patterns, or notable data points
4. Use natural language that a business user would understand
5. Be concise but informative
6. If there are interesting patterns or outliers, mention them

Example summaries:
- "I found 15 customers who have placed the most orders. The top customer is John Smith with 23 orders, followed by Sarah Johnson with 19 orders. Most of your frequent customers are from New York and California."
- "Your database contains 1,247 active products across 8 categories. Electronics and Clothing are your largest categories, representing 60% of your inventory."
- "Total revenue for this month is $127,450. This shows a 15% increase compared to the average monthly revenue. The highest revenue came from the Electronics category."

Keep your response to 2-3 sentences that provide genuine insight, not just restating the numbers.`;

    const userPrompt = `User asked: "${userQuestion}"

SQL Query executed:
${query}

Results:
${JSON.stringify(results, null, 2)}

Please provide an insightful summary of these results.`;

    console.log("Generating AI summary for results...");

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
          max_tokens: 300,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Summary generation failed:", errorText);
      
      // Fallback to simple summary
      const count = Array.isArray(results.result) ? results.result.length : 0;
      return NextResponse.json({
        success: true,
        summary: `Found ${count} results for your query.`,
        source: "fallback"
      });
    }

    const result = await response.json();
    const aiSummary = result.choices?.[0]?.message?.content?.trim() || "";

    if (aiSummary && aiSummary.length > 0) {
      console.log("AI Summary generated successfully");
      return NextResponse.json({
        success: true,
        summary: aiSummary,
        source: "ai"
      });
    } else {
      // Fallback to simple summary
      const count = Array.isArray(results.result) ? results.result.length : 0;
      return NextResponse.json({
        success: true,
        summary: `Found ${count} results for your query.`,
        source: "fallback"
      });
    }

  } catch (error) {
    console.error("Error generating summary:", error);
    
    // Fallback to simple summary
    return NextResponse.json({
      success: true,
      summary: "Query executed successfully.",
      source: "fallback"
    });
  }
} 