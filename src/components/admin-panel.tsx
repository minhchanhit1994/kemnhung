import { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FlaskConical,
  LogOut,
  KeyRound,
  Hammer,
  ClipboardList,
  Settings,
  Ban,
  ChartSpline,
  Wrench,
  BookOpen,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  Product,
  RawMaterial,
  MaterialTransaction,
  ProductMaterial,
  ProductionOrder,
  Order,
  OrderItem,
  ShopInfo,
  WasteRecord,
} from '@/lib/types'
import BlogAdmin from '@/components/blog-admin'
import WatermarkStudio from '@/components/tools/watermark-studio'

// Sub-components
import { DashboardStats, AnalyticsData } from './admin-panel/types'
import { formatPrice, formatDate, formatDateShort, getTimeAgo } from './admin-panel/utils'
import DashboardTab from './admin-panel/DashboardTab'
import MaterialsTab from './admin-panel/MaterialsTab'
import ProductionTab from './admin-panel/ProductionTab'
import OrdersTab from './admin-panel/OrdersTab'
import WasteTab from './admin-panel/WasteTab'
import AnalyticsTab from './admin-panel/AnalyticsTab'
import SettingsTab from './admin-panel/SettingsTab'

// Dialogs
import MaterialDialog from './admin-panel/MaterialDialog'
import ImportDialog from './admin-panel/ImportDialog'
import ProductDialog from './admin-panel/ProductDialog'
import ProductionDialog from './admin-panel/ProductionDialog'
import OrderDialog from './admin-panel/OrderDialog'
import OrderDetailDialog from './admin-panel/OrderDetailDialog'

interface AdminPanelProps {
  onBack: () => void
  onLogout: () => void
  username: string
  onChangePassword: () => void
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

  // === Orders ===
  const [orders, setOrders] = useState<(Order & { orderItems?: OrderItem[] })[]>([])

  // === Waste Records ===
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([])
  const [wasteForm, setWasteForm] = useState({ materialId: '', quantity: '', note: 'Sản phẩm lỗi' })
  const [wasteSearch, setWasteSearch] = useState('')
  const [wasteSearchInput, setWasteSearchInput] = useState('')
  const [wasteBulkQuantities, setWasteBulkQuantities] = useState<Record<string, string>>({})
  const [wasteSaving, setWasteSaving] = useState(false)

  // === Shop Info ===
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    shopName: 'Mộc Đậu Decor',
    phone: '',
    zalo: '',
    address: '',
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [materialPage, setMaterialPage] = useState(1)
  const materialItemsPerPage = 10
  const [txPage, setTxPage] = useState(1)
  const txItemsPerPage = 15

  // === Analytics ===
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState(7)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [dbSetupStatus, setDbSetupStatus] = useState<'loading' | 'connected' | 'needs_setup' | 'not_configured' | 'error'>('loading')
  const [dbSetupSql, setDbSetupSql] = useState('')
  const [dbSetupDashboardUrl, setDbSetupDashboardUrl] = useState('')
  const [sqlCopied, setSqlCopied] = useState(false)
  const [setupRunning, setSetupRunning] = useState(false)

  // === UI State ===
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productSearchInput, setProductSearchInput] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderSearchInput, setOrderSearchInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // === Dialog States ===
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productionDialogOpen, setProductionDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<(Order & { orderItems?: OrderItem[] }) | null>(null)

  // === Form States ===
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [materialForm, setMaterialForm] = useState({ name: '', unit: 'cái', description: '', minStock: '10' })

  const [importForm, setImportForm] = useState({ materialId: '', quantity: '', totalPrice: '', source: '', notes: '' })
  const [importSearch, setImportSearch] = useState('')
  const [importDropdownOpen, setImportDropdownOpen] = useState(false)

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
  const [newRecipeMaterial, setNewRecipeMaterial] = useState({ materialId: '', quantity: '' })
  const [recipeSearch, setRecipeSearch] = useState('')
  const [recipeSearchInput, setRecipeSearchInput] = useState('')
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, string>>({})

  const [productionForm, setProductionForm] = useState({ productId: '', quantity: '', notes: '' })

  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  })
  const [orderItems, setOrderItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([])
  const [newOrderItem, setNewOrderItem] = useState({ productId: '', quantity: '' })

  const videoInputRef = useRef<HTMLInputElement>(null)

  // === Fetch All Data ===
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [materialsRes, transactionsRes, productsRes, productionRes, dashboardRes, ordersRes, shopInfoRes, wasteRes] = await Promise.all([
        fetch('/api/raw-materials'),
        fetch('/api/material-transactions'),
        fetch('/api/products'),
        fetch('/api/production-orders'),
        fetch('/api/dashboard'),
        fetch('/api/orders'),
        fetch('/api/shop-info'),
        fetch('/api/waste-records').catch(() => null),
      ])
      if (materialsRes.ok) setRawMaterials(await materialsRes.json())
      if (transactionsRes.ok) setMaterialTransactions(await transactionsRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (productionRes.ok) setProductionOrders(await productionRes.json())
      if (dashboardRes.ok) setStats(await dashboardRes.json())
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (wasteRes && wasteRes.ok) setWasteRecords(await wasteRes.json())
      if (shopInfoRes.ok) {
        const info = await shopInfoRes.json()
        setShopInfo(info)
        setSettingsForm({
          shopName: info.shopName || 'Mộc Đậu Decor',
          phone: info.phone || '',
          zalo: info.zalo || '',
          address: info.address || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // === Analytics Fetch ===
  const fetchAnalytics = useCallback(async (period: number) => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`)
      if (res.ok) {
        setAnalyticsData(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // === DB Setup Check ===
  const checkDbSetup = useCallback(async () => {
    setDbSetupStatus('loading')
    try {
      const res = await fetch('/api/analytics/setup')
      if (res.ok) {
        const data = await res.json()
        setDbSetupSql(data.sql || '')
        setDbSetupDashboardUrl(data.supabaseDashboardUrl || '')
        if (data.status === 'CONNECTED') setDbSetupStatus('connected')
        else if (data.status === 'NEEDS_SETUP') setDbSetupStatus('needs_setup')
        else if (data.status === 'NOT_CONFIGURED') setDbSetupStatus('not_configured')
        else setDbSetupStatus('error')
      }
    } catch {
      setDbSetupStatus('error')
    }
  }, [])

  const runAutoSetup = useCallback(async () => {
    setSetupRunning(true)
    try {
      const res = await fetch('/api/analytics/setup', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          await checkDbSetup()
        } else {
          setDbSetupStatus('needs_setup')
        }
      }
    } catch {
      setDbSetupStatus('error')
    } finally {
      setSetupRunning(false)
    }
  }, [checkDbSetup])

  const copySql = useCallback(() => {
    navigator.clipboard.writeText(dbSetupSql).then(() => {
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 3000)
    })
  }, [dbSetupSql])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const timer = setTimeout(() => setProductSearch(productSearchInput), 300)
    return () => clearTimeout(timer)
  }, [productSearchInput])

  useEffect(() => {
    const timer = setTimeout(() => setOrderSearch(orderSearchInput), 300)
    return () => clearTimeout(timer)
  }, [orderSearchInput])

  useEffect(() => {
    const timer = setTimeout(() => setWasteSearch(wasteSearchInput), 300)
    return () => clearTimeout(timer)
  }, [wasteSearchInput])

  useEffect(() => {
    const timer = setTimeout(() => setRecipeSearch(recipeSearchInput), 300)
    return () => clearTimeout(timer)
  }, [recipeSearchInput])

  useEffect(() => {
    setMaterialPage(1)
  }, [search])

  // Fetch analytics when tab switches to analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      checkDbSetup()
      fetchAnalytics(analyticsPeriod)
    }
  }, [activeTab, analyticsPeriod, fetchAnalytics, checkDbSetup])

  // === Helpers moved to utils.ts ===

  const deferredSearch = useDeferredValue(search)
  const deferredProductSearch = useDeferredValue(productSearch)
  const deferredOrderSearch = useDeferredValue(orderSearch)

  // === Computed Values ===
  const lowStockMaterials = useMemo(
    () => rawMaterials.filter((m) => m.minStock > 0 && m.currentStock <= m.minStock),
    [rawMaterials]
  )

  const filteredMaterials = useMemo(
    () => rawMaterials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [rawMaterials, search]
  )

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(deferredProductSearch.toLowerCase())),
    [products, deferredProductSearch]
  )

  // Reserved stock per product (from pending orders)
  const reservedStockMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const order of orders) {
      if (order.status !== 'pending' || !order.orderItems) continue
      for (const item of order.orderItems) {
        map[item.productId] = (map[item.productId] || 0) + item.quantity
      }
    }
    return map
  }, [orders])

  const filteredOrders = useMemo(() => {
    const s = deferredOrderSearch.toLowerCase()
    if (!s) return orders
    return orders.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(s) ||
        o.customerPhone?.toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s)
    )
  }, [orders, deferredOrderSearch])

  // Order totals
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [orderItems])

  // === Computed Values ===
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
    setSearch('')
    setSearchInput('')
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
    setImportSearch('')
    setSearchInput('') // Also reset global search
    setImportDropdownOpen(false)
    setImportDialogOpen(true)
  }

  const saveImport = async (items: Array<{ materialId: string; quantity: number; totalPrice: number }>, source: string, notes: string) => {
    try {
      setSaving(true)
      const res = await fetch('/api/material-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          source,
          notes,
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
        videoUrl: product.videoUrl || '',
        isActive: product.isActive,
      })
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
      setProductForm({ name: '', description: '', price: '', unit: 'cái', imageUrl: '', videoUrl: '', isActive: true })
      setRecipeMaterials([])
      setProductMaterials(null)
    }
    setNewRecipeMaterial({ materialId: '', quantity: '' })
    setRecipeSearch('')
    setRecipeSearchInput('')
    setIsBulkMode(false)
    setBulkQuantities({})
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

  const toggleProductVisibility = async (product: { id: string; name: string; isActive: boolean }) => {
    const action = product.isActive ? 'ẩn' : 'hiện'
    if (!confirm(`Bạn có chắc muốn ${action} sản phẩm "${product.name}" khỏi trang chủ?`)) return
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (res.ok) fetchAll()
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation: max 30 seconds
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 30) {
          alert('Video quá dài! Vui lòng chọn video dưới 30 giây.')
          return
        }
        // Proceed with upload
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

  // === Orders CRUD ===
  const openOrderDialog = () => {
    setOrderForm({ customerName: '', customerPhone: '', customerAddress: '', notes: '' })
    setOrderItems([])
    setNewOrderItem({ productId: '', quantity: '' })
    setOrderSearch('')
    setOrderSearchInput('')
    setOrderDialogOpen(true)
  }

  const addOrderItem = () => {
    const product = products.find((p) => p.id === newOrderItem.productId)
    if (!newOrderItem.productId || !newOrderItem.quantity || !product) return
    const qty = Number(newOrderItem.quantity) || 0
    // Check available stock (total - reserved)
    const reserved = reservedStockMap[product.id] || 0
    const available = product.stockQuantity - reserved
    if (qty > available) {
      alert(`Sản phẩm "${product.name}" chỉ còn ${available} sản phẩm khả dụng!`)
      return
    }
    setOrderItems([
      ...orderItems,
      {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
      },
    ])
    setNewOrderItem({ productId: '', quantity: '' })
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const saveOrder = async () => {
    if (orderItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm!')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          customerAddress: orderForm.customerAddress,
          notes: orderForm.notes,
          items: orderItems,
        }),
      })
      if (res.ok) {
        setOrderDialogOpen(false)
        fetchAll()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi tạo đơn hàng')
      }
    } catch (error) {
      console.error('Order error:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrderDetailDialogOpen(false)
        fetchAll()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi cập nhật đơn hàng')
      }
    } catch (error) {
      console.error('Order update error:', error)
    } finally {
      setSaving(false)
    }
  }

  const viewOrderDetail = (order: Order & { orderItems?: OrderItem[] }) => {
    setSelectedOrder(order)
    setOrderDetailDialogOpen(true)
  }

  // === Print Invoice ===
  const printInvoice = (order: Order & { orderItems?: OrderItem[] }) => {
    const shopName = shopInfo?.shopName || 'Mộc Đậu Decor'
    const shopPhone = shopInfo?.phone || ''
    const shopAddress = shopInfo?.address || ''
    const now = new Date()
    const invoiceDate = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const invoiceTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const orderId = order.id.substring(0, 8).toUpperCase()
    const items = order.orderItems || []

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Hóa đơn bán lẻ - ${orderId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 20px; }
  .invoice { max-width: 350px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
  .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
  .header h1 { font-size: 18px; color: #059669; margin-bottom: 2px; }
  .header p { font-size: 11px; color: #666; }
  .header .shop-info { margin-top: 6px; font-size: 11px; color: #555; }
  .title-row { text-align: center; margin-bottom: 10px; }
  .title-row h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 10px; border: 1px solid #eee; padding: 8px; border-radius: 4px; }
  .info-grid .label { color: #888; }
  .info-grid .value { font-weight: 500; }
  .customer-info { font-size: 11px; margin-bottom: 10px; border: 1px solid #eee; padding: 8px; border-radius: 4px; }
  .customer-info .label { color: #888; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
  th { background: #f0fdf4; color: #059669; padding: 6px 4px; text-align: left; font-weight: 600; border-bottom: 1px solid #ddd; font-size: 10px; }
  td { padding: 5px 4px; border-bottom: 1px dotted #eee; vertical-align: top; }
  td:last-child { text-align: right; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 10px; }
  .total-row .total-label { font-size: 12px; font-weight: 600; color: #059669; }
  .total-row .total-value { font-size: 18px; font-weight: 800; color: #059669; }
  .amount-words { text-align: center; font-size: 11px; font-style: italic; color: #666; margin-bottom: 10px; padding: 6px; background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; }
  .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; }
  .thank-you { text-align: center; font-size: 12px; font-weight: 600; color: #059669; margin-bottom: 8px; }
  @media print {
    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .invoice { border: none; padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>${shopName}</h1>
      ${shopAddress ? `<p>${shopAddress}</p>` : ''}
      ${shopPhone ? `<p>ĐT: ${shopPhone}</p>` : ''}
    </div>
    <div class="title-row"><h2>Hóa đơn bán lẻ</h2></div>
    <div class="info-grid">
      <div><span class="label">Mã HD: </span><span class="value">${orderId}</span></div>
      <div><span class="label">Ngày: </span><span class="value">${invoiceDate}</span></div>
      <div><span class="label">Ngày ĐH: </span><span class="value">${orderDate}</span></div>
      <div><span class="label">Giờ: </span><span class="value">${invoiceTime}</span></div>
    </div>
    <div class="customer-info">
      <div><span class="label">Khách hàng: </span><strong>${order.customerName || '—'}</strong></div>
      ${order.customerPhone ? `<div><span class="label">SĐT: </span>${order.customerPhone}</div>` : ''}
      ${order.customerAddress ? `<div><span class="label">Địa chỉ: </span>${order.customerAddress}</div>` : ''}
    </div>
    <table>
      <thead><tr><th>STT</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>TT</th></tr></thead>
      <tbody>
        ${items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.productName}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${new Intl.NumberFormat('vi-VN').format(item.unitPrice)}</td><td style="text-align:right">${new Intl.NumberFormat('vi-VN').format(item.unitPrice * item.quantity)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="total-row">
      <span class="total-label">TỔNG CỘNG:</span>
      <span class="total-value">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
    </div>
    <div class="amount-words">Bằng chữ: ${numberToVietnameseWords(order.totalAmount)}</div>
    <div class="thank-you">Cảm ơn quý khách đã ủng hộ!</div>
    <div class="footer">
      ${shopName} &bull; ${shopPhone || ''}<br>
      Hóa đơn được tạo lúc ${invoiceTime} ngày ${invoiceDate}
    </div>
  </div>
  <div class="no-print" style="text-align:center;margin-top:16px;">
    <button onclick="window.print()" style="padding:10px 30px;font-size:14px;background:#059669;color:white;border:none;border-radius:8px;cursor:pointer;">🖨️ In hóa đơn</button>
  </div>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=400,height=700')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  // === Settings ===

  // === Settings ===
  const saveSettings = async () => {
    try {
      setSettingsSaving(true)
      setSettingsSaved(false)
      const res = await fetch('/api/shop-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })
      if (res.ok) {
        const data = await res.json()
        setShopInfo(data)
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 3000)
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi lưu cài đặt')
      }
    } catch (error) {
      console.error('Settings error:', error)
      alert('Lỗi lưu cài đặt')
    } finally {
      setSettingsSaving(false)
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
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <h1 className="font-bold text-lg text-forest">Quản trị</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-forest/10 text-forest">
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
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <ChartSpline className="w-4 h-4" />
              <span className="hidden sm:inline">Thống kê</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Nguyên liệu</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <Hammer className="w-4 h-4" />
              <span className="hidden sm:inline">Thành phẩm</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Đơn hàng</span>
            </TabsTrigger>
            <TabsTrigger value="waste" className="gap-2 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-800">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Hao hụt</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-mint-dark/30 data-[state=active]:text-forest-dark">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Công cụ</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== Tab 1: TỔNG QUAN ==================== */}
          <TabsContent value="dashboard">
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={stats}
                rawMaterials={rawMaterials}
                products={products}
                orders={orders}
                lowStockMaterials={lowStockMaterials}
                viewOrderDetail={viewOrderDetail}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: BLOG ==================== */}
          <TabsContent value="blog">
            {activeTab === 'blog' && <BlogAdmin />}
          </TabsContent>

          {/* ==================== Tab 2: NGUYÊN LIỆU ==================== */}
          <TabsContent value="materials">
            {activeTab === 'materials' && (
              <MaterialsTab
                rawMaterials={rawMaterials}
                materialTransactions={materialTransactions}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                materialPage={materialPage}
                setMaterialPage={setMaterialPage}
                materialItemsPerPage={materialItemsPerPage}
                filteredMaterials={filteredMaterials}
                txPage={txPage}
                setTxPage={setTxPage}
                txItemsPerPage={txItemsPerPage}
                openMaterialDialog={openMaterialDialog}
                deleteMaterial={deleteMaterial}
                openImportDialog={openImportDialog}
              />
            )}
          </TabsContent>

          {/* ==================== Tab 3: THÀNH PHẨM ==================== */}
          <TabsContent value="production">
            {activeTab === 'production' && (
              <ProductionTab
                products={products}
                productionOrders={productionOrders}
                productSearchInput={productSearchInput}
                setProductSearchInput={setProductSearchInput}
                productSearch={productSearch}
                reservedStockMap={reservedStockMap}
                filteredProducts={filteredProducts}
                toggleProductVisibility={toggleProductVisibility}
                openProductDialog={openProductDialog}
                deleteProduct={deleteProduct}
                openProductionDialog={openProductionDialog}
              />
            )}
          </TabsContent>

          {/* ==================== Tab 4: ĐƠN HÀNG ==================== */}
          <TabsContent value="orders">
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                orderSearchInput={orderSearchInput}
                setOrderSearchInput={setOrderSearchInput}
                filteredOrders={filteredOrders}
                viewOrderDetail={viewOrderDetail}
                updateOrderStatus={updateOrderStatus}
                openOrderDialog={openOrderDialog}
                saving={saving}
              />
            )}
          </TabsContent>

      {/* ==================== DIALOGS ==================== */}

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
        recipeSearch={recipeSearch}
        bulkQuantities={bulkQuantities}
        setBulkQuantities={setBulkQuantities}
        removeRecipeMaterial={removeRecipeMaterial}
        saveProduct={saveProduct}
        saving={saving}
      />

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

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        orderItems={orderItems}
        removeOrderItem={removeOrderItem}
        newOrderItem={newOrderItem}
        setNewOrderItem={setNewOrderItem}
        products={products}
        reservedStockMap={reservedStockMap}
        addOrderItem={addOrderItem}
        orderTotal={orderTotal}
        saveOrder={saveOrder}
        saving={saving}
      />

      <OrderDetailDialog
        open={orderDetailDialogOpen}
        onOpenChange={setOrderDetailDialogOpen}
        selectedOrder={selectedOrder}
        printInvoice={printInvoice}
        updateOrderStatus={updateOrderStatus}
        saving={saving}
      />

      {/* ==================== Tab 5: HAO HỤT ==================== */}
          <TabsContent value="waste">
            {activeTab === 'waste' && (
              <WasteTab
                rawMaterials={rawMaterials}
                wasteRecords={wasteRecords}
                wasteForm={wasteForm}
                setWasteForm={setWasteForm}
                wasteSearchInput={wasteSearchInput}
                setWasteSearchInput={setWasteSearchInput}
                wasteSearch={wasteSearch}
                wasteBulkQuantities={wasteBulkQuantities}
                setWasteBulkQuantities={setWasteBulkQuantities}
                wasteSaving={wasteSaving}
                setWasteSaving={setWasteSaving}
                fetchAll={fetchAll}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: THỐNG KÊ ==================== */}
          <TabsContent value="analytics">
            {activeTab === 'analytics' && (
              <AnalyticsTab
                analyticsData={analyticsData}
                analyticsLoading={analyticsLoading}
                analyticsPeriod={analyticsPeriod}
                setAnalyticsPeriod={setAnalyticsPeriod}
                dbSetupStatus={dbSetupStatus}
                checkDbSetup={checkDbSetup}
                runAutoSetup={runAutoSetup}
                setupRunning={setupRunning}
                dbSetupSql={dbSetupSql}
                copySql={copySql}
                sqlCopied={sqlCopied}
                dbSetupDashboardUrl={dbSetupDashboardUrl}
                getTimeAgo={getTimeAgo}
              />
            )}
          </TabsContent>

          {/* ==================== Tab: CÀI ĐẶT ==================== */}
          <TabsContent value="settings">
            {activeTab === 'settings' && (
              <SettingsTab
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
                settingsSaving={settingsSaving}
                settingsSaved={settingsSaved}
                saveSettings={saveSettings}
                shopInfo={shopInfo}
                formatDate={formatDate}
              />
            )}
          </TabsContent>
          <TabsContent value="tools">
            {activeTab === 'tools' && <WatermarkStudio />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
