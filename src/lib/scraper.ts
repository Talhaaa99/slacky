import * as cheerio from 'cheerio'

export interface ScrapedCommunity {
  name: string
  description: string
  tags: string[]
  inviteUrl?: string
  website?: string
  logoUrl?: string
  sourcePage: string
}

export async function scrapeCommunityPage(url: string): Promise<ScrapedCommunity> {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Extract basic information
    const name = extractName($)
    const description = extractDescription($)
    const tags = extractTags($)
    const inviteUrl = extractInviteUrl($, url)
    const logoUrl = extractLogoUrl($, url)
    
    return {
      name,
      description,
      tags,
      inviteUrl,
      website: url,
      logoUrl,
      sourcePage: url
    }
  } catch (error) {
    console.error('Error scraping community page:', error)
    throw new Error('Failed to scrape community page')
  }
}

function extractName($: cheerio.CheerioAPI): string {
  // Try multiple selectors for the community name
  const selectors = [
    'h1',
    '.community-name',
    '.title',
    '[property="og:title"]',
    'title'
  ]
  
  for (const selector of selectors) {
    const element = $(selector).first()
    if (element.length > 0) {
      const text = element.text().trim()
      if (text && text.length > 0) {
        return text
      }
    }
  }
  
  return 'Unknown Community'
}

function extractDescription($: cheerio.CheerioAPI): string {
  // Try multiple selectors for the description
  const selectors = [
    '[property="og:description"]',
    'meta[name="description"]',
    '.description',
    '.community-description',
    'p'
  ]
  
  for (const selector of selectors) {
    const element = $(selector).first()
    if (element.length > 0) {
      let text = ''
      if (selector.includes('meta')) {
        text = element.attr('content') || ''
      } else {
        text = element.text().trim()
      }
      if (text && text.length > 0) {
        return text
      }
    }
  }
  
  return 'No description available'
}

function extractTags($: cheerio.CheerioAPI): string[] {
  const tags: string[] = []
  
  // Look for common tag patterns
  const tagSelectors = [
    '.tag',
    '.tags span',
    '.category',
    '[data-tag]'
  ]
  
  for (const selector of tagSelectors) {
    $(selector).each((_, element) => {
      const text = $(element).text().trim()
      if (text && text.length > 0) {
        tags.push(text)
      }
    })
  }
  
  // Also try to extract from meta keywords
  const keywords = $('meta[name="keywords"]').attr('content')
  if (keywords) {
    const keywordTags = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
    tags.push(...keywordTags)
  }
  
  return [...new Set(tags)] // Remove duplicates
}

function extractInviteUrl($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  // Look for Slack invite links
  const inviteSelectors = [
    'a[href*="slack.com/invite"]',
    'a[href*="slack.com/join"]',
    'a[href*="slack.com/"]',
    '.invite-link',
    '.slack-invite'
  ]
  
  for (const selector of inviteSelectors) {
    const element = $(selector).first()
    if (element.length > 0) {
      const href = element.attr('href')
      if (href) {
        return href.startsWith('http') ? href : new URL(href, baseUrl).href
      }
    }
  }
  
  return undefined
}

function extractLogoUrl($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  // Look for logo images
  const logoSelectors = [
    '[property="og:image"]',
    '.logo img',
    '.community-logo img',
    'img[alt*="logo"]',
    'img[alt*="Logo"]'
  ]
  
  for (const selector of logoSelectors) {
    const element = $(selector).first()
    if (element.length > 0) {
      let src = ''
      if (selector.includes('og:image')) {
        src = element.attr('content') || ''
      } else {
        src = element.attr('src') || ''
      }
      if (src) {
        return src.startsWith('http') ? src : new URL(src, baseUrl).href
      }
    }
  }
  
  return undefined
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
} 