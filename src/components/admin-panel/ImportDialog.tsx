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
import { Search, X, Loader2 } from 'lucide-react'
import { RawMaterial } from '@/lib/types'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importForm: {
    materialId: string
    quantity: string
    totalPrice: string
    source: string
    notes: string
  }
  setImportForm: (form: any | ((prev: any) => any)) => void
  importSearch: string
  setImportSearch: (val: string) => void
  importDropdownOpen: boolean
  setImportDropdownOpen: (open: boolean) => void
  rawMaterials: RawMaterial[]
  saveImport: () => void
  saving: boolean
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  importForm,
  setImportForm,
  importSearch,
  setImportSearch,
  importDropdownOpen,
  setImportDropdownOpen,
  rawMaterials,
  saveImport,
  saving,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nhập kho nguyên liệu</DialogTitle>
          <DialogDescription>Thêm nguyên liệu vào kho, hệ thống tự tính đơn giá trung bình</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Chọn nguyên liệu</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Gõ để tìm nguyên liệu..."
                  value={importForm.materialId
                    ? rawMaterials.find(m => m.id === importForm.materialId)?.name || ''
                    : importSearch
                  }
                  onChange={(e) => {
                    setImportSearch(e.target.value)
                    setImportForm(prev => ({ ...prev, materialId: '' }))
                    setImportDropdownOpen(true)
                  }}
                  onFocus={() => setImportDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setImportDropdownOpen(false), 200)}
                  className="pl-9 pr-8"
                />
                {importForm.materialId && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setImportForm(prev => ({ ...prev, materialId: '' }))
                      setImportSearch('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {importDropdownOpen && !importForm.materialId && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                  {(() => {
                    const q = importSearch.toLowerCase().trim()
                    const filtered = q
                      ? rawMaterials.filter(m => m.name.toLowerCase().includes(q))
                      : rawMaterials
                    if (filtered.length === 0) {
                      return <div className="p-3 text-sm text-muted-foreground text-center">Không tìm thấy nguyên liệu</div>
                    }
                    return filtered.map((m) => (
                      <button
                        key={m.id}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${m.currentStock <= m.minStock && m.minStock > 0 ? 'border-l-2 border-l-orange-400' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setImportForm(prev => ({ ...prev, materialId: m.id }))
                          setImportDropdownOpen(false)
                        }}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {m.currentStock} {m.unit}
                          {m.currentStock <= m.minStock && m.minStock > 0 && <span className="text-orange-500 ml-1">⚠️</span>}
                        </span>
                      </button>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Số lượng</Label>
            <Input
              type="number"
              step="any"
              value={importForm.quantity}
              onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">VD: 100</p>
          </div>
          <div>
            <Label>Tổng tiền (VNĐ)</Label>
            <Input
              type="number"
              step="any"
              value={importForm.totalPrice}
              onChange={(e) => setImportForm({ ...importForm, totalPrice: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">VD: 500000</p>
          </div>
          <div>
            <Label>Nguồn nhập hàng</Label>
            <Input
              value={importForm.source}
              onChange={(e) => setImportForm({ ...importForm, source: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Tên shop, người bán hoặc link sản phẩm để tra cứu lại. VD: Shop ABC trên Shopee</p>
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Textarea
              value={importForm.notes}
              onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Ghi chú (không bắt buộc)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={saveImport} disabled={saving || !importForm.materialId || !importForm.quantity || !importForm.totalPrice} className="bg-forest hover:bg-forest-dark">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
            ) : (
              'Nhập kho'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportDialog
