import { prisma } from "./db";
import {
  generateQueryEmbedding,
  cosineSimilarity,
  parseEmbedding,
} from "./embeddings";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SearchResult {
  community: any;
  similarity: number;
  reasoning: string;
}

export interface AgenticQueryResult {
  results: SearchResult[];
  interpretedQuery: string;
  suggestedFilters: {
    categories: string[];
    tags: string[];
  };
}

export async function agenticSearch(
  query: string,
  limit: number = 10
): Promise<AgenticQueryResult> {
  try {
    // Step 1: Interpret the natural language query
    const interpretedQuery = await interpretQuery(query);

    // Step 2: Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(interpretedQuery);

    // Step 3: Get all communities with embeddings
    const communities = await prisma.slackCommunity.findMany({
      where: {
        embedding: {
          not: null,
        },
      },
    });

    // Step 4: Calculate similarities and rank results
    const results: SearchResult[] = [];

    for (const community of communities) {
      if (!community.embedding) continue;

      const communityEmbedding = parseEmbedding(community.embedding);
      if (communityEmbedding.length === 0) continue;

      const similarity = cosineSimilarity(queryEmbedding, communityEmbedding);

      results.push({
        community: {
          ...community,
          tags: community.tags.split(",").filter(Boolean),
        },
        similarity,
        reasoning: generateReasoning(query, community, similarity),
      });
    }

    // Step 5: Sort by similarity and limit results
    const sortedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Step 6: Generate suggested filters
    const suggestedFilters = await generateSuggestedFilters(
      query,
      sortedResults
    );

    return {
      results: sortedResults,
      interpretedQuery,
      suggestedFilters,
    };
  } catch (error) {
    console.error("Error in agentic search:", error);
    throw new Error("Failed to perform agentic search");
  }
}

async function interpretQuery(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that helps users find Slack communities. 
          Given a natural language query, interpret it to find relevant Slack communities.
          Focus on extracting key topics, technologies, interests, and communities mentioned.
          Return a concise, searchable interpretation of the query.`,
        },
        {
          role: "user",
          content: `Interpret this query for finding Slack communities: "${query}"`,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || query;
  } catch (error) {
    console.error("Error interpreting query:", error);
    return query;
  }
}

function generateReasoning(
  query: string,
  community: any,
  similarity: number
): string {
  const tags = community.tags.split(",").filter(Boolean);
  const category = community.category;

  let reasoning = `This community (${similarity.toFixed(
    2
  )} similarity) matches because:`;

  // Check if query mentions the category
  if (query.toLowerCase().includes(category.toLowerCase())) {
    reasoning += `\n- Category "${category}" matches your query`;
  }

  // Check for tag matches
  const matchingTags = tags.filter((tag) =>
    query.toLowerCase().includes(tag.toLowerCase())
  );

  if (matchingTags.length > 0) {
    reasoning += `\n- Tags "${matchingTags.join(", ")}" are relevant`;
  }

  // Check description relevance
  const descriptionWords = community.description.toLowerCase().split(" ");
  const queryWords = query.toLowerCase().split(" ");
  const commonWords = descriptionWords.filter(
    (word) => queryWords.includes(word) && word.length > 3
  );

  if (commonWords.length > 0) {
    reasoning += `\n- Description contains relevant terms: "${commonWords
      .slice(0, 3)
      .join(", ")}"`;
  }

  return reasoning;
}

async function generateSuggestedFilters(
  query: string,
  results: SearchResult[]
): Promise<{ categories: string[]; tags: string[] }> {
  const categories = new Set<string>();
  const tags = new Set<string>();

  // Extract categories and tags from top results
  results.slice(0, 5).forEach((result) => {
    categories.add(result.community.category);
    result.community.tags.forEach((tag: string) => tags.add(tag.trim()));
  });

  // Try to extract additional filters from the query using AI
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Extract potential Slack community categories and tags from the user query.
          Return only a JSON object with "categories" and "tags" arrays.`,
        },
        {
          role: "user",
          content: `Query: "${query}"`,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const aiFilters = JSON.parse(response.choices[0]?.message?.content || "{}");

    if (aiFilters.categories) {
      aiFilters.categories.forEach((cat: string) => categories.add(cat));
    }
    if (aiFilters.tags) {
      aiFilters.tags.forEach((tag: string) => tags.add(tag));
    }
  } catch (error) {
    console.error("Error generating AI filters:", error);
  }

  return {
    categories: Array.from(categories),
    tags: Array.from(tags),
  };
}
