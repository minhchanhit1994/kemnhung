import React from 'react'
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
import { Product, ProductionOrder } from '@/lib/types'
import { formatPrice, formatDateShort } from './utils'
import { PRODUCTION_STATUS_COLORS, PRODUCTION_STATUS_LABELS } from './types'

interface ProductionTabProps {
  products: Product[]
  productionOrders: ProductionOrder[]
  productSearchInput: string
  setProductSearchInput: (val: string) => void
  openProductDialog: (product?: Product) => void
  deleteProduct: (id: string) => void
  openProductionDialog: (product?: Product) => void
  updateProductionStatus: (id: string, status: string) => void
  toggleProductVisibility: (product: { id: string; name: string; isActive: boolean }) => void
  reservedStockMap: Record<string, number>
  saving: boolean
}

const ProductionTab: React.FC<ProductionTabProps> = ({
  products,
  productionOrders,
  productSearchInput,
  setProductSearchInput,
  openProductDialog,
  deleteProduct,
  openProductionDialog,
  updateProductionStatus,
  toggleProductVisibility,
  reservedStockMap,
  saving,
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'selling' | 'hidden'>('selling')
  const [productPage, setProductPage] = React.useState(1)
  const [infoProduct, setInfoProduct] = React.useState<Product | null>(null)
  const productItemsPerPage = 5

  // Reset page when sub-tab or search query changes
  React.useEffect(() => {
    setProductPage(1)
  }, [activeSubTab, productSearchInput])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearchInput.toLowerCase())
    const matchesTab = activeSubTab === 'selling' ? p.isActive : !p.isActive
    return matchesSearch && matchesTab
  })

  // Count active vs hidden for the tab badges
  const activeCount = products.filter(p => p.isActive).length
  const hiddenCount = products.filter(p => !p.isActive).length

  const productTotalPages = Math.ceil(filteredProducts.length / productItemsPerPage)
  const paginatedProducts = React.useMemo(() => {
    const start = (productPage - 1) * productItemsPerPage
    return filteredProducts.slice(start, start + productItemsPerPage)
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
          {/* Sub-tab Switcher pills */}
          <div className="flex border-b border-gray-100 pb-3 mb-4 gap-2">
            <button
              onClick={() => setActiveSubTab('selling')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-2 ${activeSubTab === 'selling'
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-mint-light/20 hover:text-forest'
                }`}
            >
              <span>Đang bán</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSubTab === 'selling' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
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
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSubTab === 'hidden' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
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
                        {product.currentStock}
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

          {/* Pagination Controls */}
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
    </div>
  )
}

export default ProductionTab
