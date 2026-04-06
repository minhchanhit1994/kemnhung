'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  FlaskConical,
  Package,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  LogOut,
  KeyRound,
  Shield,
  Search,
  AlertTriangle,
  Hammer,
  ArrowDownToLine,
  History,
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type {
  Product,
  RawMaterial,
  MaterialTransaction,
  ProductMaterial,
  ProductionOrder,
  Order,
} from '@/lib/types'

interface AdminPanelProps {
  onBack: () => void
  onLogout: () => void
  username: string
  onChangePassword: () => void
}

interface DashboardStats {
  totalRawMaterials: number
  lowStockMaterials: { id: string; name: string; currentStock: number; minStock: number; unit: string }[]
  totalProducts: number
  activeProducts: number
  totalProductionOrders: number
  recentProductionOrders: ProductionOrder[]
  totalRevenue: number
  recentOrders: Order[]
  // Financial data
  totalCapital: number
  totalProductionCost: number
  totalCogs: number
  totalProfit: number
  monthlyFinance: { month: string; revenue: number; capital: number; profit: number }[]
}

const MATERIAL_UNITS = ['cái', 'kg', 'm', 'l', 'cuộn', 'tấm', 'bộ', 'hộp', 'chiếc']

const PRODUCTION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export default function AdminPanel({ onBack, onLogout, username, onChangePassword }: AdminPanelProps) {
  // === Tab ===
  const [activeTab, setActiveTab] = useState('dashboard')

  // === Dashboard ===
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // === Raw Materials ===
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([])

  // === Products & Production ===
  const [products, setProducts] = useState<Product[]>([])
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([])
  const [productMaterials, setProductMaterials] = useState<{ materials: (ProductMaterial & { material?: RawMaterial })[]; totalCost: number } | null>(null)

  // === UI State ===
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // === Dialog States ===
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productionDialogOpen, setProductionDialogOpen] = useState(false)

  // === Form States ===
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [materialForm, setMaterialForm] = useState({ name: '', unit: 'cái', description: '', minStock: '10' })

  const [importForm, setImportForm] = useState({ materialId: '', quantity: '', totalPrice: '', source: '', notes: '' })

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'cái',
    imageUrl: '',
    isActive: true,
  })
  const [recipeMaterials, setRecipeMaterials] = useState<{ materialId: string; quantity: string }[]>([])
  const [newRecipeMaterial, setNewRecipeMaterial] = useState({ materialId: '', quantity: '' })

  const [productionForm, setProductionForm] = useState({ productId: '', quantity: '', notes: '' })

  // === Fetch All Data ===
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [materialsRes, transactionsRes, productsRes, productionRes, dashboardRes] = await Promise.all([
        fetch('/api/raw-materials'),
        fetch('/api/material-transactions'),
        fetch('/api/products'),
        fetch('/api/production-orders'),
        fetch('/api/dashboard'),
      ])
      if (materialsRes.ok) setRawMaterials(await materialsRes.json())
      if (transactionsRes.ok) setMaterialTransactions(await transactionsRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (productionRes.ok) setProductionOrders(await productionRes.json())
      if (dashboardRes.ok) setStats(await dashboardRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // === Helpers ===
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  // === Computed Values ===
  const lowStockMaterials = useMemo(
    () => rawMaterials.filter((m) => m.minStock > 0 && m.currentStock <= m.minStock),
    [rawMaterials]
  )

  const filteredMaterials = useMemo(
    () => rawMaterials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [rawMaterials, search]
  )

  // Production dialog: get recipe for selected product
  const selectedProductionRecipe = useMemo(() => {
    if (!productionForm.productId) return []
    const product = products.find((p) => p.id === productionForm.productId)
    return product?.productMaterials || []
  }, [productionForm.productId, products])

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

  // === Material CRUD ===
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
        fetchAll()
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
      if (res.ok) fetchAll()
      else {
        const err = await res.json()
        alert(err.error || 'Lỗi xóa nguyên liệu')
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // === Import Handler ===
  const openImportDialog = () => {
    setImportForm({ materialId: '', quantity: '', totalPrice: '', source: '', notes: '' })
    setImportDialogOpen(true)
  }

  const saveImport = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/material-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: importForm.materialId,
          quantity: Number(importForm.quantity) || 0,
          totalPrice: Number(importForm.totalPrice) || 0,
          source: importForm.source,
          notes: importForm.notes,
        }),
      })
      if (res.ok) {
        setImportDialogOpen(false)
        fetchAll()
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

  // === Product CRUD ===
  const openProductDialog = async (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        description: product.description,
        price: String(product.price),
        unit: product.unit || 'cái',
        imageUrl: product.imageUrl || '',
        isActive: product.isActive,
      })
      // Load recipe from API
      try {
        const res = await fetch(`/api/product-materials?product_id=${product.id}`)
        if (res.ok) {
          const data = await res.json()
          setProductMaterials(data)
          setRecipeMaterials(
            data.materials.map((pm: ProductMaterial) => ({
              materialId: pm.materialId,
              quantity: String(pm.quantity),
            }))
          )
        }
      } catch {
        setRecipeMaterials([])
        setProductMaterials(null)
      }
    } else {
      setEditingProduct(null)
      setProductForm({ name: '', description: '', price: '', unit: 'cái', imageUrl: '', isActive: true })
      setRecipeMaterials([])
      setProductMaterials(null)
    }
    setNewRecipeMaterial({ materialId: '', quantity: '' })
    setProductDialogOpen(true)
  }

  const addRecipeMaterial = () => {
    if (!newRecipeMaterial.materialId || !newRecipeMaterial.quantity) return
    setRecipeMaterials([...recipeMaterials, { ...newRecipeMaterial }])
    setNewRecipeMaterial({ materialId: '', quantity: '' })
  }

  const removeRecipeMaterial = (index: number) => {
    setRecipeMaterials(recipeMaterials.filter((_, i) => i !== index))
  }

  const recipeTotalCost = useMemo(() => {
    return recipeMaterials.reduce((sum, rm) => {
      const mat = rawMaterials.find((m) => m.id === rm.materialId)
      const unitPrice = mat?.unitPrice || 0
      return sum + (Number(rm.quantity) || 0) * unitPrice
    }, 0)
  }, [recipeMaterials, rawMaterials])

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
          isActive: productForm.isActive,
        }),
      })

      if (res.ok) {
        const savedProduct = await res.json()
        const productId = savedProduct.id || editingProduct?.id

        // Sync recipe materials via API
        if (productId) {
          // First delete all existing recipe entries
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
          // Then add new ones
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
        fetchAll()
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

  const deleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) fetchAll()
      else {
        const err = await res.json()
        alert(err.error || 'Lỗi xóa sản phẩm')
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

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

  // === Production ===
  const openProductionDialog = () => {
    setProductionForm({ productId: '', quantity: '', notes: '' })
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
        fetchAll()
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

  // === Loading Skeleton ===
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* === Admin Header === */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Về trang chủ</span>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h1 className="font-bold text-lg">Quản trị</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              {username}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onChangePassword} title="Đổi mật khẩu">
              <KeyRound className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={onLogout}
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Nguyên liệu</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              <Hammer className="w-4 h-4" />
              <span className="hidden sm:inline">SP &amp; Sản xuất</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== Tab 1: TỔNG QUAN ==================== */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Financial Cards - Doanh thu / Vốn / Lời-Lỗ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                        <p className="text-xl font-bold text-emerald-700">{formatPrice(stats?.totalRevenue ?? 0)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Vốn nhập NL</p>
                        <p className="text-xl font-bold text-orange-700">{formatPrice(stats?.totalCapital ?? 0)}</p>
                      </div>
                      <Wallet className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Giá vốn SP đã bán</p>
                        <p className="text-xl font-bold text-blue-700">{formatPrice(stats?.totalCogs ?? 0)}</p>
                      </div>
                      <Calculator className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className={`border-l-4 ${(stats?.totalProfit ?? 0) >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Lợi nhuận</p>
                        <p className={`text-xl font-bold ${(stats?.totalProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatPrice(stats?.totalProfit ?? 0)}
                        </p>
                      </div>
                      {(stats?.totalProfit ?? 0) >= 0 ? (
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Chart */}
              {stats?.monthlyFinance && stats.monthlyFinance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                      Biểu đồ tài chính theo tháng
                    </CardTitle>
                    <CardDescription>Doanh thu, vốn nhập, lợi nhuận</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyFinance.map((m) => ({
                          ...m,
                          month: m.month.substring(5), // "06" => "6"
                        }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(value: number) => formatPrice(value)}
                            labelFormatter={(label) => `Tháng ${label}`}
                            contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                          />
                          <Legend formatter={(value) => {
                            if (value === 'revenue') return 'Doanh thu'
                            if (value === 'capital') return 'Vốn nhập NL'
                            if (value === 'profit') return 'Lợi nhuận'
                            return value
                          }} />
                          <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="capital" fill="#f97316" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="profit" fill={(stats.totalProfit ?? 0) >= 0 ? '#10b981' : '#ef4444'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Cards - row 2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-teal-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Nguyên liệu</p>
                        <p className="text-2xl font-bold">{stats?.totalRawMaterials ?? rawMaterials.length}</p>
                      </div>
                      <FlaskConical className="w-8 h-8 text-teal-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Thành phẩm</p>
                        <p className="text-2xl font-bold">{stats?.totalProducts ?? products.length}</p>
                        <p className="text-xs text-emerald-600">{stats?.activeProducts ?? 0} đang bán</p>
                      </div>
                      <Package className="w-8 h-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Phiếu SX</p>
                        <p className="text-2xl font-bold">{stats?.totalProductionOrders ?? productionOrders.length}</p>
                      </div>
                      <Hammer className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">NL sắp hết</p>
                        <p className="text-2xl font-bold">{lowStockMaterials.length}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Alert */}
              {lowStockMaterials.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-5 h-5" />
                      Nguyên liệu sắp hết
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lowStockMaterials.map((m) => (
                        <Badge
                          key={m.id}
                          variant="outline"
                          className={
                            m.currentStock <= 0
                              ? 'text-red-700 border-red-300 bg-white'
                              : 'text-amber-700 border-amber-300 bg-white'
                          }
                        >
                          {m.name}: {m.currentStock}/{m.minStock} {m.unit}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Production Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-orange-500" />
                      SX gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(!stats?.recentProductionOrders || stats.recentProductionOrders.length === 0) ? (
                      <p className="text-center text-muted-foreground py-8">Chưa có phiếu sản xuất</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sản phẩm</TableHead>
                              <TableHead className="text-center">SL</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead>Ngày</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.recentProductionOrders.map((po) => (
                              <TableRow key={po.id}>
                                <TableCell className="font-medium">{po.product?.name || '-'}</TableCell>
                                <TableCell className="text-center">{po.quantity}</TableCell>
                                <TableCell>
                                  <Badge className={PRODUCTION_STATUS_COLORS[po.status] || ''}>
                                    {PRODUCTION_STATUS_LABELS[po.status] || po.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDateShort(po.createdAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-500" />
                      Đơn hàng gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                      <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Khách hàng</TableHead>
                              <TableHead className="text-right">Tổng tiền</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead>Ngày</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.recentOrders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.customerName}</TableCell>
                                <TableCell className="text-right text-emerald-700 font-medium">
                                  {formatPrice(order.totalAmount)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      order.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : order.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {order.status === 'completed'
                                      ? 'Hoàn thành'
                                      : order.status === 'pending'
                                      ? 'Chờ xử lý'
                                      : order.status === 'cancelled'
                                      ? 'Đã hủy'
                                      : order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDateShort(order.createdAt)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ==================== Tab 2: NGUYÊN LIỆU ==================== */}
          <TabsContent value="materials">
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
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Button onClick={() => openMaterialDialog()} className="bg-emerald-600 hover:bg-emerald-700">
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
                          <TableHead className="text-center">Đơn vị</TableHead>
                          <TableHead className="text-center">Tồn kho</TableHead>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">Tổng vốn</TableHead>
                          <TableHead className="text-center">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMaterials.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {search ? 'Không tìm thấy nguyên liệu' : 'Chưa có nguyên liệu'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMaterials.map((material) => {
                            const isLow = material.minStock > 0 && material.currentStock <= material.minStock
                            const isOut = material.currentStock <= 0
                            return (
                              <TableRow key={material.id}>
                                <TableCell className="font-medium">{material.name}</TableCell>
                                <TableCell className="text-center">{material.unit}</TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    className={
                                      isOut
                                        ? 'bg-red-100 text-red-800'
                                        : isLow
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }
                                  >
                                    {material.currentStock} {material.unit}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {material.unitPrice > 0 ? formatPrice(material.unitPrice) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {material.totalCost > 0 ? formatPrice(material.totalCost) : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1">
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
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Section B: Nhập kho & Lịch sử */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
                        Nhập kho &amp; Lịch sử
                      </CardTitle>
                      <CardDescription>Lịch sử nhập/xuất nguyên liệu</CardDescription>
                    </div>
                    <Button onClick={openImportDialog} className="bg-emerald-600 hover:bg-emerald-700">
                      <ArrowDownToLine className="w-4 h-4 mr-1" />
                      Nhập kho
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead>Nguyên liệu</TableHead>
                          <TableHead className="text-center">Loại</TableHead>
                          <TableHead className="text-center">SL</TableHead>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">Tổng tiền</TableHead>
                          <TableHead>Nguồn</TableHead>
                          <TableHead>Ghi chú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              Chưa có giao dịch
                            </TableCell>
                          </TableRow>
                        ) : (
                          materialTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateShort(tx.createdAt)}
                              </TableCell>
                              <TableCell className="font-medium">{tx.material?.name || '-'}</TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={
                                    tx.type === 'import'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : tx.type === 'export'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {tx.type === 'import' ? 'Nhập' : tx.type === 'export' ? 'Xuất' : 'Điều chỉnh'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {tx.quantity} {tx.material?.unit || ''}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {tx.unitPrice > 0 ? formatPrice(tx.unitPrice) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {tx.totalPrice > 0 ? formatPrice(tx.totalPrice) : '-'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                {tx.source || '-'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                {tx.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== Tab 3: SẢN PHẨM & SẢN XUẤT ==================== */}
          <TabsContent value="production">
            <div className="space-y-6">
              {/* Section A: Danh sách thành phẩm */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-500" />
                        Danh sách thành phẩm
                      </CardTitle>
                      <CardDescription>{products.length} sản phẩm</CardDescription>
                    </div>
                    <Button onClick={() => openProductDialog()} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Thêm SP
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Ảnh</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead className="text-right">Giá vốn</TableHead>
                          <TableHead className="text-right">Giá bán</TableHead>
                          <TableHead className="text-center">Tồn kho</TableHead>
                          <TableHead className="text-center">Trạng thái</TableHead>
                          <TableHead className="text-center">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Chưa có sản phẩm
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="w-12 h-12 rounded bg-gray-50 flex items-center justify-center overflow-hidden border">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <ImageIcon className="w-6 h-6 text-gray-300" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {product.costPrice > 0 ? formatPrice(product.costPrice) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-emerald-700 font-semibold">
                                {formatPrice(product.price)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={product.stockQuantity <= 0 ? 'destructive' : 'secondary'}>
                                  {product.stockQuantity}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={product.isActive ? 'default' : 'outline'}
                                  className={product.isActive ? 'bg-emerald-100 text-emerald-800' : ''}
                                >
                                  {product.isActive ? 'Đang bán' : 'Ẩn'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
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
                </CardContent>
              </Card>

              {/* Section B: Sản xuất */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-orange-500" />
                        Sản xuất
                      </CardTitle>
                      <CardDescription>{productionOrders.length} phiếu sản xuất</CardDescription>
                    </div>
                    <Button onClick={openProductionDialog} className="bg-emerald-600 hover:bg-emerald-700">
                      <Hammer className="w-4 h-4 mr-1" />
                      Sản xuất
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead className="text-center">SL</TableHead>
                          <TableHead className="text-right">Giá vốn SX</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Ghi chú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productionOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Chưa có phiếu sản xuất
                            </TableCell>
                          </TableRow>
                        ) : (
                          productionOrders.map((po) => (
                            <TableRow key={po.id}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateShort(po.createdAt)}
                              </TableCell>
                              <TableCell className="font-medium">{po.product?.name || '-'}</TableCell>
                              <TableCell className="text-center">{po.quantity}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {po.totalCost > 0 ? formatPrice(po.totalCost) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={PRODUCTION_STATUS_COLORS[po.status] || ''}>
                                  {PRODUCTION_STATUS_LABELS[po.status] || po.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                {po.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================== DIALOGS ==================== */}

      {/* Material Form Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</DialogTitle>
            <DialogDescription>
              {editingMaterial ? 'Cập nhật thông tin nguyên liệu' : 'Nhập thông tin nguyên liệu mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên nguyên liệu</Label>
              <Input
                value={materialForm.name}
                onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                placeholder="VD: Dây thừng, Vải canvas..."
              />
            </div>
            <div>
              <Label>Đơn vị</Label>
              <Select value={materialForm.unit} onValueChange={(v) => setMaterialForm({ ...materialForm, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={materialForm.description}
                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                placeholder="Mô tả thêm (không bắt buộc)"
                rows={2}
              />
            </div>
            <div>
              <Label>Mức cảnh báo (tồn kho tối thiểu)</Label>
              <Input
                type="number"
                value={materialForm.minStock}
                onChange={(e) => setMaterialForm({ ...materialForm, minStock: e.target.value })}
                placeholder="VD: 10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveMaterial} disabled={saving || !materialForm.name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
              {editingMaterial ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nhập kho nguyên liệu</DialogTitle>
            <DialogDescription>Thêm nguyên liệu vào kho, hệ thống tự tính đơn giá trung bình</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chọn nguyên liệu</Label>
              <Select value={importForm.materialId} onValueChange={(v) => setImportForm({ ...importForm, materialId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nguyên liệu..." />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} (hiện có: {m.currentStock} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Số lượng</Label>
              <Input
                type="number"
                value={importForm.quantity}
                onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })}
                placeholder="VD: 100"
              />
            </div>
            <div>
              <Label>Tổng tiền (VNĐ)</Label>
              <Input
                type="number"
                value={importForm.totalPrice}
                onChange={(e) => setImportForm({ ...importForm, totalPrice: e.target.value })}
                placeholder="VD: 500000"
              />
            </div>
            <div>
              <Label>Nguồn nhập hàng</Label>
              <Input
                value={importForm.source}
                onChange={(e) => setImportForm({ ...importForm, source: e.target.value })}
                placeholder="VD: Shop ABC trên Shopee, link SP..."
              />
              <p className="text-xs text-muted-foreground mt-1">Tên shop, người bán hoặc link sản phẩm để tra cứu lại</p>
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea
                value={importForm.notes}
                onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
                placeholder="Ghi chú (không bắt buộc)"
                rows={2}
              />
            </div>
            {importForm.quantity && importForm.totalPrice && Number(importForm.quantity) > 0 && (
              <div className="bg-gray-50 rounded-md p-3 text-sm text-muted-foreground">
                Đơn giá dự kiến:{' '}
                <span className="font-medium text-foreground">
                  {formatPrice(Number(importForm.totalPrice) / Number(importForm.quantity))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveImport}
              disabled={saving || !importForm.materialId || !importForm.quantity}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
              Nhập kho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Form Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
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
                  placeholder="VD: Túi tote vải canvas"
                />
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
                placeholder="Mô tả sản phẩm (không bắt buộc)"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Giá bán (VNĐ)</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="VD: 150000"
                />
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

            {/* === CÔNG THỨC (Recipe) === */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-sm">CÔNG THỨC</h3>
              </div>

              {/* Existing recipe materials */}
              {recipeMaterials.length > 0 && (
                <div className="space-y-2 mb-3">
                  {recipeMaterials.map((rm, idx) => {
                    const mat = rawMaterials.find((m) => m.id === rm.materialId)
                    const qty = Number(rm.quantity) || 0
                    const unitPrice = mat?.unitPrice || 0
                    const cost = qty * unitPrice
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-md p-2 text-sm">
                        <span className="font-medium flex-1">{mat?.name || 'NL không xác định'}</span>
                        <span className="text-muted-foreground">× {qty} {mat?.unit || ''}</span>
                        <span className="text-muted-foreground">{formatPrice(unitPrice)}</span>
                        <span className="font-medium w-28 text-right">{formatPrice(cost)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => removeRecipeMaterial(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add new recipe material */}
              <div className="flex items-end gap-2 mb-3">
                <div className="flex-1">
                  <Label className="text-xs">Nguyên liệu</Label>
                  <Select
                    value={newRecipeMaterial.materialId}
                    onValueChange={(v) => setNewRecipeMaterial({ ...newRecipeMaterial, materialId: v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Chọn NL..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials
                        .filter((m) => !recipeMaterials.some((rm) => rm.materialId === m.id))
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Số lượng</Label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    value={newRecipeMaterial.quantity}
                    onChange={(e) => setNewRecipeMaterial({ ...newRecipeMaterial, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={addRecipeMaterial}
                  disabled={!newRecipeMaterial.materialId || !newRecipeMaterial.quantity}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm NL
                </Button>
              </div>

              {/* Total Cost */}
              <div className="flex items-center justify-between bg-white rounded-md p-3 border">
                <span className="font-semibold text-sm">TỔNG GIÁ VỐN</span>
                <span className="font-bold text-emerald-600 text-lg">{formatPrice(recipeTotalCost)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={saveProduct}
              disabled={saving || !productForm.name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
              {editingProduct ? 'Cập nhật' : 'Thêm SP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production Dialog */}
      <Dialog open={productionDialogOpen} onOpenChange={setProductionDialogOpen}>
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
                value={productionForm.quantity}
                onChange={(e) => setProductionForm({ ...productionForm, quantity: e.target.value })}
                placeholder="VD: 10"
              />
            </div>

            {/* Stock Check */}
            {selectedProductionRecipe.length > 0 && Number(productionForm.quantity) > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold">Kiểm tra nguyên liệu</span>
                </div>
                <div className="space-y-1">
                  {productionStockCheck.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.materialName}</span>
                        <span className="text-muted-foreground">Cần: {item.needed} {item.unit}</span>
                      </div>
                      <span className={item.sufficient ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
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
                placeholder="Ghi chú (không bắt buộc)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductionDialogOpen(false)}>
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
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Save className="w-4 h-4 mr-1 animate-spin" />}
              <Hammer className="w-4 h-4 mr-1" />
              Sản xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
