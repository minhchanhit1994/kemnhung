import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Ban,
  Search,
  Loader2,
  Trash2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { RawMaterial, WasteRecord } from '@/lib/types'
import { formatPrice, formatDateShort } from './utils'
import { toast } from 'sonner'

interface WasteTabProps {
  rawMaterials: RawMaterial[]
  wasteRecords: WasteRecord[]
  wasteForm: { note: string }
  setWasteForm: (val: any | ((prev: any) => any)) => void
  wasteSearchInput: string
  setWasteSearchInput: (val: string) => void
  wasteBulkQuantities: Record<string, string>
  setWasteBulkQuantities: (val: any | ((prev: any) => any)) => void
  wasteSaving: boolean
  setWasteSaving: (val: boolean) => void
  fetchAll: () => void
}

const WasteTab: React.FC<WasteTabProps> = ({
  rawMaterials,
  wasteRecords,
  wasteForm,
  setWasteForm,
  wasteSearchInput,
  setWasteSearchInput,
  wasteBulkQuantities,
  setWasteBulkQuantities,
  wasteSaving,
  setWasteSaving,
  fetchAll,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(wasteRecords.length / itemsPerPage)
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return wasteRecords.slice(start, start + itemsPerPage)
  }, [wasteRecords, currentPage])

  const wasteSearch = wasteSearchInput // Using simplified search for now as per refactor pattern

  return (
    <div className="space-y-6">
      {/* Waste Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Ghi nhận hao hụt
          </CardTitle>
          <CardDescription>
            Ghi nhận nguyên liệu hao hụt do sản phẩm bị lỗi. Tồn kho nguyên liệu sẽ tự động được trừ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Note Input (Global for this batch) */}
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-dashed">
              <Label htmlFor="waste-note" className="text-xs font-bold text-red-700 uppercase">Lý do hao hụt (Ghi chú chung)</Label>
              <Input
                id="waste-note"
                placeholder="VD: Sản phẩm lỗi, gãy vỡ, hỏng..."
                className="h-9 bg-white"
                value={wasteForm.note}
                onChange={(e) => setWasteForm(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>

            {/* Quick Picker Table for Waste */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Tìm nguyên liệu bị hao hụt..."
                  className="h-9 text-xs pl-8 bg-white border-red-200 focus-visible:ring-red-500"
                  value={wasteSearchInput}
                  onChange={(e) => setWasteSearchInput(e.target.value)}
                />
              </div>
              
              <div className="bg-white rounded-md border border-red-100 overflow-hidden shadow-sm">
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-red-100">
                  <Table>
                    <TableHeader className="bg-red-50/50 sticky top-0 z-10">
                      <TableRow className="h-8 hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase font-bold px-2 text-red-800">Nguyên liệu</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right px-2 text-red-800">Tồn kho</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold w-28 px-2 text-red-800 text-center">SL Hao hụt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawMaterials
                        .filter(m => m.name.toLowerCase().includes(wasteSearch.toLowerCase()) && m.currentStock > 0)
                        .map((m) => {
                          return (
                            <TableRow key={m.id} className="h-12 hover:bg-red-50/30 transition-colors">
                              <TableCell className="py-1 px-2">
                                <div className="font-medium text-xs text-gray-800">{m.name}</div>
                                <div className="text-[10px] text-muted-foreground">{m.unit}</div>
                              </TableCell>
                              <TableCell className="py-1 px-2 text-[10px] text-right">
                                <Badge variant="outline" className="font-mono text-gray-500 bg-gray-50 border-gray-200">
                                  {m.currentStock}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-1 px-2">
                                <Input
                                  type="number"
                                  step="any"
                                  className="h-8 text-xs px-2 focus-visible:ring-red-500 border-gray-200"
                                  placeholder="0"
                                  value={wasteBulkQuantities[m.id] || ''}
                                  onChange={(e) => setWasteBulkQuantities(prev => ({ ...prev, [m.id]: e.target.value }))}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      {rawMaterials.filter(m => m.name.toLowerCase().includes(wasteSearch.toLowerCase()) && m.currentStock > 0).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-xs text-muted-foreground italic">
                            Không tìm thấy nguyên liệu phù hợp
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 h-10 gap-2 shadow-lg"
                disabled={wasteSaving}
                onClick={async () => {
                  const items = Object.entries(wasteBulkQuantities)
                    .filter(([_, qty]) => Number(qty) > 0)
                  
                  if (items.length === 0) {
                    toast.error('Vui lòng nhập số lượng hao hụt')
                    return
                  }
                  
                  setWasteSaving(true)
                  try {
                    // Process each record
                    let successCount = 0
                    for (const [id, qty] of items) {
                      const res = await fetch('/api/waste-records', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          materialId: id,
                          quantity: parseFloat(qty),
                          note: wasteForm.note || 'Sản phẩm lỗi',
                          createdAt: new Date().toISOString()
                        })
                      })
                      if (res.ok) successCount++
                    }
                    
                    if (successCount > 0) {
                      toast.success(`Đã ghi nhận hao hụt ${successCount} nguyên liệu`)
                      setWasteBulkQuantities({})
                      setWasteSearchInput('')
                      setWasteForm(prev => ({ ...prev, note: 'Sản phẩm lỗi' }))
                      fetchAll()
                    }
                  } catch {
                    toast.error('Lỗi kết nối máy chủ')
                  } finally {
                    setWasteSaving(false)
                  }
                }}
              >
                {wasteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Xác nhận ghi nhận hao hụt ({Object.keys(wasteBulkQuantities).filter(id => Number(wasteBulkQuantities[id]) > 0).length} mục)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waste History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-500" />
            Lịch sử hao hụt
          </CardTitle>
          <CardDescription>Các bản ghi hao hụt nguyên liệu đã xác nhận</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nguyên liệu</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Chi phí</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chưa có bản ghi hao hụt nào
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.material?.name || record.materialId}</TableCell>
                      <TableCell className="text-right">
                        {record.quantity} {record.material?.unit || ''}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatPrice(record.unitPrice)}</TableCell>
                      <TableCell className="text-right font-semibold text-red-700">{formatPrice(record.totalCost)}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{record.note || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDateShort(record.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            if (!confirm('Xóa bản ghi hao hụt này? Tồn kho nguyên liệu sẽ được khôi phục.')) return
                            try {
                              const res = await fetch(`/api/waste-records?id=${record.id}`, { method: 'DELETE' })
                              if (res.ok) fetchAll()
                              else alert('Lỗi xóa bản ghi')
                            } catch {
                              alert('Lỗi kết nối')
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination History */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-xs text-muted-foreground">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, wasteRecords.length)} trong số {wasteRecords.length} bản ghi
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

export default WasteTab
