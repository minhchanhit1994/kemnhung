export interface RawMaterial {
  id: string
  name: string
  unit: string
  description: string
  currentStock: number
  minStock: number
  unitPrice: number  // average unit price (total spent / total quantity)
  totalCost: number  // total investment cost
  createdAt: string
  updatedAt: string
}

export interface MaterialTransaction {
  id: string
  materialId: string
  type: 'import' | 'export' | 'adjustment'
  quantity: number
  unitPrice: number
  totalPrice: number
  supplierId: string | null
  source: string
  notes: string
  createdAt: string
  // joined fields
  material?: { name: string; unit: string }
}

export interface ProductMaterial {
  id: string
  productId: string
  materialId: string
  quantity: number  // how many units of this material per product
  createdAt: string
  // joined
  material?: RawMaterial
}

export interface Product {
  id: string
  name: string
  description: string
  price: number        // sell price
  costPrice: number    // auto-calculated cost
  importPrice: number
  supplier: string
  stockQuantity: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  unit: string
  productMaterials?: ProductMaterial[]  // recipe
}

export interface ProductionOrder {
  id: string
  productId: string
  quantity: number
  totalCost: number
  notes: string
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  product?: { id: string; name: string }
}

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  notes: string
  createdAt: string
  updatedAt: string
  orderItems?: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  createdAt: string
}

export interface ShopInfo {
  id: string
  shopName: string
  phone: string
  zalo: string
  address: string
  bankName: string
  bankAccount: string
  bankAccountName: string
  createdAt: string
  updatedAt: string
}
