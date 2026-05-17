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
import { FlaskConical, AlertTriangle, Hammer, Save } from 'lucide-react'
import { Product } from '@/lib/types'

interface ProductionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productionForm: {
    productId: string
    quantity: string
    notes: string
  }
  setProductionForm: (form: any | ((prev: any) => any)) => void
  products: Product[]
  selectedProductionRecipe: any[]
  productionStockCheck: {
    materialName: string
    needed: number
    available: number
    unit: string
    sufficient: boolean
  }[]
  saveProductionOrder: () => void
  saving: boolean
}

const ProductionDialog: React.FC<ProductionDialogProps> = ({
  open,
  onOpenChange,
  productionForm,
  setProductionForm,
  products,
  selectedProductionRecipe,
  productionStockCheck,
  saveProductionOrder,
  saving,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sản xuất</DialogTitle>
          <DialogDescription>Tạo phiếu sản xuất, hệ thống tự trừ nguyên liệu và cộng kho thành phẩm</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Chọn sản phẩm</Label>
            <Select value={productionForm.productId} onValueChange={(v) => setProductionForm({ ...productionForm, productId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (còn: {p.stockQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Số lượng sản xuất</Label>
            <Input
              type="number"
              step="any"
              value={productionForm.quantity}
              onChange={(e) => setProductionForm({ ...productionForm, quantity: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">VD: 10</p>
          </div>

          {selectedProductionRecipe.length > 0 && Number(productionForm.quantity) > 0 && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-4 h-4 text-forest" />
                <span className="text-sm font-semibold">Kiểm tra nguyên liệu</span>
              </div>
              <div className="space-y-1">
                {productionStockCheck.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.materialName}</span>
                      <span className="text-muted-foreground">Cần: {item.needed} {item.unit}</span>
                    </div>
                    <span className={item.sufficient ? 'text-forest font-medium' : 'text-red-600 font-medium'}>
                      Hiện có: {item.available} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProductionRecipe.length === 0 && productionForm.productId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Sản phẩm này chưa có công thức nguyên liệu
            </div>
          )}

          <div>
            <Label>Ghi chú</Label>
            <Textarea
              value={productionForm.notes}
              onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Ghi chú (không bắt buộc)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={saveProductionOrder}
            disabled={
              saving ||
              !productionForm.productId ||
              !productionForm.quantity ||
              selectedProductionRecipe.length === 0
            }
            className="bg-forest hover:bg-forest-dark"
          >
            {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
            <Hammer className="w-4 h-4 mr-1" />
            Sản xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProductionDialog
