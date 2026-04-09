import fs from 'fs'
import path from 'path'

// === Types ===
export interface PageView {
  id: string
  page: string
  referrer: string
  userAgent: string
  ip: string
  sessionId: string
  createdAt: string
}

export interface ProductView {
  id: string
  productId: string
  productName: string
  userAgent: string
  ip: string
  sessionId: string
  createdAt: string
}

export interface SearchQuery {
  id: string
  query: string
  resultsCount: number
  ip: string
  sessionId: string
  createdAt: string
}

export interface AnalyticsData {
  pageViews: PageView[]
  productViews: ProductView[]
  searchQueries: SearchQuery[]
}

// === File Path ===
const ANALYTICS_FILE = path.join(process.cwd(), 'data', 'analytics.json')

// === Read / Write ===
export function readAnalytics(): AnalyticsData {
  try {
    const dir = path.dirname(ANALYTICS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(ANALYTICS_FILE)) {
      const initial: AnalyticsData = {
        pageViews: [],
        productViews: [],
        searchQueries: [],
      }
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
    const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8')
    return JSON.parse(raw) as AnalyticsData
  } catch (error) {
    console.error('Error reading analytics.json:', error)
    return { pageViews: [], productViews: [], searchQueries: [] }
  }
}

export function writeAnalytics(data: AnalyticsData): void {
  try {
    const dir = path.dirname(ANALYTICS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing analytics.json:', error)
  }
}

// === Generate Session ID ===
export function generateSessionId(userAgent?: string): string {
  const fingerprint = userAgent || 'unknown'
  // Simple hash for session ID
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// === Aggregate Functions ===
export function getDailyStats(
  data: AnalyticsData,
  days: number
): Array<{
  date: string
  pageViews: number
  productViews: number
  searches: number
  visitors: number
}> {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  const dailyMap = new Map<string, {
    pageViews: number
    productViews: number
    searches: number
    visitors: Set<string>
  }>()

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateKey = d.toISOString().split('T')[0]
    dailyMap.set(dateKey, {
      pageViews: 0,
      productViews: 0,
      searches: 0,
      visitors: new Set<string>(),
    })
  }

  // Aggregate page views
  for (const pv of data.pageViews) {
    const dateKey = pv.createdAt.split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) {
      entry.pageViews++
      entry.visitors.add(pv.sessionId)
    }
  }

  // Aggregate product views
  for (const pv of data.productViews) {
    const dateKey = pv.createdAt.split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) {
      entry.productViews++
      entry.visitors.add(pv.sessionId)
    }
  }

  // Aggregate search queries
  for (const sq of data.searchQueries) {
    const dateKey = sq.createdAt.split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) {
      entry.searches++
      entry.visitors.add(sq.sessionId)
    }
  }

  return Array.from(dailyMap.entries()).map(([date, entry]) => ({
    date,
    pageViews: entry.pageViews,
    productViews: entry.productViews,
    searches: entry.searches,
    visitors: entry.visitors.size,
  }))
}

export function getProductRanking(
  data: AnalyticsData,
  limit: number = 10
): Array<{
  productId: string
  productName: string
  views: number
  uniqueViews: number
}> {
  const productMap = new Map<string, { productName: string; views: number; sessions: Set<string> }>()

  for (const pv of data.productViews) {
    const existing = productMap.get(pv.productId)
    if (existing) {
      existing.views++
      existing.sessions.add(pv.sessionId)
    } else {
      productMap.set(pv.productId, {
        productName: pv.productName,
        views: 1,
        sessions: new Set([pv.sessionId]),
      })
    }
  }

  return Array.from(productMap.entries())
    .map(([productId, info]) => ({
      productId,
      productName: info.productName,
      views: info.views,
      uniqueViews: info.sessions.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

export function getSearchTerms(
  data: AnalyticsData,
  limit: number = 10
): Array<{
  query: string
  count: number
  resultsCount: number
}> {
  const searchMap = new Map<string, { count: number; resultsCount: number }>()

  for (const sq of data.searchQueries) {
    const normalized = sq.query.trim().toLowerCase()
    if (!normalized) continue
    const existing = searchMap.get(normalized)
    if (existing) {
      existing.count++
      existing.resultsCount = sq.resultsCount
    } else {
      searchMap.set(normalized, {
        count: 1,
        resultsCount: sq.resultsCount,
      })
    }
  }

  return Array.from(searchMap.entries())
    .map(([query, info]) => ({
      query,
      count: info.count,
      resultsCount: info.resultsCount,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// === Build Stats Response ===
export function buildStatsResponse(data: AnalyticsData, period: number) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const periodStart = new Date(now)
  periodStart.setDate(periodStart.getDate() - period + 1)
  periodStart.setHours(0, 0, 0, 0)

  // Filter by period
  const periodPageViews = data.pageViews.filter((pv) => new Date(pv.createdAt) >= periodStart)
  const periodProductViews = data.productViews.filter((pv) => new Date(pv.createdAt) >= periodStart)
  const periodSearches = data.searchQueries.filter((sq) => new Date(sq.createdAt) >= periodStart)

  const todayPageViews = data.pageViews.filter((pv) => pv.createdAt.startsWith(todayStr))
  const todayProductViews = data.productViews.filter((pv) => pv.createdAt.startsWith(todayStr))

  // Unique visitors (by sessionId)
  const allSessionIds = new Set([
    ...periodPageViews.map((pv) => pv.sessionId),
    ...periodProductViews.map((pv) => pv.sessionId),
    ...periodSearches.map((sq) => sq.sessionId),
  ])

  const todaySessionIds = new Set([
    ...todayPageViews.map((pv) => pv.sessionId),
    ...todayProductViews.map((pv) => pv.sessionId),
    ...data.searchQueries.filter((sq) => sq.createdAt.startsWith(todayStr)).map((sq) => sq.sessionId),
  ])

  // Daily traffic
  const dailyTraffic = getDailyStats(data, period)

  // Top products
  const topProducts = getProductRanking(data, 10)

  // Search terms
  const searchTerms = getSearchTerms(data, 10)

  // Recent activity
  const recentActivity: Array<{ type: string; detail: string; time: string }> = []

  // Collect all events with normalized time
  for (const pv of data.pageViews.slice(-50)) {
    recentActivity.push({
      type: 'pageview',
      detail: `Xem trang: ${pv.page}`,
      time: pv.createdAt,
    })
  }
  for (const pv of data.productViews.slice(-50)) {
    recentActivity.push({
      type: 'productview',
      detail: `Xem sản phẩm: ${pv.productName}`,
      time: pv.createdAt,
    })
  }
  for (const sq of data.searchQueries.slice(-50)) {
    recentActivity.push({
      type: 'search',
      detail: `Tìm kiếm: "${sq.query}"`,
      time: sq.createdAt,
    })
  }

  // Sort by time descending and take top 20
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recentActivityTop = recentActivity.slice(0, 20)

  return {
    overview: {
      totalPageViews: periodPageViews.length,
      todayPageViews: todayPageViews.length,
      totalProductViews: periodProductViews.length,
      todayProductViews: todayProductViews.length,
      totalSearches: periodSearches.length,
      uniqueVisitors: allSessionIds.size,
      todayVisitors: todaySessionIds.size,
    },
    dailyTraffic,
    topProducts,
    searchTerms,
    recentActivity: recentActivityTop,
  }
}
