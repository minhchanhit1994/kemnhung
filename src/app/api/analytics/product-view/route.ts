import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { readAnalytics, writeAnalytics, generateSessionId } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productName, userAgent, sessionId } = body

    if (!productId || !productName) {
      return NextResponse.json({ error: 'Missing productId or productName' }, { status: 400 })
    }

    // Get IP from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const data = readAnalytics()

    const newProductView = {
      id: crypto.randomUUID(),
      productId,
      productName,
      userAgent: userAgent || '',
      ip,
      sessionId: sessionId || generateSessionId(userAgent),
      createdAt: new Date().toISOString(),
    }

    data.productViews.push(newProductView)

    // Keep last 10,000 entries
    if (data.productViews.length > 10000) {
      data.productViews = data.productViews.slice(-10000)
    }

    writeAnalytics(data)

    return NextResponse.json({ success: true, id: newProductView.id })
  } catch (error) {
    console.error('Product view tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
