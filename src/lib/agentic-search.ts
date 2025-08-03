import { prisma } from "./db";
import {
  generateQueryEmbedding,
  cosineSimilarity,
  parseEmbedding,
  interpretQuery,
} from "./free-ai";

// Rate limiting helper
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CommunityWithEmbedding {
  id: string;
  name: string;
  description: string;
  tags: string;
  category: string;
  inviteUrl: string;
  website: string | null;
  logoUrl: string | null;
  sourcePage: string | null;
  embedding: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function agenticSearch(query: string) {
  try {
    await delay(100); // Rate limiting

    // Step 1: Interpret the query using AI
    const interpretation = await interpretQuery(query);

    // Step 2: Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Step 3: Get all communities with embeddings
    const communities = (await prisma.slackCommunity.findMany({
      where: {
        embedding: { not: null },
      },
    })) as CommunityWithEmbedding[];

    // Step 4: Calculate similarity scores
    const scoredCommunities = communities
      .map((community) => {
        const communityEmbedding = parseEmbedding(community.embedding || "[]");
        const similarity = cosineSimilarity(queryEmbedding, communityEmbedding);

        return {
          ...community,
          tags: community.tags.split(",").filter(Boolean),
          similarity,
          reasoning: generateReasoning(query, community, similarity),
        };
      })
      .filter((community) => community.similarity > 0.1) // Filter out very low similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 results

    // Step 5: Generate suggested filters from top results
    const suggestedFilters = generateSuggestedFilters(
      scoredCommunities,
      interpretation.suggestedFilters
    );

    return {
      results: scoredCommunities,
      interpretation: interpretation.interpretedQuery,
      suggestedFilters,
      query,
    };
  } catch (error) {
    console.error("Error in agentic search:", error);
    throw new Error("Failed to perform agentic search");
  }
}

function generateReasoning(
  query: string,
  community: CommunityWithEmbedding,
  similarity: number
): string {
  const queryWords = query.toLowerCase().split(/\s+/);
  const communityText =
    `${community.name} ${community.description} ${community.tags}`.toLowerCase();

  const matchingTerms = queryWords.filter(
    (word) => communityText.includes(word) && word.length > 2
  );

  if (matchingTerms.length > 0) {
    return `Matches: ${matchingTerms.join(", ")}`;
  }

  if (similarity > 0.7) {
    return "High semantic similarity";
  } else if (similarity > 0.5) {
    return "Moderate semantic similarity";
  } else {
    return "Low semantic similarity";
  }
}

function generateSuggestedFilters(
  communities: Array<
    CommunityWithEmbedding & {
      tags: string[];
      similarity: number;
      reasoning: string;
    }
  >,
  existingFilters: string[]
): string[] {
  const allTags = new Set<string>();
  const allCategories = new Set<string>();

  communities.forEach((community) => {
    // Add tags
    if (community.tags) {
      community.tags.forEach((tag: string) => allTags.add(tag.trim()));
    }

    // Add category
    if (community.category) {
      allCategories.add(community.category);
    }
  });

  // Combine with existing filters
  const suggestedFilters = [
    ...existingFilters,
    ...Array.from(allTags),
    ...Array.from(allCategories),
  ];

  // Remove duplicates and limit to top 10
  return [...new Set(suggestedFilters)].slice(0, 10);
}
