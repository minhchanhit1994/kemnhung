import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Package, Trash2, Plus, Save, ShoppingCart } from 'lucide-react'
import { Product } from '@/lib/types'
import { formatPrice } from './utils'

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderForm: {
    customerName: string
    customerPhone: string
    customerAddress: string
    notes: string
  }
  setOrderForm: (form: any | ((prev: any) => any)) => void
  orderItems: any[]
  removeOrderItem: (index: number) => void
  newOrderItem: {
    productId: string
    quantity: string
  }
  setNewOrderItem: (item: any | ((prev: any) => any)) => void
  products: Product[]
  reservedStockMap: Record<string, number>
  addOrderItem: () => void
  orderTotal: number
  saveOrder: () => void
  saving: boolean
}

const OrderDialog: React.FC<OrderDialogProps> = ({
  open,
  onOpenChange,
  orderForm,
  setOrderForm,
  orderItems,
  removeOrderItem,
  newOrderItem,
  setNewOrderItem,
  products,
  reservedStockMap,
  addOrderItem,
  orderTotal,
  saveOrder,
  saving,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng</DialogTitle>
          <DialogDescription>Nhập thông tin khách hàng và chọn sản phẩm</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tên khách hàng *</Label>
                <Input
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">VD: Nguyễn Văn A</p>
              </div>
              <div>
                <Label className="text-xs">Số điện thoại</Label>
                <Input
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">VD: 0901234567</p>
              </div>
            </div>
            <div>
              <Label className="text-xs">Địa chỉ giao hàng</Label>
              <Input
                value={orderForm.customerAddress}
                onChange={(e) => setOrderForm({ ...orderForm, customerAddress: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">VD: Số 1, Đường ABC, Quận X, TP Y</p>
            </div>
            <div>
              <Label className="text-xs">Ghi chú</Label>
              <Textarea
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">Ghi chú đơn hàng (không bắt buộc)</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-forest" />
              Sản phẩm
            </h3>

            {orderItems.length > 0 && (
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white rounded-md p-2 text-sm">
                    <span className="font-medium flex-1">{item.productName}</span>
                    <span className="text-muted-foreground">&times; {item.quantity}</span>
                    <span className="text-muted-foreground">{formatPrice(item.unitPrice)}</span>
                    <span className="font-medium w-28 text-right">{formatPrice(item.unitPrice * item.quantity)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => removeOrderItem(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Sản phẩm</Label>
                <Select
                  value={newOrderItem.productId}
                  onValueChange={(v) => setNewOrderItem({ ...newOrderItem, productId: v })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Chọn sản phẩm..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => p.isActive && p.currentStock > 0)
                      .map((p) => {
                        const reserved = reservedStockMap[p.id] || 0
                        const available = p.currentStock - reserved
                        return (
                          <SelectItem key={p.id} value={p.id} disabled={available <= 0}>
                            {p.name} - {formatPrice(p.price)} (còn: {available})
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-xs">Số lượng</Label>
                <Input
                  type="number"
                  step="any"
                  className="h-9 text-sm"
                  value={newOrderItem.quantity}
                  onChange={(e) => setNewOrderItem({ ...newOrderItem, quantity: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={addOrderItem}
                disabled={!newOrderItem.productId || !newOrderItem.quantity}
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm
              </Button>
            </div>
          </div>

          {/* Order Total */}
          {orderItems.length > 0 && (
            <div className="flex items-center justify-between bg-mint-light border border-mint-dark rounded-lg p-4">
              <span className="font-semibold text-forest-dark">TỔNG TIỀN</span>
              <span className="font-bold text-forest text-xl">{formatPrice(orderTotal)}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={saveOrder}
            disabled={saving || !orderForm.customerName || orderItems.length === 0}
            className="bg-forest hover:bg-forest-dark"
          >
            {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
            <ShoppingCart className="w-4 h-4 mr-1" />
            Tạo đơn hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OrderDialog
