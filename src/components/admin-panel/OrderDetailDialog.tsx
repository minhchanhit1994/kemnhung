import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  User,
  Phone,
  MapPin,
  Printer,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Order, OrderItem } from '@/lib/types'
import { formatPrice, formatDate } from './utils'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from './types'

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrder: (Order & { orderItems?: OrderItem[] }) | null
  printInvoice: (order: Order & { orderItems?: OrderItem[] }) => void
  updateOrderStatus: (id: string, status: string) => void
  saving: boolean
}

const OrderDetailDialog: React.FC<OrderDetailDialogProps> = ({
  open,
  onOpenChange,
  selectedOrder,
  printInvoice,
  updateOrderStatus,
  saving,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            Chi tiết đơn hàng
          </DialogTitle>
          <DialogDescription>Mã: {selectedOrder?.id?.substring(0, 8)}...</DialogDescription>
        </DialogHeader>
        {selectedOrder && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={ORDER_STATUS_COLORS[selectedOrder.status] || ''}>
                {ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDate(selectedOrder.createdAt)}</span>
            </div>

            {/* Customer Info */}
            <div className="border rounded-lg p-3 bg-gray-50 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedOrder.customerName}</span>
              </div>
              {selectedOrder.customerPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
              )}
              {selectedOrder.customerAddress && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedOrder.customerAddress}</span>
                </div>
              )}
              {selectedOrder.notes && (
                <p className="text-xs text-muted-foreground mt-1">Ghi chú: {selectedOrder.notes}</p>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Sản phẩm</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedOrder.orderItems || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(item.unitPrice * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-2 p-3 bg-mint-light rounded-lg border border-mint-dark">
                <span className="font-bold text-forest text-lg">
                  Tổng: {formatPrice(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Print Invoice - available for pending & completed orders */}
            {(selectedOrder.status === 'pending' || selectedOrder.status === 'completed') && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-mint-dark text-forest hover:bg-mint-light"
                  onClick={() => printInvoice(selectedOrder)}
                >
                  <Printer className="w-4 h-4" />
                  In hóa đơn
                </Button>
              </div>
            )}

            {/* Complete / Cancel */}
            {selectedOrder.status === 'pending' && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  className="flex-1 bg-forest hover:bg-forest-dark"
                  disabled={saving}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {saving ? 'Đang xử lý...' : 'Xác nhận hoàn thành'}
                </Button>
                <Button
                  variant="destructive"
                  disabled={saving}
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                      updateOrderStatus(selectedOrder.id, 'cancelled')
                    }
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                  {saving ? 'Đang xử lý...' : 'Hủy đơn'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default OrderDetailDialog
