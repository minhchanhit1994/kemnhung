import React, { useState, useMemo, useEffect, useRef } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Hammer,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react'
import { Product, ProductionOrder, RawMaterial, ProductMaterial } from '@/lib/types'
import { formatPrice, formatDateShort } from './utils'
import { PRODUCTION_STATUS_COLORS, PRODUCTION_STATUS_LABELS } from './types'
import ProductDialog from './ProductDialog'
import ProductionDialog from './ProductionDialog'

interface ProductionTabProps {
  products: Product[]
  productionOrders: ProductionOrder[]
  rawMaterials: RawMaterial[]
  reservedStockMap: Record<string, number>
  onRefresh: () => void
}

const PRODUCT_ITEMS_PER_PAGE = 5

const ProductionTab: React.FC<ProductionTabProps> = ({
  products,
  productionOrders,
  rawMaterials,
  reservedStockMap,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'selling' | 'hidden'>('selling')
  const [productPage, setProductPage] = useState(1)
  const [infoProduct, setInfoProduct] = useState<Product | null>(null)
  
  // === Dialog States ===
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productionDialogOpen, setProductionDialogOpen] = useState(false)
  
  // === Loading/Saving States ===
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // === Form States ===
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'cái',
    imageUrl: '',
    videoUrl: '',
    isActive: true,
  })
  const [recipeMaterials, setRecipeMaterials] = useState<{ materialId: string; quantity: string }[]>([])
  const [recipeSearch, setRecipeSearch] = useState('')
  const [recipeSearchInput, setRecipeSearchInput] = useState('')
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, string>>({})

  const [productionForm, setProductionForm] = useState({ productId: '', quantity: '', notes: '' })

  const videoInputRef = useRef<HTMLInputElement>(null)

  // Reset page when sub-tab or search query changes
  const [productSearchInput, setProductSearchInput] = useState('')
  useEffect(() => {
    setProductPage(1)
  }, [activeSubTab, productSearchInput])

  // === Product CRUD Handlers ===
  const openProductDialog = async (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        description: product.description,
        price: String(product.price),
        unit: product.unit || 'cái',
        imageUrl: product.imageUrl || '',
        videoUrl: product.videoUrl || '',
        isActive: !!product.isActive,
      })
      try {
        const res = await fetch(`/api/product-materials?product_id=${product.id}`)
        if (res.ok) {
          const data = await res.json()
          setRecipeMaterials(
            data.materials.map((pm: ProductMaterial) => ({
              materialId: pm.materialId,
              quantity: String(pm.quantity),
            }))
          )
        }
      } catch {
        setRecipeMaterials([])
      }
    } else {
      setEditingProduct(null)
      setProductForm({ name: '', description: '', price: '', unit: 'cái', imageUrl: '', videoUrl: '', isActive: true })
      setRecipeMaterials([])
    }
    setRecipeSearch('')
    setRecipeSearchInput('')
    setBulkQuantities({})
    setProductDialogOpen(true)
  }

  const saveProduct = async () => {
    try {
      setSaving(true)
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price) || 0,
          unit: productForm.unit,
          imageUrl: productForm.imageUrl,
          videoUrl: productForm.videoUrl,
          isActive: productForm.isActive,
        }),
      })

      if (res.ok) {
        const savedProduct = await res.json()
        const productId = savedProduct.id || editingProduct?.id

        if (productId) {
          if (editingProduct) {
            const existingRes = await fetch(`/api/product-materials?product_id=${productId}`)
            if (existingRes.ok) {
              const existingData = await existingRes.json()
              await Promise.all(
                (existingData.materials || []).map((pm: ProductMaterial) =>
                  fetch(`/api/product-materials?id=${pm.id}`, { method: 'DELETE' })
                )
              )
            }
          }
          await Promise.all(
            recipeMaterials.map((rm) =>
              fetch('/api/product-materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productId,
                  materialId: rm.materialId,
                  quantity: Number(rm.quantity) || 0,
                }),
              })
            )
          )
        }

        setProductDialogOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi lưu sản phẩm')
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleProductVisibility = async (product: { id: string; name: string; isActive: boolean }) => {
    const action = product.isActive ? 'ẩn' : 'hiện'
    if (!confirm(`Bạn có chắc muốn ${action} sản phẩm "${product.name}" khỏi trang chủ?`)) return
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (res.ok) onRefresh()
      else {
        const err = await res.json()
        alert(err.error || `Lỗi ${action} sản phẩm`)
      }
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) onRefresh()
      else {
        const err = await res.json()
        alert(err.error || 'Lỗi xóa sản phẩm')
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // === Image / Video Upload ===
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setProductForm((prev) => ({ ...prev, imageUrl: data.url }))
      } else {
        alert('Upload thất bại')
      }
    } catch {
      alert('Lỗi upload ảnh')
    } finally {
      setUploading(false)
    }
  }

  const uploadVideo = async (file: File) => {
    try {
      setUploadingVideo(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setProductForm((prev) => ({ ...prev, videoUrl: data.url }))
      } else {
        const errData = await res.json()
        alert(errData.error || 'Upload video thất bại')
      }
    } catch {
      alert('Lỗi upload video')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 30) {
          alert('Video quá dài! Vui lòng chọn video dưới 30 giây.')
          return
        }
        uploadVideo(file)
      }
      video.onerror = () => {
        alert('Không thể đọc video. Vui lòng thử file khác.')
      }
      video.src = URL.createObjectURL(file)
    } else {
      alert('Vui lòng chọn file video (MP4, WebM, MOV)')
    }
  }

  // === Production Handlers ===
  const openProductionDialog = (product?: Product) => {
    setProductionForm({ productId: product?.id || '', quantity: '', notes: '' })
    setProductionDialogOpen(true)
  }

  const saveProductionOrder = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/production-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productionForm.productId,
          quantity: Number(productionForm.quantity) || 0,
          notes: productionForm.notes,
        }),
      })
      if (res.ok) {
        setProductionDialogOpen(false)
        onRefresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi tạo phiếu sản xuất')
      }
    } catch (error) {
      console.error('Production error:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateProductionStatus = async (id: string, status: string) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/production-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) onRefresh()
      else {
        const err = await res.json()
        alert(err.error || 'Lỗi cập nhật trạng thái phiếu')
      }
    } catch (error) {
      console.error('Production status update error:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeRecipeMaterial = (index: number) => {
    setRecipeMaterials(recipeMaterials.filter((_, i) => i !== index))
  }

  // === Computed Recipes & Production Stock Check ===
  const selectedProductionRecipe = useMemo(() => {
    const product = products.find((p) => p.id === productionForm.productId)
    return product?.productMaterials || []
  }, [products, productionForm.productId])

  const productionStockCheck = useMemo(() => {
    const qty = Number(productionForm.quantity) || 0
    if (qty === 0 || selectedProductionRecipe.length === 0) return []
    return selectedProductionRecipe.map((pm) => {
      const mat = rawMaterials.find((rm) => rm.id === pm.materialId)
      const unitPrice = mat?.unitPrice || 0
      const needed = pm.quantity * qty
      const available = mat?.currentStock || 0
      return {
        materialName: mat?.name || 'Không xác định',
        unit: mat?.unit || '',
        needed,
        available,
        sufficient: available >= needed,
        unitPrice,
      }
    })
  }, [selectedProductionRecipe, rawMaterials, productionForm.quantity])

  const recipeTotalCost = useMemo(() => {
    return recipeMaterials.reduce((sum, rm) => {
      const mat = rawMaterials.find((m) => m.id === rm.materialId)
      const unitPrice = mat?.unitPrice || 0
      return sum + (Number(rm.quantity) || 0) * unitPrice
    }, 0)
  }, [recipeMaterials, rawMaterials])

  // === Product Search and Pagination ===
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearchInput.toLowerCase())
    const matchesTab = activeSubTab === 'selling' ? p.isActive : !p.isActive
    return matchesSearch && matchesTab
  })

  const activeCount = products.filter(p => p.isActive).length
  const hiddenCount = products.filter(p => !p.isActive).length

  const productTotalPages = Math.ceil(filteredProducts.length / PRODUCT_ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PRODUCT_ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + PRODUCT_ITEMS_PER_PAGE)
  }, [filteredProducts, productPage])

  return (
    <div className="space-y-6">
      {/* Section A: Danh sách thành phẩm */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-forest-light" />
                Danh sách thành phẩm
              </CardTitle>
              <CardDescription>{products.length} sản phẩm</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm sản phẩm..."
                  className="pl-9 w-40 sm:w-48"
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                />
              </div>
              <Button onClick={() => openProductDialog()} className="bg-forest hover:bg-forest-dark">
                <Plus className="w-4 h-4 mr-1" />
                Thêm SP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex border-b border-gray-100 pb-3 mb-4 gap-2">
            <button
              onClick={() => setActiveSubTab('selling')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${activeSubTab === 'selling'
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-mint-light/20 hover:text-forest'
                }`}
            >
              <span>Đang bán</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSubTab === 'selling' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('hidden')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${activeSubTab === 'hidden'
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-mint-light/20 hover:text-forest'
                }`}
            >
              <span>Đã ẩn</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSubTab === 'hidden' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {hiddenCount}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ảnh</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead className="text-right">Giá bán</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Đã đặt (Chờ XL)</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {productSearchInput
                        ? 'Không tìm thấy sản phẩm'
                        : activeSubTab === 'hidden'
                          ? 'Không có sản phẩm nào đang ẩn'
                          : 'Chưa có sản phẩm'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] sm:max-w-[300px]">
                        <div className="truncate" title={product.name}>{product.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate" title={product.description}>
                          {product.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-forest">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {product.stockQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {reservedStockMap[product.id] ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            {reservedStockMap[product.id]}
                          </Badge>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={product.isActive ? "text-forest hover:text-forest-dark" : "text-gray-400 hover:text-gray-600"}
                            onClick={() => toggleProductVisibility(product)}
                            title={product.isActive ? "Đang hiện - Click để ẩn" : "Đang ẩn - Click để hiện"}
                          >
                            {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-forest hover:text-forest-dark hover:bg-mint-light/50"
                            onClick={() => openProductionDialog(product)}
                            title="Lập phiếu sản xuất"
                          >
                            <Hammer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => setInfoProduct(product)}
                            title="Xem nhanh nguyên liệu"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openProductDialog(product)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteProduct(product.id)}
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

          {productTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-muted-foreground italic">
                Trang {productPage} / {productTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={productPage === 1}
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={productPage === productTotalPages}
                  onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B: Phiếu sản xuất */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Phiếu sản xuất
              </CardTitle>
              <CardDescription>Theo dõi quá trình sản xuất và cập nhật tồn kho</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có phiếu sản xuất
                    </TableCell>
                  </TableRow>
                ) : (
                  productionOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.product?.name || '-'}</TableCell>
                      <TableCell className="text-center font-bold">{po.quantity}</TableCell>
                      <TableCell>
                        <Badge className={PRODUCTION_STATUS_COLORS[po.status] || ''}>
                          {PRODUCTION_STATUS_LABELS[po.status] || po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateShort(po.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {po.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-forest hover:bg-mint-light h-8"
                              disabled={saving}
                              onClick={() => updateProductionStatus(po.id, 'completed')}
                            >
                              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                              Xong
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 h-8"
                              disabled={saving}
                              onClick={() => updateProductionStatus(po.id, 'cancelled')}
                            >
                              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                              Hủy
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog xem nhanh nguyên liệu thành phẩm */}
      <Dialog open={!!infoProduct} onOpenChange={(open) => !open && setInfoProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-forest-dark font-semibold">
              <Info className="w-5 h-5 text-blue-500" />
              Nguyên liệu: {infoProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Danh sách định lượng các nguyên liệu kẽm nhung & phụ kiện cần để sản xuất ra 1 sản phẩm này.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-forest/20">
            {!infoProduct?.productMaterials || infoProduct.productMaterials.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg bg-gray-50/50">
                Thành phẩm này chưa được liên kết với bất kỳ nguyên liệu nào.
              </div>
            ) : (
              <div className="border border-forest/10 rounded-lg overflow-hidden bg-white shadow-xs">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-forest/10 text-forest-dark font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Tên nguyên liệu</th>
                      <th className="py-2.5 px-3 text-right w-24">Số lượng</th>
                      <th className="py-2.5 px-3 text-right w-20">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {infoProduct.productMaterials.map((pm, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-medium text-forest-dark">{pm.material?.name || 'Nguyên liệu'}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-700">{pm.quantity}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{pm.material?.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end border-t border-forest/10 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setInfoProduct(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Product CRUD Dialog === */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        handleImageUpload={handleImageUpload}
        uploading={uploading}
        handleVideoUpload={handleVideoUpload}
        uploadingVideo={uploadingVideo}
        videoInputRef={videoInputRef}
        recipeTotalCost={recipeTotalCost}
        recipeMaterials={recipeMaterials}
        setRecipeMaterials={setRecipeMaterials}
        rawMaterials={rawMaterials}
        recipeSearchInput={recipeSearchInput}
        setRecipeSearchInput={setRecipeSearchInput}
        bulkQuantities={bulkQuantities}
        setBulkQuantities={setBulkQuantities}
        removeRecipeMaterial={removeRecipeMaterial}
        saveProduct={saveProduct}
        saving={saving}
      />

      {/* === Production Order Dialog === */}
      <ProductionDialog
        open={productionDialogOpen}
        onOpenChange={setProductionDialogOpen}
        productionForm={productionForm}
        setProductionForm={setProductionForm}
        products={products}
        selectedProductionRecipe={selectedProductionRecipe}
        productionStockCheck={productionStockCheck}
        saveProductionOrder={saveProductionOrder}
        saving={saving}
      />
    </div>
  )
}

export default ProductionTab
