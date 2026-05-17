import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FlaskConical,
  LogOut,
  KeyRound,
  Hammer,
  ClipboardList,
  Settings,
  Ban,
  ChartSpline,
  Wrench,
  BookOpen,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  Product,
  RawMaterial,
  MaterialTransaction,
  ProductionOrder,
  Order,
  OrderItem,
  ShopInfo,
  WasteRecord,
} from '@/lib/types'
import BlogAdmin from '@/components/blog-admin'
import WatermarkStudio from '@/components/tools/watermark-studio'

// Sub-components
import { DashboardStats } from './admin-panel/types'
import DashboardTab from './admin-panel/DashboardTab'
import MaterialsTab from './admin-panel/MaterialsTab'
import ProductionTab from './admin-panel/ProductionTab'
import OrdersTab from './admin-panel/OrdersTab'
import WasteTab from './admin-panel/WasteTab'
import AnalyticsTab from './admin-panel/AnalyticsTab'
import SettingsTab from './admin-panel/SettingsTab'

interface AdminPanelProps {
  onBack: () => void
  onLogout: () => void
  username: string
  onChangePassword: () => void
}

export default function AdminPanel({ onBack, onLogout, username, onChangePassword }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  // === Global Lists & Data ===
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([])
  const [orders, setOrders] = useState<(Order & { orderItems?: OrderItem[] })[]>([])
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([])
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [materialsRes, transactionsRes, productsRes, productionRes, dashboardRes, ordersRes, shopInfoRes, wasteRes] = await Promise.all([
        fetch('/api/raw-materials'),
        fetch('/api/material-transactions'),
        fetch('/api/products'),
        fetch('/api/production-orders'),
        fetch('/api/dashboard'),
        fetch('/api/orders'),
        fetch('/api/shop-info'),
        fetch('/api/waste-records').catch(() => null),
      ])
      
      if (materialsRes.ok) setRawMaterials(await materialsRes.json())
      if (transactionsRes.ok) setMaterialTransactions(await transactionsRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (productionRes.ok) setProductionOrders(await productionRes.json())
      if (dashboardRes.ok) setStats(await dashboardRes.json())
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (wasteRes && wasteRes.ok) setWasteRecords(await wasteRes.json())
      if (shopInfoRes.ok) setShopInfo(await shopInfoRes.json())
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // === Computed Global Helpers ===
  const lowStockMaterials = useMemo(
    () => rawMaterials.filter((m) => m.minStock > 0 && m.currentStock <= m.minStock),
    [rawMaterials]
  )

  const reservedStockMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const order of orders) {
      if (order.status !== 'pending' || !order.orderItems) continue
      for (const item of order.orderItems) {
        map[item.productId] = (map[item.productId] || 0) + item.quantity
      }
    }
    return map
  }, [orders])

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* === Admin Header === */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Về trang chủ</span>
            </Button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <h1 className="font-bold text-lg text-forest">Quản trị</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-forest/10 text-forest">
              {username}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onChangePassword} title="Đổi mật khẩu">
              <KeyRound className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={onLogout}
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <ChartSpline className="w-4 h-4" />
              <span className="hidden sm:inline">Thống kê</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Nguyên liệu</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <Hammer className="w-4 h-4" />
              <span className="hidden sm:inline">Thành phẩm</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Đơn hàng</span>
            </TabsTrigger>
            <TabsTrigger value="waste" className="gap-2 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-800">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Hao hụt</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Công cụ</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== Tab: TỔNG QUAN ==================== */}
          <TabsContent value="dashboard">
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={stats}
                orders={orders}
                lowStockMaterials={lowStockMaterials}
                shopInfo={shopInfo}
                onRefresh={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: BLOG ==================== */}
          <TabsContent value="blog">
            {activeTab === 'blog' && <BlogAdmin />}
          </TabsContent>

          {/* ==================== Tab: NGUYÊN LIỆU ==================== */}
          <TabsContent value="materials">
            {activeTab === 'materials' && (
              <MaterialsTab
                rawMaterials={rawMaterials}
                materialTransactions={materialTransactions}
                onRefresh={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: THÀNH PHẨM ==================== */}
          <TabsContent value="production">
            {activeTab === 'production' && (
              <ProductionTab
                products={products}
                productionOrders={productionOrders}
                rawMaterials={rawMaterials}
                reservedStockMap={reservedStockMap}
                onRefresh={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: ĐƠN HÀNG ==================== */}
          <TabsContent value="orders">
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                products={products}
                reservedStockMap={reservedStockMap}
                shopInfo={shopInfo}
                onRefresh={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: HAO HỤT ==================== */}
          <TabsContent value="waste">
            {activeTab === 'waste' && (
              <WasteTab
                rawMaterials={rawMaterials}
                wasteRecords={wasteRecords}
                onRefresh={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: THỐNG KÊ ==================== */}
          <TabsContent value="analytics">
            {activeTab === 'analytics' && <AnalyticsTab />}
          </TabsContent>

          {/* ==================== Tab: CÀI ĐẶT ==================== */}
          <TabsContent value="settings">
            {activeTab === 'settings' && (
              <SettingsTab
                shopInfo={shopInfo}
                onRefresh={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: CÔNG CỤ ==================== */}
          <TabsContent value="tools">
            {activeTab === 'tools' && <WatermarkStudio />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
