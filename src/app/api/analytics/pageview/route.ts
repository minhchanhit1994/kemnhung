import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { readAnalytics, writeAnalytics, generateSessionId } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, referrer, userAgent, sessionId } = body

    if (!page) {
      return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 })
    }

    // Get IP from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const data = readAnalytics()

    const newPageView = {
      id: crypto.randomUUID(),
      page: page || 'home',
      referrer: referrer || '',
      userAgent: userAgent || '',
      ip,
      sessionId: sessionId || generateSessionId(userAgent),
      createdAt: new Date().toISOString(),
    }

    data.pageViews.push(newPageView)

    // Keep last 10,000 entries to prevent file from growing too large
    if (data.pageViews.length > 10000) {
      data.pageViews = data.pageViews.slice(-10000)
    }

    writeAnalytics(data)

    return NextResponse.json({ success: true, id: newPageView.id })
  } catch (error) {
    console.error('Page view tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
