import type {
  Product,
  RawMaterial,
  MaterialTransaction,
  ProductMaterial,
  ProductionOrder,
  Order,
  OrderItem,
  ShopInfo,
  WasteRecord,
} from '@/lib/types'

export interface DashboardStats {
  totalRawMaterials: number
  lowStockMaterials: { id: string; name: string; currentStock: number; minStock: number; unit: string }[]
  totalProducts: number
  activeProducts: number
  totalProductionOrders: number
  recentProductionOrders: ProductionOrder[]
  totalRevenue: number
  recentOrders: Order[]
  totalCapital: number
  totalProductionCost: number
  totalCogs: number
  totalProfit: number
  totalWasteCost: number
  monthlyFinance: { month: string; revenue: number; capital: number; profit: number }[]
}

export const MATERIAL_UNITS = ['cái', 'gam', 'cm', 'm', 'l', 'cuộn', 'tấm', 'bộ', 'hộp', 'chiếc']

export const PRODUCTION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận hoàn thành',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export interface AnalyticsOverview {
  totalPageViews: number
  todayPageViews: number
  totalProductViews: number
  todayProductViews: number
  totalSearches: number
  uniqueVisitors: number
  todayVisitors: number
}

export interface AnalyticsDailyTraffic {
  date: string
  pageViews: number
  productViews: number
  searches: number
  visitors: number
}

export interface AnalyticsTopProduct {
  productId: string
  productName: string
  views: number
  uniqueViews: number
}

export interface AnalyticsSearchTerm {
  query: string
  count: number
  resultsCount: number
}

export interface AnalyticsActivity {
  time: string
  type: string
  detail: string
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  dailyTraffic: AnalyticsDailyTraffic[]
  topProducts: AnalyticsTopProduct[]
  searchTerms: AnalyticsSearchTerm[]
  recentActivity: AnalyticsActivity[]
}
