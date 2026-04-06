import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase } from '@/lib/convert'
import type { ProductionOrder, Order, OrderItem } from '@/lib/types'

export interface MonthlyFinance {
  month: string       // "YYYY-MM"
  revenue: number
  capital: number
  profit: number
}

export async function GET() {
  try {
    // === Basic Counts ===
    const { count: totalRawMaterials } = await supabase
      .from('raw_materials')
      .select('*', { count: 'exact', head: true })

    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', 1)

    const { count: totalProductionOrders } = await supabase
      .from('production_orders')
      .select('*', { count: 'exact', head: true })

    // Low stock materials (current_stock <= min_stock AND min_stock > 0)
    const { data: lowStockData } = await supabase
      .from('raw_materials')
      .select('id, name, current_stock, min_stock, unit')
      .gt('min_stock', 0)

    const lowStockMaterials = (lowStockData || [])
      .filter((m) => m.current_stock <= m.min_stock)
      .map((m) => ({
        id: m.id,
        name: m.name,
        currentStock: m.current_stock,
        minStock: m.min_stock,
        unit: m.unit,
      }))

    // === Financial Data ===

    // 1. Total revenue from completed orders
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')

    const totalRevenue = (completedOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)

    // 2. Total capital invested in raw materials (sum of all import transaction total_price)
    const { data: importTxs } = await supabase
      .from('material_transactions')
      .select('total_price, created_at')
      .eq('type', 'import')

    const totalCapital = (importTxs || []).reduce((sum, tx) => sum + (tx.total_price || 0), 0)

    // 3. Total production cost (sum of all production_orders total_cost)
    const { data: allProductionOrders } = await supabase
      .from('production_orders')
      .select('total_cost')

    const totalProductionCost = (allProductionOrders || []).reduce((sum, po) => sum + (po.total_cost || 0), 0)

    // 4. COGS: Cost of goods sold = for completed orders, sum(product.cost_price × order_item.quantity)
    let totalCogs = 0
    if (completedOrders && completedOrders.length > 0) {
      const orderIds = completedOrders.map((o) => o.id)

      const { data: allOrderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .in('order_id', orderIds)

      if (allOrderItems && allOrderItems.length > 0) {
        const productIds = [...new Set(allOrderItems.map((item) => item.product_id))]

        const { data: productCostData } = await supabase
          .from('products')
          .select('id, cost_price')
          .in('id', productIds)

        const costMap: Record<string, number> = {}
        if (productCostData) {
          for (const p of productCostData) {
            costMap[p.id] = p.cost_price || 0
          }
        }

        for (const item of allOrderItems) {
          totalCogs += (item.quantity || 0) * (costMap[item.product_id] || 0)
        }
      }
    }

    // 5. Profit = Revenue - COGS
    const totalProfit = totalRevenue - totalCogs

    // === Monthly Financial Breakdown ===
    // Gather all data points with dates for monthly aggregation

    // Revenue by month (from completed orders)
    const revenueByMonth: Record<string, number> = {}
    for (const order of completedOrders || []) {
      const month = order.created_at?.substring(0, 7) || 'unknown'
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (order.total_amount || 0)
    }

    // Capital by month (from import transactions)
    const capitalByMonth: Record<string, number> = {}
    for (const tx of importTxs || []) {
      const month = tx.created_at?.substring(0, 7) || 'unknown'
      capitalByMonth[month] = (capitalByMonth[month] || 0) + (tx.total_price || 0)
    }

    // COGS by month (from completed order items)
    const cogsByMonth: Record<string, number> = {}
    if (completedOrders && completedOrders.length > 0) {
      const orderDateMap: Record<string, string> = {}
      for (const order of completedOrders) {
        orderDateMap[order.id] = order.created_at?.substring(0, 7) || 'unknown'
      }

      const orderIds = completedOrders.map((o) => o.id)
      const { data: monthlyOrderItems } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity')
        .in('order_id', orderIds)

      if (monthlyOrderItems) {
        const productIds = [...new Set(monthlyOrderItems.map((item) => item.product_id))]
        const { data: monthlyProductCosts } = await supabase
          .from('products')
          .select('id, cost_price')
          .in('id', productIds)

        const costMap: Record<string, number> = {}
        if (monthlyProductCosts) {
          for (const p of monthlyProductCosts) {
            costMap[p.id] = p.cost_price || 0
          }
        }

        for (const item of monthlyOrderItems) {
          const month = orderDateMap[item.order_id] || 'unknown'
          const itemCost = (item.quantity || 0) * (costMap[item.product_id] || 0)
          cogsByMonth[month] = (cogsByMonth[month] || 0) + itemCost
        }
      }
    }

    // Combine all months
    const allMonths = new Set([
      ...Object.keys(revenueByMonth),
      ...Object.keys(capitalByMonth),
      ...Object.keys(cogsByMonth),
    ])

    const monthlyFinance: MonthlyFinance[] = Array.from(allMonths)
      .filter((m) => m !== 'unknown')
      .sort()
      .map((month) => {
        const rev = revenueByMonth[month] || 0
        const cap = capitalByMonth[month] || 0
        const cogs = cogsByMonth[month] || 0
        return {
          month,
          revenue: rev,
          capital: cap,
          profit: rev - cogs,
        }
      })

    // === Recent Production Orders ===
    const { data: recentProductionData } = await supabase
      .from('production_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    let recentProductionOrders: ProductionOrder[] = []

    if (recentProductionData && recentProductionData.length > 0) {
      const poProductIds = [...new Set(recentProductionData.map((po) => po.product_id))]
      let productNameMap: Record<string, { id: string; name: string }> = {}

      if (poProductIds.length > 0) {
        const { data: poProductData } = await supabase
          .from('products')
          .select('id, name')
          .in('id', poProductIds)

        if (poProductData) {
          for (const p of poProductData) {
            productNameMap[p.id] = { id: p.id, name: p.name }
          }
        }
      }

      recentProductionOrders = recentProductionData.map((po) => ({
        ...toCamelCase<Partial<ProductionOrder>>(po),
        product: productNameMap[po.product_id] || undefined,
      })) as ProductionOrder[]
    }

    // === Recent Orders ===
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    let recentOrders: Order[] = []

    if (recentOrdersData && recentOrdersData.length > 0) {
      const orderIds = recentOrdersData.map((o) => o.id)

      const { data: allItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)

      const itemsByOrder: Record<string, OrderItem[]> = {}
      if (allItems) {
        for (const item of allItems) {
          const camelItem = toCamelCase<OrderItem>(item)
          if (!itemsByOrder[item.order_id]) {
            itemsByOrder[item.order_id] = []
          }
          itemsByOrder[item.order_id].push(camelItem)
        }
      }

      recentOrders = recentOrdersData.map((o) => ({
        ...toCamelCase<Order>(o),
        orderItems: itemsByOrder[o.id] || [],
      }))
    }

    return NextResponse.json({
      totalRawMaterials: totalRawMaterials || 0,
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      lowStockMaterials,
      totalProductionOrders: totalProductionOrders || 0,
      recentProductionOrders,
      totalRevenue,
      recentOrders,
      // New financial fields
      totalCapital,
      totalProductionCost,
      totalCogs,
      totalProfit,
      monthlyFinance,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
