"use server";

import { prisma } from "./db";
import { generateEmbedding, stringifyEmbedding } from "./free-ai";
import {
  scrapeCommunityPage,
  scrapeCommunityDirectory,
  validateUrl,
  sanitizeUrl,
} from "./scraper";
import { revalidatePath } from "next/cache";

export type CommunityFormData = {
  name: string;
  description: string;
  tags: string[];
  category: string;
  inviteUrl: string;
  website?: string;
  logoUrl?: string;
  sourcePage?: string;
};

export async function addCommunity(data: CommunityFormData) {
  try {
    const embeddingText = `${data.name} ${data.description} ${data.tags.join(
      " "
    )}`;
    const embedding = await generateEmbedding(embeddingText);

    const community = await prisma.slackCommunity.create({
      data: {
        name: data.name,
        description: data.description,
        tags: data.tags.join(","),
        category: data.category,
        inviteUrl: data.inviteUrl,
        website: data.website,
        logoUrl: data.logoUrl,
        sourcePage: data.sourcePage,
        embedding: stringifyEmbedding(embedding.embedding),
      },
    });

    revalidatePath("/");
    return { success: true, data: community };
  } catch (error) {
    console.error("Error adding community:", error);
    return { success: false, error: "Failed to add community" };
  }
}

export async function scrapeAndAddCommunity(url: string) {
  try {
    // Clean the URL first
    const cleanUrl = url.trim().replace(/\s+/g, "");

    if (!validateUrl(cleanUrl)) {
      return { success: false, error: "Invalid URL provided" };
    }

    const sanitizedUrl = sanitizeUrl(cleanUrl);

    // Try to scrape as a directory first
    try {
      const communities = await scrapeCommunityDirectory(sanitizedUrl);

      if (communities.length > 0) {
        // Add all found communities
        const addedCommunities = [];

        for (const scrapedData of communities) {
          try {
            const embeddingText = `${scrapedData.name} ${
              scrapedData.description
            } ${scrapedData.tags.join(" ")}`;
            const embedding = await generateEmbedding(embeddingText);

            const community = await prisma.slackCommunity.create({
              data: {
                name: scrapedData.name,
                description: scrapedData.description,
                tags: scrapedData.tags.join(","),
                category: "Technology", // Default category
                inviteUrl: scrapedData.inviteUrl || "",
                website: scrapedData.website,
                logoUrl: scrapedData.logoUrl,
                sourcePage: scrapedData.sourcePage,
                embedding: stringifyEmbedding(embedding.embedding),
              },
            });

            addedCommunities.push(community);
          } catch (error) {
            console.error(`Error adding community ${scrapedData.name}:`, error);
          }
        }

        revalidatePath("/");
        return {
          success: true,
          data: addedCommunities,
          message: `Successfully scraped and added ${addedCommunities.length} communities`,
        };
      }
    } catch (error) {
      console.log("Directory scraping failed, trying single page scraping");
    }

    // Fallback to single page scraping
    const scrapedData = await scrapeCommunityPage(sanitizedUrl);

    // Generate embedding for the scraped community
    const embeddingText = `${scrapedData.name} ${
      scrapedData.description
    } ${scrapedData.tags.join(" ")}`;
    const embedding = await generateEmbedding(embeddingText);

    const community = await prisma.slackCommunity.create({
      data: {
        name: scrapedData.name,
        description: scrapedData.description,
        tags: scrapedData.tags.join(","),
        category: "Technology", // Default category, can be updated later
        inviteUrl: scrapedData.inviteUrl || "",
        website: scrapedData.website,
        logoUrl: scrapedData.logoUrl,
        sourcePage: scrapedData.sourcePage,
        embedding: stringifyEmbedding(embedding.embedding),
      },
    });

    revalidatePath("/");
    return { success: true, data: community };
  } catch (error) {
    console.error("Error scraping and adding community:", error);
    return { success: false, error: "Failed to scrape community page" };
  }
}

export async function getCommunities(
  search?: string,
  category?: string,
  tags?: string[]
) {
  try {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        contains: tags.join(","),
        mode: "insensitive",
      };
    }

    const communities = await prisma.slackCommunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return communities.map((community) => ({
      ...community,
      tags: community.tags.split(",").filter(Boolean),
    }));
  } catch (error) {
    console.error("Error fetching communities:", error);
    return [];
  }
}

export async function agenticSearchCommunities(query: string) {
  try {
    const { agenticSearch } = await import("./agentic-search");
    return await agenticSearch(query);
  } catch (error) {
    console.error("Error in agentic search:", error);
    throw new Error("Failed to perform agentic search");
  }
}

export async function getCommunityById(id: string) {
  try {
    const community = await prisma.slackCommunity.findUnique({
      where: { id },
    });

    if (!community) return null;

    return {
      ...community,
      tags: community.tags.split(",").filter(Boolean),
    };
  } catch (error) {
    console.error("Error fetching community:", error);
    return null;
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.slackCommunity.findMany({
      select: { category: true },
      distinct: ["category"],
    });
    return categories.map((c) => c.category);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getAllTags() {
  try {
    const communities = await prisma.slackCommunity.findMany({
      select: { tags: true },
    });

    const allTags = new Set<string>();
    communities.forEach((community) => {
      const tags = community.tags.split(",").filter(Boolean);
      tags.forEach((tag) => allTags.add(tag.trim()));
    });

    return Array.from(allTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function generateEmbeddingsForExistingCommunities() {
  try {
    const communities = await prisma.slackCommunity.findMany({
      where: { embedding: null },
    });

    for (const community of communities) {
      try {
        const embeddingText = `${community.name} ${community.description} ${community.tags}`;
        const embedding = await generateEmbedding(embeddingText);

        await prisma.slackCommunity.update({
          where: { id: community.id },
          data: { embedding: stringifyEmbedding(embedding.embedding) },
        });

        console.log(`Updated embeddings for: ${community.name}`);
      } catch (error) {
        console.error(
          `Error updating embeddings for ${community.name}:`,
          error
        );
      }
    }

    return {
      success: true,
      message: `Updated embeddings for ${communities.length} communities`,
    };
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return { success: false, error: "Failed to generate embeddings" };
  }
}
