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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Image as ImageIcon,
  Upload,
  Video,
  X,
  Calculator,
  CheckCircle2,
  Trash2,
  Search,
  Plus,
  Save,
  Loader2,
} from 'lucide-react'
import { Product, RawMaterial } from '@/lib/types'
import { formatPrice } from './utils'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingProduct: Product | null
  productForm: {
    name: string
    description: string
    price: string
    unit: string
    isActive: boolean
    imageUrl: string
    videoUrl: string
  }
  setProductForm: (form: any | ((prev: any) => any)) => void
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  videoInputRef: React.RefObject<HTMLInputElement | null>
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingVideo: boolean
  recipeMaterials: { materialId: string; quantity: string }[]
  setRecipeMaterials: (val: any | ((prev: any) => any)) => void
  recipeSearchInput: string
  setRecipeSearchInput: (val: string) => void
  bulkQuantities: Record<string, string>
  setBulkQuantities: (val: any | ((prev: any) => any)) => void
  recipeTotalCost: number
  rawMaterials: RawMaterial[]
  saveProduct: () => void
  saving: boolean
  removeRecipeMaterial: (index: number) => void
}

const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  editingProduct,
  productForm,
  setProductForm,
  handleImageUpload,
  uploading,
  videoInputRef,
  handleVideoUpload,
  uploadingVideo,
  recipeMaterials,
  setRecipeMaterials,
  recipeSearchInput,
  setRecipeSearchInput,
  bulkQuantities,
  setBulkQuantities,
  recipeTotalCost,
  rawMaterials,
  saveProduct,
  saving,
  removeRecipeMaterial,
}) => {
  const recipeSearch = recipeSearchInput

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
          <DialogDescription>
            {editingProduct ? 'Cập nhật thông tin sản phẩm' : 'Nhập thông tin sản phẩm mới'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tên sản phẩm</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">VD: Túi tote vải canvas</p>
            </div>
            <div>
              <Label>Đơn vị</Label>
              <Select value={productForm.unit} onValueChange={(v) => setProductForm({ ...productForm, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['cái', 'chiếc', 'bộ', 'hộp'].map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Mô tả sản phẩm (không bắt buộc)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Giá bán (VNĐ)</Label>
              <Input
                type="number"
                step="any"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">VD: 150000</p>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={productForm.isActive}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, isActive: checked === true })}
                />
                <Label htmlFor="is-active">Đang bán</Label>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Ảnh sản phẩm</Label>
            <div className="flex items-center gap-4 mt-1">
              <div className="w-20 h-20 rounded border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {productForm.imageUrl ? (
                  <img src={productForm.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-1" />
                      {uploading ? 'Đang upload...' : 'Tải ảnh lên'}
                    </span>
                  </Button>
                </label>
                {productForm.imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 text-xs mt-1"
                    onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                  >
                    Xóa ảnh
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video sản phẩm (tối đa 30 giây)
            </Label>
            <div className="mt-1 space-y-2">
              {productForm.videoUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-gray-50">
                  <video
                    src={productForm.videoUrl}
                    controls
                    className="w-full max-h-48 object-contain"
                    preload="metadata"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 h-7 w-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                    onClick={() => setProductForm({ ...productForm, videoUrl: '' })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingVideo} asChild>
                      <span>
                        <Video className="w-4 h-4 mr-1" />
                        {uploadingVideo ? 'Đang upload video...' : 'Tải video lên'}
                      </span>
                    </Button>
                  </label>
                  <span className="text-xs text-muted-foreground">MP4, WebM, MOV - tối đa 30 giây</span>
                </div>
              )}
            </div>
          </div>

          {/* === CÔNG THỨC (Recipe) === */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-forest" />
                <h3 className="font-semibold text-sm uppercase">Công thức sản phẩm</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng giá vốn</p>
                <p className="font-bold text-forest text-lg leading-tight">{formatPrice(recipeTotalCost)}</p>
              </div>
            </div>

            {/* Danh sách đã chọn */}
            {recipeMaterials.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1 bg-white/50 p-2 rounded-md border border-dashed border-forest/30">
                <p className="text-[10px] font-bold text-forest uppercase mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Nguyên liệu đã chọn ({recipeMaterials.length})
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {recipeMaterials.map((rm, idx) => {
                    const mat = rawMaterials.find((m) => m.id === rm.materialId)
                    return (
                      <div key={idx} className="flex items-center justify-between bg-white rounded p-1.5 text-xs border border-gray-100 shadow-sm">
                        <span className="font-medium text-forest-dark">{mat?.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono">{rm.quantity} {mat?.unit}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeRecipeMaterial(idx)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bảng chọn nguyên liệu tập trung */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Tìm nhanh nguyên liệu để thêm..."
                  className="h-9 text-xs pl-8 bg-white border-forest/20 focus-visible:ring-forest"
                  value={recipeSearchInput}
                  onChange={(e) => setRecipeSearchInput(e.target.value)}
                />
              </div>
              
              <div className="bg-white rounded-md border border-forest/10 overflow-hidden shadow-sm">
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-forest/20">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow className="h-8 hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase font-bold px-2 text-forest-dark">Nguyên liệu</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right px-2 text-forest-dark">Giá gốc</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold w-24 px-2 text-forest-dark text-center">Số lượng</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawMaterials
                        .filter(m => m.name.toLowerCase().includes(recipeSearch.toLowerCase()))
                        .map((m) => {
                          const isAdded = recipeMaterials.some(rm => rm.materialId === m.id)
                          const currentQty = isAdded ? (recipeMaterials.find(rm => rm.materialId === m.id)?.quantity || '') : (bulkQuantities[m.id] || '')
                          
                          return (
                            <TableRow key={m.id} className={`h-10 transition-colors ${isAdded ? 'bg-mint-light/10' : 'hover:bg-gray-50/50'}`}>
                              <TableCell className="py-1 px-2">
                                <div className="font-medium text-xs text-forest-dark">{m.name}</div>
                                <div className="text-[10px] text-muted-foreground">{m.unit}</div>
                              </TableCell>
                              <TableCell className="py-1 px-2 text-[10px] text-right text-muted-foreground">
                                {formatPrice(m.unitPrice)}
                              </TableCell>
                              <TableCell className="py-1 px-2">
                                <Input
                                  type="number"
                                  step="any"
                                  className="h-7 text-xs px-2 focus-visible:ring-forest border-gray-200"
                                  placeholder="0"
                                  value={currentQty}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    if (isAdded) {
                                      setRecipeMaterials((prev: any[]) => prev.map(rm => rm.materialId === m.id ? { ...rm, quantity: val } : rm))
                                    } else {
                                      setBulkQuantities((prev: any) => ({ ...prev, [m.id]: val }))
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="py-1 px-2 text-center">
                                {!isAdded && bulkQuantities[m.id] && Number(bulkQuantities[m.id]) > 0 ? (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-forest hover:bg-forest/10"
                                    onClick={() => {
                                      setRecipeMaterials((prev: any[]) => [...prev, { materialId: m.id, quantity: bulkQuantities[m.id] }])
                                      setBulkQuantities((prev: any) => {
                                        const next = { ...prev }
                                        delete next[m.id]
                                        return next
                                      })
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                ) : isAdded ? (
                                  <CheckCircle2 className="w-4 h-4 text-forest mx-auto" />
                                ) : null}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={saveProduct} disabled={saving || !productForm.name} className="bg-forest hover:bg-forest-dark">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProductDialog
