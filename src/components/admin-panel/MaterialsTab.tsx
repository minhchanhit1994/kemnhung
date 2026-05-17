import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  FlaskConical,
  Plus,
  Search,
  Pencil,
  Trash2,
  History,
  ArrowDownToLine,
} from 'lucide-react'
import { RawMaterial, MaterialTransaction } from '@/lib/types'
import { formatPrice, formatDate } from './utils'
import MaterialDialog from './MaterialDialog'
import ImportDialog from './ImportDialog'

interface MaterialsTabProps {
  rawMaterials: RawMaterial[]
  materialTransactions: MaterialTransaction[]
  onRefresh: () => void
}

const MATERIAL_ITEMS_PER_PAGE = 10
const TX_ITEMS_PER_PAGE = 15

const MaterialsTab: React.FC<MaterialsTabProps> = ({
  rawMaterials,
  materialTransactions,
  onRefresh,
}) => {
  // === Search & Pagination ===
  const [searchInput, setSearchInput] = useState('')
  const [materialPage, setMaterialPage] = useState(1)
  const [txPage, setTxPage] = useState(1)

  // === Material Dialog State ===
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [materialForm, setMaterialForm] = useState({ name: '', unit: 'cái', description: '', minStock: '10' })
  const [saving, setSaving] = useState(false)

  // === Import Dialog State ===
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // === Handlers ===
  const openMaterialDialog = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material)
      setMaterialForm({
        name: material.name,
        unit: material.unit,
        description: material.description,
        minStock: String(material.minStock),
      })
    } else {
      setEditingMaterial(null)
      setMaterialForm({ name: '', unit: 'cái', description: '', minStock: '10' })
    }
    setMaterialDialogOpen(true)
  }

  const saveMaterial = async () => {
    try {
      setSaving(true)
      const url = editingMaterial ? `/api/raw-materials/${editingMaterial.id}` : '/api/raw-materials'
      const method = editingMaterial ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...materialForm, minStock: Number(materialForm.minStock) || 0 }),
      })
      if (res.ok) {
        setMaterialDialogOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi lưu nguyên liệu')
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteMaterial = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) return
    try {
      const res = await fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
      if (res.ok) onRefresh()
      else {
        const err = await res.json()
        alert(err.error || 'Lỗi xóa nguyên liệu')
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const openImportDialog = () => {
    setImportDialogOpen(true)
  }

  const saveImport = async (items: Array<{ materialId: string; quantity: number; totalPrice: number }>, source: string, notes: string) => {
    try {
      setSaving(true)
      const res = await fetch('/api/material-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, source, notes }),
      })
      if (res.ok) {
        setImportDialogOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi nhập kho')
      }
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setSaving(false)
    }
  }

  // === Computed ===
  const filteredMaterials = rawMaterials.filter((m) =>
    m.name.toLowerCase().includes(searchInput.toLowerCase())
  )
  const materialTotalPages = Math.ceil(filteredMaterials.length / MATERIAL_ITEMS_PER_PAGE)
  const currentMaterials = filteredMaterials.slice(
    (materialPage - 1) * MATERIAL_ITEMS_PER_PAGE,
    materialPage * MATERIAL_ITEMS_PER_PAGE
  )
  const txTotalPages = Math.ceil(materialTransactions.length / TX_ITEMS_PER_PAGE)
  const currentTransactions = materialTransactions.slice(
    (txPage - 1) * TX_ITEMS_PER_PAGE,
    txPage * TX_ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      {/* Section A: Danh sách nguyên liệu */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-500" />
                Danh sách nguyên liệu
              </CardTitle>
              <CardDescription>{rawMaterials.length} nguyên liệu</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm nguyên liệu..."
                  className="pl-9 w-40 sm:w-48"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); setMaterialPage(1) }}
                />
              </div>
              <Button onClick={() => openMaterialDialog()} className="bg-forest hover:bg-forest-dark">
                <Plus className="w-4 h-4 mr-1" />
                Thêm NL
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead className="text-right">Tồn tối thiểu</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchInput ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell className={`text-right font-bold ${material.currentStock <= material.minStock ? 'text-red-600' : 'text-forest'}`}>
                        {material.currentStock}
                      </TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell className="text-right">{material.minStock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openMaterialDialog(material)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteMaterial(material.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {materialTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground italic">
                Hiển thị <strong>{(materialPage - 1) * MATERIAL_ITEMS_PER_PAGE + 1}</strong> - <strong>{Math.min(materialPage * MATERIAL_ITEMS_PER_PAGE, filteredMaterials.length)}</strong> trong tổng số <strong>{filteredMaterials.length}</strong> nguyên liệu
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={materialPage === 1} onClick={() => setMaterialPage((p) => Math.max(1, p - 1))}>Trước</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, materialTotalPages) }, (_, i) => {
                    let pageNum = i + 1
                    if (materialTotalPages > 5 && materialPage > 3) {
                      pageNum = materialPage - 3 + i + 1
                      if (pageNum > materialTotalPages) pageNum = materialTotalPages - (4 - i)
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={materialPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={`w-8 h-8 p-0 ${materialPage === pageNum ? 'bg-forest' : ''}`}
                        onClick={() => setMaterialPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button variant="outline" size="sm" disabled={materialPage === materialTotalPages} onClick={() => setMaterialPage((p) => Math.min(materialTotalPages, p + 1))}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B: Lịch sử nhập kho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Lịch sử nhập/xuất nguyên liệu
              </CardTitle>
              <CardDescription>Danh sách các lần thay đổi số lượng tồn kho</CardDescription>
            </div>
            <Button onClick={openImportDialog} className="bg-forest hover:bg-forest-dark shrink-0">
              <ArrowDownToLine className="w-4 h-4 mr-1" />
              Nhập kho
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Nguyên liệu</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead>Nguồn/Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có giao dịch nào
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="font-medium text-sm">{tx.material?.name || tx.materialId}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={(tx.type === 'import') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {(tx.type === 'import') ? '+' : '-'}{tx.quantity} {tx.material?.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {tx.totalPrice > 0 ? formatPrice(tx.totalPrice) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {tx.source && <span className="font-medium text-gray-700">[{tx.source}] </span>}
                        {tx.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {txTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground italic">
                Trang {txPage} / {txTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={txPage === 1} onClick={() => setTxPage((p) => Math.max(1, p - 1))}>Trước</Button>
                <Button variant="outline" size="sm" disabled={txPage === txTotalPages} onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Dialogs === */}
      <MaterialDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        editingMaterial={editingMaterial}
        materialForm={materialForm}
        setMaterialForm={setMaterialForm}
        saveMaterial={saveMaterial}
        saving={saving}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        rawMaterials={rawMaterials}
        saveImport={saveImport}
        saving={saving}
      />
    </div>
  )
}

export default MaterialsTab
