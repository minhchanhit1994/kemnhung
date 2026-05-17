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
import { Order, OrderItem } from '@/lib/types'
import { formatPrice, formatDateShort } from './utils'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from './types'

interface OrdersTabProps {
  orders: (Order & { orderItems?: OrderItem[] })[]
  orderSearchInput: string
  setOrderSearchInput: (val: string) => void
  openOrderDialog: () => void
  viewOrderDetail: (order: Order & { orderItems?: OrderItem[] }) => void
  updateOrderStatus: (id: string, status: string) => void
  saving: boolean
}

const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  orderSearchInput,
  setOrderSearchInput,
  openOrderDialog,
  viewOrderDetail,
  updateOrderStatus,
  saving,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage])

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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-xs text-muted-foreground">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} trong số {filteredOrders.length} đơn hàng
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center px-3 text-xs font-medium">
                  Trang {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default OrdersTab
