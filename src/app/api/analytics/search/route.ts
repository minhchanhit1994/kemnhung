import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { readAnalytics, writeAnalytics, generateSessionId } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, resultsCount, sessionId } = body

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
    }

    // Get IP from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const data = readAnalytics()

    const newSearchQuery = {
      id: crypto.randomUUID(),
      query: query.trim(),
      resultsCount: typeof resultsCount === 'number' ? resultsCount : 0,
      ip,
      sessionId: sessionId || generateSessionId(),
      createdAt: new Date().toISOString(),
    }

    data.searchQueries.push(newSearchQuery)

    // Keep last 10,000 entries
    if (data.searchQueries.length > 10000) {
      data.searchQueries = data.searchQueries.slice(-10000)
    }

    writeAnalytics(data)

    return NextResponse.json({ success: true, id: newSearchQuery.id })
  } catch (error) {
    console.error('Search tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
