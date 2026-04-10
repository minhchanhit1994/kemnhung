import { NextRequest, NextResponse } from 'next/server'
import { recordPageView, generateSessionId } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, referrer, userAgent, sessionId } = body

    if (!page) {
      return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    await recordPageView({
      page: page || 'home',
      referrer: referrer || '',
      userAgent: userAgent || '',
      ip,
      sessionId: sessionId || generateSessionId(userAgent),
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Page view tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
