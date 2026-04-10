import { NextRequest, NextResponse } from 'next/server'
import { recordProductView, generateSessionId } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productName, userAgent, sessionId } = body

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    await recordProductView({
      productId,
      productName: productName || '',
      userAgent: userAgent || '',
      ip,
      sessionId: sessionId || generateSessionId(userAgent),
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product view tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
