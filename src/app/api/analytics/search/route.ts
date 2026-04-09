import { NextRequest, NextResponse } from 'next/server'
import { recordSearchQuery, generateSessionId } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, resultsCount, sessionId, userAgent } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    await recordSearchQuery({
      query: query.trim(),
      resultsCount: resultsCount || 0,
      ip,
      sessionId: sessionId || generateSessionId(userAgent),
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Search tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
