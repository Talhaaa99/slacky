import { NextRequest, NextResponse } from 'next/server'
import { scrapeAndAddCommunity } from '@/lib/actions'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    const result = await scrapeAndAddCommunity(url)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to scrape community' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in scraping API:', error)
    return NextResponse.json(
      { error: 'Failed to scrape community' },
      { status: 500 }
    )
  }
} 