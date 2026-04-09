import fs from 'fs'
import path from 'path'
import { supabase } from '@/lib/supabase'

let _supabaseReady: boolean | null = null

export function resetSupabaseCache() {
  _supabaseReady = null
}

async function isSupabaseReady(): Promise<boolean> {
  if (_supabaseReady !== null) return _supabaseReady
  if (!supabase) { _supabaseReady = false; return false }
  try {
    const { error } = await supabase.from('page_views').select('id').limit(1)
    _supabaseReady = !error
    return _supabaseReady
  } catch {
    _supabaseReady = false
    return false
  }
}

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
const ANALYTICS_DIR = path.join(process.cwd(), 'data')
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, 'analytics.json')

// Ensure writable data directory
function ensureDataDir() {
  try {
    if (!fs.existsSync(ANALYTICS_DIR)) {
      fs.mkdirSync(ANALYTICS_DIR, { recursive: true })
    }
    // Check if file is writable, if not use /tmp
    try {
      fs.accessSync(ANALYTICS_FILE, fs.constants.W_OK)
    } catch {
      // Try to create or re-create the file
      try {
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({
          pageViews: [],
          productViews: [],
          searchQueries: [],
        }, null, 2), 'utf-8')
      } catch {
        // If still can't write, use /tmp fallback
        const tmpDir = path.join('/tmp', 'kemnhung-analytics')
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true })
        }
        return path.join(tmpDir, 'analytics.json')
      }
    }
    return ANALYTICS_FILE
  } catch {
    return path.join('/tmp', 'kemnhung-analytics', 'analytics.json')
  }
}

// === Supabase Read ===
async function readFromSupabase(): Promise<AnalyticsData | null> {
  if (!(await isSupabaseReady())) return null
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365)

    const [pvRes, prodRes, sqRes] = await Promise.all([
      supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000),
      supabase
        .from('product_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000),
      supabase
        .from('search_queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000),
    ])

    if (pvRes.error || prodRes.error || sqRes.error) {
      return null
    }

    const toCamel = (obj: Record<string, unknown>) => {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
        result[camelKey] = value
      }
      return result as Record<string, unknown>
    }

    return {
      pageViews: (pvRes.data || []).map(toCamel) as PageView[],
      productViews: (prodRes.data || []).map(toCamel) as ProductView[],
      searchQueries: (sqRes.data || []).map(toCamel) as SearchQuery[],
    }
  } catch {
    return null
  }
}

// === Supabase Write ===
async function writeToSupabasePageView(data: Omit<PageView, 'id'>): Promise<boolean> {
  try {
    const snakeData = {
      id: crypto.randomUUID(),
      page: data.page,
      referrer: data.referrer,
      user_agent: data.userAgent,
      ip: data.ip,
      session_id: data.sessionId,
      created_at: data.createdAt,
    }
    const { error } = await supabase.from('page_views').insert(snakeData)
    return !error
  } catch {
    return false
  }
}

async function writeToSupabaseProductView(data: Omit<ProductView, 'id'>): Promise<boolean> {
  try {
    const snakeData = {
      id: crypto.randomUUID(),
      product_id: data.productId,
      product_name: data.productName,
      user_agent: data.userAgent,
      ip: data.ip,
      session_id: data.sessionId,
      created_at: data.createdAt,
    }
    const { error } = await supabase.from('product_views').insert(snakeData)
    return !error
  } catch {
    return false
  }
}

async function writeToSupabaseSearchQuery(data: Omit<SearchQuery, 'id'>): Promise<boolean> {
  try {
    const snakeData = {
      id: crypto.randomUUID(),
      query: data.query,
      results_count: data.resultsCount,
      ip: data.ip,
      session_id: data.sessionId,
      created_at: data.createdAt,
    }
    const { error } = await supabase.from('search_queries').insert(snakeData)
    return !error
  } catch {
    return false
  }
}

// === File Read / Write ===
export function readAnalytics(): AnalyticsData {
  try {
    const filePath = ensureDataDir()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(filePath)) {
      const initial: AnalyticsData = {
        pageViews: [],
        productViews: [],
        searchQueries: [],
      }
      fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as AnalyticsData
  } catch (error) {
    console.error('Error reading analytics.json:', error)
    return { pageViews: [], productViews: [], searchQueries: [] }
  }
}

export function writeAnalytics(data: AnalyticsData): void {
  try {
    const filePath = ensureDataDir()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing analytics.json:', error)
  }
}

// === Unified Read (Supabase first, file fallback) ===
export async function readAnalyticsData(): Promise<AnalyticsData> {
  const supabaseData = await readFromSupabase()
  if (supabaseData) return supabaseData
  return readAnalytics()
}

// === Unified Write ===
export async function recordPageView(data: Omit<PageView, 'id'>): Promise<void> {
  const supabaseOk = await writeToSupabasePageView(data)
  if (supabaseOk) return

  // File fallback
  const fileData = readAnalytics()
  fileData.pageViews.push({
    ...data,
    id: crypto.randomUUID(),
  })
  if (fileData.pageViews.length > 10000) {
    fileData.pageViews = fileData.pageViews.slice(-10000)
  }
  writeAnalytics(fileData)
}

export async function recordProductView(data: Omit<ProductView, 'id'>): Promise<void> {
  const supabaseOk = await writeToSupabaseProductView(data)
  if (supabaseOk) return

  const fileData = readAnalytics()
  fileData.productViews.push({
    ...data,
    id: crypto.randomUUID(),
  })
  if (fileData.productViews.length > 10000) {
    fileData.productViews = fileData.productViews.slice(-10000)
  }
  writeAnalytics(fileData)
}

export async function recordSearchQuery(data: Omit<SearchQuery, 'id'>): Promise<void> {
  const supabaseOk = await writeToSupabaseSearchQuery(data)
  if (supabaseOk) return

  const fileData = readAnalytics()
  fileData.searchQueries.push({
    ...data,
    id: crypto.randomUUID(),
  })
  if (fileData.searchQueries.length > 10000) {
    fileData.searchQueries = fileData.searchQueries.slice(-10000)
  }
  writeAnalytics(fileData)
}

// === Generate Session ID ===
export function generateSessionId(userAgent?: string): string {
  const fingerprint = userAgent || 'unknown'
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
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

  for (const pv of data.pageViews) {
    const dateKey = pv.createdAt.split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) {
      entry.pageViews++
      entry.visitors.add(pv.sessionId)
    }
  }

  for (const pv of data.productViews) {
    const dateKey = pv.createdAt.split('T')[0]
    const entry = dailyMap.get(dateKey)
    if (entry) {
      entry.productViews++
      entry.visitors.add(pv.sessionId)
    }
  }

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

  const periodPageViews = data.pageViews.filter((pv) => new Date(pv.createdAt) >= periodStart)
  const periodProductViews = data.productViews.filter((pv) => new Date(pv.createdAt) >= periodStart)
  const periodSearches = data.searchQueries.filter((sq) => new Date(sq.createdAt) >= periodStart)

  const todayPageViews = data.pageViews.filter((pv) => pv.createdAt.startsWith(todayStr))
  const todayProductViews = data.productViews.filter((pv) => pv.createdAt.startsWith(todayStr))

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

  const dailyTraffic = getDailyStats(data, period)
  const topProducts = getProductRanking(data, 10)
  const searchTerms = getSearchTerms(data, 10)

  const recentActivity: Array<{ type: string; detail: string; time: string }> = []

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

  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

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
    recentActivity: recentActivity.slice(0, 20),
  }
}
