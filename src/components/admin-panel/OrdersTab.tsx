import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  ClipboardList,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Order, OrderItem, Product, ShopInfo } from '@/lib/types'
import { formatPrice, formatDateShort, numberToVietnameseWords } from './utils'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from './types'
import OrderDialog from './OrderDialog'
import OrderDetailDialog from './OrderDetailDialog'

interface OrdersTabProps {
  orders: (Order & { orderItems?: OrderItem[] })[]
  products: Product[]
  reservedStockMap: Record<string, number>
  shopInfo: ShopInfo | null
  onRefresh: () => void
}

const ITEMS_PER_PAGE = 10

const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  products,
  reservedStockMap,
  shopInfo,
  onRefresh,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [orderSearchInput, setOrderSearchInput] = useState('')
  const [saving, setSaving] = useState(false)

  // === Dialog States ===
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<(Order & { orderItems?: OrderItem[] }) | null>(null)

  // === Form States ===
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  })
  const [orderItems, setOrderItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([])
  const [newOrderItem, setNewOrderItem] = useState({ productId: '', quantity: '' })

  // === Handlers ===
  const openOrderDialog = () => {
    setOrderForm({ customerName: '', customerPhone: '', customerAddress: '', notes: '' })
    setOrderItems([])
    setNewOrderItem({ productId: '', quantity: '' })
    setOrderDialogOpen(true)
  }

  const addOrderItem = () => {
    const product = products.find((p) => p.id === newOrderItem.productId)
    if (!newOrderItem.productId || !newOrderItem.quantity || !product) return
    const qty = Number(newOrderItem.quantity) || 0
    // Check available stock (total - reserved)
    const reserved = reservedStockMap[product.id] || 0
    const available = product.stockQuantity - reserved
    if (qty > available) {
      alert(`Sản phẩm "${product.name}" chỉ còn ${available} sản phẩm khả dụng!`)
      return
    }
    setOrderItems([
      ...orderItems,
      {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
      },
    ])
    setNewOrderItem({ productId: '', quantity: '' })
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const saveOrder = async () => {
    if (orderItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm!')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          customerAddress: orderForm.customerAddress,
          notes: orderForm.notes,
          items: orderItems,
        }),
      })
      if (res.ok) {
        setOrderDialogOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi tạo đơn hàng')
      }
    } catch (error) {
      console.error('Order error:', error)
    } finally {
      setSaving(false)
    }
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

  const viewOrderDetail = (order: Order & { orderItems?: OrderItem[] }) => {
    setSelectedOrder(order)
    setOrderDetailDialogOpen(true)
  }

  // === Print Invoice ===
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

  // === Computed ===
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = orderSearchInput.toLowerCase()
      if (!s) return true
      return (
        o.customerName?.toLowerCase().includes(s) ||
        o.customerPhone?.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s)
      )
    })
  }, [orders, orderSearchInput])

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage])

  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [orderItems])

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1)
  }, [orderSearchInput])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-500" />
                Danh sách đơn hàng
              </CardTitle>
              <CardDescription>{orders.length} đơn hàng</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, SĐT, mã HD..."
                  className="pl-9 w-40 sm:w-56"
                  value={orderSearchInput}
                  onChange={(e) => setOrderSearchInput(e.target.value)}
                />
              </div>
              <Button onClick={openOrderDialog} className="bg-forest hover:bg-forest-dark">
                <Plus className="w-4 h-4 mr-1" />
                Tạo đơn
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="text-center">Số món</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {orderSearchInput ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1 rounded-sm font-semibold select-all" title="Click đúp để copy">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="font-medium">{order.customerName}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{order.customerPhone}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-forest">
                        {formatPrice(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{order.orderItems?.length || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateShort(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => viewOrderDetail(order)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                disabled={saving}
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                title="Xác nhận hoàn thành"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                disabled={saving}
                                onClick={() => {
                                  if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                                    updateOrderStatus(order.id, 'cancelled')
                                  }
                                }}
                                title="Hủy đơn hàng"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-xs text-muted-foreground">
                Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} trong số {filteredOrders.length} đơn hàng
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center px-3 text-xs font-medium">Trang {currentPage} / {totalPages}</div>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Order Creation Dialog === */}
      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        orderItems={orderItems}
        removeOrderItem={removeOrderItem}
        newOrderItem={newOrderItem}
        setNewOrderItem={setNewOrderItem}
        products={products}
        reservedStockMap={reservedStockMap}
        addOrderItem={addOrderItem}
        orderTotal={orderTotal}
        saveOrder={saveOrder}
        saving={saving}
      />

      {/* === Order Detail Dialog === */}
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

export default OrdersTab
