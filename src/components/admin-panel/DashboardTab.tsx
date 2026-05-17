import React, { useState } from 'react'
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
import { formatPrice, formatDateShort, numberToVietnameseWords } from './utils'
import type { Order, RawMaterial, OrderItem, ShopInfo } from '@/lib/types'
import OrderDetailDialog from './OrderDetailDialog'

interface DashboardTabProps {
  stats: DashboardStats | null
  orders: (Order & { orderItems?: OrderItem[] })[]
  lowStockMaterials: RawMaterial[]
  shopInfo: ShopInfo | null
  onRefresh: () => void
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  orders,
  lowStockMaterials,
  shopInfo,
  onRefresh,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<(Order & { orderItems?: OrderItem[] }) | null>(null)
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const viewOrderDetail = (order: Order & { orderItems?: OrderItem[] }) => {
    setSelectedOrder(order)
    setOrderDetailDialogOpen(true)
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrderDetailDialogOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi cập nhật đơn hàng')
      }
    } catch (error) {
      console.error('Order update error:', error)
    } finally {
      setSaving(false)
    }
  }

  const printInvoice = (order: Order & { orderItems?: OrderItem[] }) => {
    const shopName = shopInfo?.shopName || 'Mộc Đậu Decor'
    const shopPhone = shopInfo?.phone || ''
    const shopAddress = shopInfo?.address || ''
    const now = new Date()
    const invoiceDate = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const invoiceTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const orderId = order.id.substring(0, 8).toUpperCase()
    const items = order.orderItems || []

    const orderDateObj = new Date(order.createdAt)
    const day = String(orderDateObj.getDate()).padStart(2, '0')
    const month = String(orderDateObj.getMonth() + 1).padStart(2, '0')
    const year = String(orderDateObj.getFullYear()).substring(2)
    const dateFormatted = `${day}${month}${year}`
    const defaultFileName = `MocDau_HD${orderId}_${dateFormatted}`

    const htmlContent = `
      <style>
        #print-invoice-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a1a1a;
          padding: 20px;
          background: white;
        }
        .invoice { max-width: 350px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; background: white; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
        .header h1 { font-size: 18px; color: #059669; margin-bottom: 2px; }
        .header p { font-size: 11px; color: #666; }
        .header .shop-info { margin-top: 6px; font-size: 11px; color: #555; }
        .title-row { text-align: center; margin-bottom: 10px; }
        .title-row h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 10px; border: 1px solid #eee; padding: 8px; border-radius: 4px; }
        .info-grid .label { color: #888; }
        .info-grid .value { font-weight: 500; }
        .customer-info { font-size: 11px; margin-bottom: 10px; border: 1px solid #eee; padding: 8px; border-radius: 4px; }
        .customer-info .label { color: #888; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
        th { background: #f0fdf4; color: #059669; padding: 6px 4px; text-align: left; font-weight: 600; border-bottom: 1px solid #ddd; font-size: 10px; }
        td { padding: 5px 4px; border-bottom: 1px dotted #eee; vertical-align: top; }
        td:last-child { text-align: right; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 10px; }
        .total-row .total-label { font-size: 12px; font-weight: 600; color: #059669; }
        .total-row .total-value { font-size: 18px; font-weight: 800; color: #059669; }
        .amount-words { text-align: center; font-size: 11px; font-style: italic; color: #666; margin-bottom: 10px; padding: 6px; background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; }
        .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; }
        .thank-you { text-align: center; font-size: 12px; font-weight: 600; color: #059669; margin-bottom: 8px; }
        
        @media print {
          body > *:not(#print-invoice-container) {
            display: none !important;
          }
          #print-invoice-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
          }
          .invoice {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media screen {
          #print-invoice-container {
            display: none !important;
          }
        }
      </style>
      <div class="invoice">
        <div class="header">
          <h1>${shopName}</h1>
          ${shopAddress ? `<p>${shopAddress}</p>` : ''}
          ${shopPhone ? `<p>ĐT: ${shopPhone}</p>` : ''}
        </div>
        <div class="title-row"><h2>Hóa đơn bán lẻ</h2></div>
        <div class="info-grid">
          <div><span class="label">Mã HD: </span><span class="value">${orderId}</span></div>
          <div><span class="label">Ngày: </span><span class="value">${invoiceDate}</span></div>
          <div><span class="label">Ngày ĐH: </span><span class="value">${orderDate}</span></div>
          <div><span class="label">Giờ: </span><span class="value">${invoiceTime}</span></div>
        </div>
        <div class="customer-info">
          <div><span class="label">Khách hàng: </span><strong>${order.customerName || '—'}</strong></div>
          ${order.customerPhone ? `<div><span class="label">SĐT: </span>${order.customerPhone}</div>` : ''}
          ${order.customerAddress ? `<div><span class="label">Địa chỉ: </span>${order.customerAddress}</div>` : ''}
        </div>
        <table>
          <thead><tr><th>STT</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>TT</th></tr></thead>
          <tbody>
            ${items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.productName}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${new Intl.NumberFormat('vi-VN').format(item.unitPrice)}</td><td style="text-align:right">${new Intl.NumberFormat('vi-VN').format(item.unitPrice * item.quantity)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="total-row">
          <span class="total-label">TỔNG CỘNG:</span>
          <span class="total-value">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
        </div>
        <div class="amount-words">Bằng chữ: ${numberToVietnameseWords(order.totalAmount)}</div>
        <div class="thank-you">Cảm ơn quý khách đã ủng hộ!</div>
        <div class="footer">
          ${shopName} &bull; ${shopPhone || ''}<br>
          Hóa đơn được tạo lúc ${invoiceTime} ngày ${invoiceDate}
        </div>
      </div>
    `

    const originalTitle = document.title
    document.title = defaultFileName

    const printDiv = document.createElement('div')
    printDiv.id = 'print-invoice-container'
    printDiv.innerHTML = htmlContent
    document.body.appendChild(printDiv)

    window.print()

    setTimeout(() => {
      document.body.removeChild(printDiv)
      document.title = originalTitle
    }, 1000)
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

      {/* Financial Chart */}
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

      {lowStockMaterials.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 hidden lg:block">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1 mr-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Chú ý:
              </span>
              {lowStockMaterials.map((m) => (
                <Badge key={m.id} variant="outline" className="text-[10px] bg-white border-amber-200">
                  {m.name}: {m.currentStock} {m.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <OrderDetailDialog
        open={orderDetailDialogOpen}
        onOpenChange={setOrderDetailDialogOpen}
        selectedOrder={selectedOrder}
        printInvoice={printInvoice}
        updateOrderStatus={updateOrderStatus}
        saving={saving}
      />
    </div>
  )
}

export default DashboardTab
