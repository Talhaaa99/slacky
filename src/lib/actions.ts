"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";
import { scrapeCommunityPage, validateUrl, sanitizeUrl } from "./scraper";

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
    const community = await prisma.slackCommunity.create({
      data: {
        name: data.name,
        description: data.description,
        tags: data.tags.join(","),
        category: data.category,
        inviteUrl: data.inviteUrl,
        website: data.website,
        logoUrl: data.logoUrl,
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
    if (!validateUrl(url)) {
      return { success: false, error: "Invalid URL provided" };
    }

    const sanitizedUrl = sanitizeUrl(url);
    const scrapedData = await scrapeCommunityPage(sanitizedUrl);

    const community = await prisma.slackCommunity.create({
      data: {
        name: scrapedData.name,
        description: scrapedData.description,
        tags: scrapedData.tags.join(","),
        category: "Technology", // Default category, can be updated later
        inviteUrl: scrapedData.inviteUrl || "",
        website: scrapedData.website,
        logoUrl: scrapedData.logoUrl,
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

// Placeholder for agentic search - will be implemented when OpenAI is available
export async function agenticSearchCommunities(query: string) {
  try {
    // For now, just do a simple text search
    const communities = await getCommunities(query);

    return {
      results: communities.map((community) => ({
        community,
        similarity: 0.8, // Placeholder
        reasoning: `Matched "${query}" in community data`,
      })),
      interpretedQuery: query,
      suggestedFilters: {
        categories: [],
        tags: [],
      },
    };
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

    const allTags = communities
      .flatMap((c) => c.tags.split(","))
      .filter(Boolean)
      .map((tag) => tag.trim());

    return [...new Set(allTags)];
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}
