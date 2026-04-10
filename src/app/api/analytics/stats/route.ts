import { NextRequest, NextResponse } from 'next/server'
import { readAnalyticsData, buildStatsResponse } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = Math.min(Math.max(Number(searchParams.get('period')) || 7, 1), 365)

    const data = await readAnalyticsData()
    const stats = buildStatsResponse(data, period)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Analytics stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
