import * as cheerio from "cheerio";

export interface ScrapedCommunity {
  name: string;
  description: string;
  tags: string[];
  inviteUrl?: string;
  website?: string;
  logoUrl?: string;
  sourcePage: string;
}

export async function scrapeCommunityPage(
  url: string
): Promise<ScrapedCommunity> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract basic information
    const name = extractName($);
    const description = extractDescription($);
    const tags = extractTags($);
    const inviteUrl = extractInviteUrl($, url);
    const logoUrl = extractLogoUrl($, url);

    return {
      name,
      description,
      tags,
      inviteUrl,
      website: url,
      logoUrl,
      sourcePage: url,
    };
  } catch (error) {
    console.error("Error scraping community page:", error);
    throw new Error("Failed to scrape community page");
  }
}

// New function to scrape multiple communities from a directory page
export async function scrapeCommunityDirectory(
  url: string
): Promise<ScrapedCommunity[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const communities: ScrapedCommunity[] = [];

    // Look for Slack invite links in the page
    const slackLinks = $(
      'a[href*="slack.com/invite"], a[href*="slack.com/join"]'
    );

    slackLinks.each((index, element) => {
      const $el = $(element);
      const inviteUrl = $el.attr("href");
      const linkText = $el.text().trim();

      // Try to find community name from surrounding context
      const communityName =
        $el
          .closest("div, article, section")
          .find("h1, h2, h3, h4, .title, .name")
          .first()
          .text()
          .trim() ||
        $el
          .closest("div, article, section")
          .find(".description, .desc")
          .first()
          .text()
          .trim() ||
        linkText ||
        `Community ${index + 1}`;

      // Try to find description
      const description =
        $el
          .closest("div, article, section")
          .find(".description, .desc, p")
          .first()
          .text()
          .trim() ||
        $el.closest("div, article, section").find("p").first().text().trim() ||
        "Slack community";

      if (inviteUrl && communityName.length > 2) {
        communities.push({
          name: communityName,
          description: description,
          tags: extractTagsFromText(communityName + " " + description),
          inviteUrl: inviteUrl,
          website: url,
          logoUrl: undefined,
          sourcePage: url,
        });
      }
    });

    // If no communities found with Slack links, try to extract from text content
    if (communities.length === 0) {
      const text = $("body").text();
      const slackInviteRegex = /https:\/\/slack\.com\/invite\/[^\s\)]+/g;
      const matches = text.match(slackInviteRegex) || [];

      matches.forEach((link, index) => {
        communities.push({
          name: `Community ${index + 1}`,
          description: "Community found via Slack invite link",
          tags: ["slack", "community"],
          inviteUrl: link,
          website: url,
          logoUrl: undefined,
          sourcePage: url,
        });
      });
    }

    // Also look for any text that mentions "Slack" or "community" with potential invite links
    const communityText = $("body").text();
    const communityMatches =
      communityText.match(
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Slack|community|group)/gi
      ) || [];

    communityMatches.forEach((match, index) => {
      if (
        !communities.some((c) =>
          c.name.toLowerCase().includes(match.toLowerCase())
        )
      ) {
        communities.push({
          name: match.trim(),
          description: "Community mentioned on page",
          tags: ["slack", "community"],
          inviteUrl: undefined,
          website: url,
          logoUrl: undefined,
          sourcePage: url,
        });
      }
    });

    return communities;
  } catch (error) {
    console.error("Error scraping community directory:", error);
    throw new Error("Failed to scrape community directory");
  }
}

function extractName($: cheerio.CheerioAPI): string {
  // Try multiple selectors for the community name
  const selectors = [
    "h1",
    ".community-name",
    ".title",
    '[property="og:title"]',
    "title",
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const text = element.text().trim();
      if (text && text.length > 0) {
        return text;
      }
    }
  }

  return "Unknown Community";
}

function extractDescription($: cheerio.CheerioAPI): string {
  // Try multiple selectors for the description
  const selectors = [
    '[property="og:description"]',
    'meta[name="description"]',
    ".description",
    ".community-description",
    "p",
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      let text = "";
      if (selector.includes("meta")) {
        text = element.attr("content") || "";
      } else {
        text = element.text().trim();
      }
      if (text && text.length > 0) {
        return text;
      }
    }
  }

  return "No description available";
}

function extractTags($: cheerio.CheerioAPI): string[] {
  const tags: string[] = [];

  // Look for common tag patterns
  const tagSelectors = [".tag", ".tags span", ".category", "[data-tag]"];

  for (const selector of tagSelectors) {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 0) {
        tags.push(text);
      }
    });
  }

  // Also try to extract from meta keywords
  const keywords = $('meta[name="keywords"]').attr("content");
  if (keywords) {
    const keywordTags = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    tags.push(...keywordTags);
  }

  return [...new Set(tags)]; // Remove duplicates
}

function extractTagsFromText(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const techKeywords = [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "data science",
    "startup",
    "entrepreneur",
    "founder",
    "tech",
    "technology",
    "programming",
    "developer",
    "design",
    "ui",
    "ux",
    "product",
    "marketing",
    "business",
    "community",
    "slack",
    "discord",
    "chat",
    "collaboration",
    "networking",
  ];

  return words.filter((word) =>
    techKeywords.some((keyword) => word.includes(keyword))
  );
}

function extractInviteUrl(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string | undefined {
  // Look for Slack invite links
  const inviteSelectors = [
    'a[href*="slack.com/invite"]',
    'a[href*="slack.com/join"]',
    'a[href*="slack.com/"]',
    ".invite-link",
    ".slack-invite",
  ];

  for (const selector of inviteSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const href = element.attr("href");
      if (href) {
        return href.startsWith("http") ? href : new URL(href, baseUrl).href;
      }
    }
  }

  return undefined;
}

function extractLogoUrl(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string | undefined {
  // Look for logo images
  const logoSelectors = [
    '[property="og:image"]',
    ".logo img",
    ".community-logo img",
    'img[alt*="logo"]',
    'img[alt*="Logo"]',
  ];

  for (const selector of logoSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      let src = "";
      if (selector.includes("og:image")) {
        src = element.attr("content") || "";
      } else {
        src = element.attr("src") || "";
      }
      if (src) {
        return src.startsWith("http") ? src : new URL(src, baseUrl).href;
      }
    }
  }

  return undefined;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}
