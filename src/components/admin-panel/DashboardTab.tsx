import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  Wallet,
  Calculator,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Hammer,
  FlaskConical,
  Package,
  Ban,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DashboardStats } from './types'
import { formatPrice, formatDateShort } from './utils'
import type { Order, RawMaterial } from '@/lib/types'

interface DashboardTabProps {
  stats: DashboardStats | null
  orders: Order[]
  lowStockMaterials: RawMaterial[]
  viewOrderDetail: (order: Order) => void
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  orders,
  lowStockMaterials,
  viewOrderDetail,
}) => {
  const ORDER_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xác nhận hoàn thành',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }

  const PRODUCTION_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const PRODUCTION_STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ sản xuất',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }

  return (
    <div className="space-y-6">
      {/* Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-forest shadow-sm bg-mint-light/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Tổng doanh thu</p>
                <p className="text-lg font-bold text-forest">{formatPrice(stats?.totalRevenue ?? 0)}</p>
              </div>
              <DollarSign className="w-6 h-6 text-forest-light" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Vốn nhập NL</p>
                <p className="text-lg font-bold text-orange-700">{formatPrice(stats?.totalCapital ?? 0)}</p>
              </div>
              <Wallet className="w-6 h-6 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Giá vốn SP đã bán</p>
                <p className="text-lg font-bold text-blue-700">{formatPrice(stats?.totalCogs ?? 0)}</p>
              </div>
              <Calculator className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Lợi nhuận</p>
                <p className="text-lg font-bold text-purple-700">{formatPrice(stats?.totalProfit ?? 0)}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Chart - Full Width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-forest" />
            Biểu đồ tài chính theo tháng
          </CardTitle>
          <p className="text-xs text-muted-foreground">Doanh thu, vốn nhập, lợi nhuận</p>
        </CardHeader>
        <CardContent className="h-[350px]">
          {(!stats?.monthlyFinance || stats.monthlyFinance.length === 0) ? (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">
              Chưa có dữ liệu thống kê
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyFinance.map(f => ({
                ...f,
                month: f.month.split('-').reverse().join('/')
              }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" name="Doanh thu" fill="#1A6B4F" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="capital" name="Vốn nhập NL" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="profit" name="Lợi nhuận" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 5 Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-teal-500 overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-1">Nguyên liệu</p>
                <p className="text-xl font-bold text-gray-800">{stats?.totalRawMaterials ?? 0}</p>
              </div>
              <FlaskConical className="w-7 h-7 text-teal-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-1">Thành phẩm</p>
                <p className="text-xl font-bold text-gray-800">{stats?.totalProducts ?? 0}</p>
                <p className="text-[10px] text-emerald-600 font-medium">{stats?.activeProducts ?? 0} đang bán</p>
              </div>
              <Package className="w-7 h-7 text-emerald-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-1">Đơn hàng</p>
                <p className="text-xl font-bold text-gray-800">{orders.length}</p>
                <p className="text-[10px] text-purple-600 font-medium">
                  {orders.filter(o => o.status === 'pending').length} chờ xác nhận
                </p>
              </div>
              <ShoppingCart className="w-7 h-7 text-purple-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-1">NL sắp hết</p>
                <p className="text-xl font-bold text-gray-800">{lowStockMaterials.length}</p>
              </div>
              <AlertTriangle className="w-7 h-7 text-rose-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600 overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mb-1">Chi phí hao hụt</p>
                <p className="text-xl font-bold text-red-700">{formatPrice(stats?.totalWasteCost ?? 0)}</p>
              </div>
              <Ban className="w-7 h-7 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert List (Hidden if empty, or keep as a separate notice) */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 hidden lg:block">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1 mr-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Chú ý:
              </span>
              {lowStockMaterials.map((m) => (
                <Badge
                  key={m.id}
                  variant="outline"
                  className="text-[10px] bg-white border-amber-200"
                >
                  {m.name}: {m.currentStock} {m.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders on Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
              Đơn hàng gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng</p>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id} className="cursor-pointer" onClick={() => viewOrderDetail(order)}>
                        <TableCell className="font-medium">{order.customerName}</TableCell>
                        <TableCell className="text-right text-forest font-medium">
                          {formatPrice(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateShort(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Production Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hammer className="w-5 h-5 text-orange-500" />
              SX gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!stats?.recentProductionOrders || stats.recentProductionOrders.length === 0) ? (
              <p className="text-center text-muted-foreground py-8">Chưa có phiếu sản xuất</p>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-center">SL</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentProductionOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.product?.name || '-'}</TableCell>
                        <TableCell className="text-center">{po.quantity}</TableCell>
                        <TableCell>
                          <Badge className={PRODUCTION_STATUS_COLORS[po.status] || ''}>
                            {PRODUCTION_STATUS_LABELS[po.status] || po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateShort(po.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardTab
