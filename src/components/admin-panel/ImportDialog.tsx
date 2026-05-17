import React, { useState, useEffect } from 'react'
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
import { Search, X, Loader2, Trash2, Plus, PackageOpen } from 'lucide-react'
import { RawMaterial } from '@/lib/types'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rawMaterials: RawMaterial[]
  saveImport: (items: Array<{ materialId: string; quantity: number; totalPrice: number }>, source: string, notes: string) => Promise<void>
  saving: boolean
}

interface ImportItem {
  materialId: string
  quantity: string
  totalPrice: string
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  rawMaterials,
  saveImport,
  saving,
}) => {
  // Local states for the voucher
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ImportItem[]>([])
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Reset local states when opening
  useEffect(() => {
    if (open) {
      setSource('')
      setNotes('')
      setItems([])
      setSearchQuery('')
      setDropdownOpen(false)
    }
  }, [open])

  // Helper to format price
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  const handleAddItem = (materialId: string) => {
    // Check if already exists
    if (items.some(item => item.materialId === materialId)) {
      return
    }
    // Add default item
    setItems(prev => [...prev, { materialId, quantity: '1', totalPrice: '' }])
    setSearchQuery('')
    setDropdownOpen(false)
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (index: number, field: 'quantity' | 'totalPrice', value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const totalVoucherAmount = items.reduce((sum, item) => {
    const price = parseFloat(item.totalPrice) || 0
    return sum + price
  }, 0)

  const handleSave = () => {
    const formattedItems = items.map(item => ({
      materialId: item.materialId,
      quantity: parseFloat(item.quantity) || 0,
      totalPrice: parseFloat(item.totalPrice) || 0,
    }))
    saveImport(formattedItems, source, notes)
  }

  const isFormValid = items.length > 0 && items.every(item => {
    const q = parseFloat(item.quantity) || 0
    const p = parseFloat(item.totalPrice) || 0
    return q > 0 && p >= 0 && item.totalPrice !== ''
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-forest-dark font-semibold">
            <PackageOpen className="w-5 h-5 text-forest" />
            Lập phiếu nhập kho nguyên liệu
          </DialogTitle>
          <DialogDescription>
            Tạo phiếu nhập nhiều nguyên liệu cùng lúc. Hệ thống sẽ tự động trừ/cộng kho và tính toán lại đơn giá bình quân gia quyền.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Section 1: Thông tin phiếu nhập */}
          <div className="border rounded-lg p-4 bg-gray-50/50 border-forest/10 space-y-3">
            <h3 className="font-semibold text-xs text-forest-dark uppercase tracking-wider">
              Thông tin chung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nguồn nhập hàng *</Label>
                <Input
                  className="h-9 text-xs focus-visible:ring-forest border-forest/20"
                  placeholder="VD: Shopee, Facebook, Nhà cung cấp..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Ghi chú</Label>
                <Input
                  className="h-9 text-xs focus-visible:ring-forest border-forest/20"
                  placeholder="VD: Nhập lô hàng tháng 5, phục vụ sản xuất..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tìm nguyên liệu */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-forest-dark">Thêm nguyên liệu vào phiếu</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Gõ tìm nhanh nguyên liệu để thêm..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="h-9 text-xs pl-8 pr-8 bg-white border-forest/20 focus-visible:ring-forest"
                />
                {searchQuery && (
                  <button
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-forest/10 bg-white shadow-md scrollbar-thin scrollbar-thumb-forest/20">
                  {(() => {
                    const q = searchQuery.toLowerCase().trim()
                    const filtered = q
                      ? rawMaterials.filter(m => m.name.toLowerCase().includes(q))
                      : rawMaterials
                    if (filtered.length === 0) {
                      return <div className="p-3 text-xs text-muted-foreground text-center">Không tìm thấy nguyên liệu</div>
                    }
                    return filtered.map((m) => {
                      const isAdded = items.some(item => item.materialId === m.id)
                      return (
                        <button
                          key={m.id}
                          disabled={isAdded}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${isAdded ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-mint-light/50'}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            if (!isAdded) handleAddItem(m.id)
                          }}
                        >
                          <span className="font-medium text-forest-dark">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                            {m.currentStock} {m.unit} {isAdded ? '(Đã thêm)' : ''}
                          </span>
                        </button>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Danh sách nguyên liệu trong phiếu */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-forest-dark">
              Danh sách nguyên liệu nhập ({items.length})
            </Label>
            {items.length === 0 ? (
              <div className="border border-dashed border-forest/20 rounded-lg p-6 text-center text-xs text-muted-foreground bg-gray-50/30">
                Chưa có nguyên liệu nào được thêm. Hãy gõ tìm kiếm phía trên để lập phiếu!
              </div>
            ) : (
              <div className="border border-forest/10 rounded-lg overflow-hidden bg-white shadow-xs">
                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-forest/20">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0 border-b border-forest/10">
                      <tr className="text-forest-dark font-semibold">
                        <th className="py-2 px-3 text-left">Nguyên liệu</th>
                        <th className="py-2 px-2 text-center w-24">Số lượng</th>
                        <th className="py-2 px-2 text-center w-36">Tổng tiền (VNĐ)</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, idx) => {
                        const mat = rawMaterials.find(m => m.id === item.materialId)
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3">
                              <div className="font-medium text-forest-dark">{mat?.name || 'Nguyên liệu'}</div>
                              <div className="text-[10px] text-muted-foreground">Đơn vị: {mat?.unit || 'cái'}</div>
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                step="any"
                                className="h-7 text-xs px-2 text-center focus-visible:ring-forest border-forest/10 bg-white"
                                placeholder="0"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                step="any"
                                className="h-7 text-xs px-2 text-right focus-visible:ring-forest border-forest/10 bg-white"
                                placeholder="Nhập số tiền..."
                                value={item.totalPrice}
                                onChange={(e) => handleUpdateItem(idx, 'totalPrice', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Tổng quan phiếu */}
          {items.length > 0 && (
            <div className="flex items-center justify-between bg-mint-light/40 border border-mint-dark/20 rounded-lg p-3">
              <span className="font-bold text-[11px] text-forest-dark uppercase tracking-wider">
                Tổng giá trị phiếu nhập:
              </span>
              <span className="font-bold text-forest text-base">
                {formatPrice(totalVoucherAmount)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-forest/10 pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !source || !isFormValid}
            className="bg-forest hover:bg-forest-dark text-xs h-9 px-4 gap-1.5"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Đang lưu...</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Nhập kho</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportDialog
