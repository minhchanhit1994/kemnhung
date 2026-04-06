import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { ProductionOrder } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('production_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    const productionOrders: ProductionOrder[] = (data || []).map((item) => toCamelCase<ProductionOrder>(item))

    // Fetch product names (only id + name)
    const productIds = [...new Set(productionOrders.map((po) => po.productId))]
    let productNameMap: Record<string, { id: string; name: string }> = {}

    if (productIds.length > 0) {
      const { data: productData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds)

      if (productData) {
        for (const p of productData) {
          productNameMap[p.id] = { id: p.id, name: p.name }
        }
      }
    }

    const result = productionOrders.map((po) => ({
      ...po,
      product: productNameMap[po.productId] || undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching production orders:', error)
    return NextResponse.json({ error: 'Failed to fetch production orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const productId = String(snakeBody.product_id || '')
    const productionQuantity = parseFloat(String(snakeBody.quantity)) || 0

    if (productionQuantity <= 0) {
      return NextResponse.json({ error: 'Số lượng sản xuất phải lớn hơn 0' }, { status: 400 })
    }

    // 1. Get the product's recipe from product_materials
    const { data: recipe, error: recipeError } = await supabase
      .from('product_materials')
      .select('*')
      .eq('product_id', productId)

    if (recipeError) throw recipeError

    if (!recipe || recipe.length === 0) {
      return NextResponse.json(
        { error: 'Sản phẩm chưa có công thức nguyên liệu' },
        { status: 400 }
      )
    }

    // 2. Get current stock and unit price for all materials in the recipe
    const materialIds = recipe.map((r) => r.material_id)
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('id, name, current_stock, unit_price')
      .in('id', materialIds)

    if (materialsError) throw materialsError

    // Build material info map
    const materialInfoMap: Record<string, { name: string; currentStock: number; unitPrice: number }> = {}
    for (const m of materials || []) {
      materialInfoMap[m.id] = {
        name: m.name,
        currentStock: m.current_stock || 0,
        unitPrice: m.unit_price || 0,
      }
    }

    // 3. Check if enough stock for all materials
    for (const recipeItem of recipe) {
      const needed = recipeItem.quantity * productionQuantity
      const available = materialInfoMap[recipeItem.material_id]?.currentStock || 0
      const name = materialInfoMap[recipeItem.material_id]?.name || 'Unknown'

      if (available < needed) {
        return NextResponse.json({
          error: `Nguyên liệu ${name} không đủ. Cần ${needed}, hiện có ${available}`,
        }, { status: 400 })
      }
    }

    // 4. All materials sufficient - proceed with production
    let totalCost = 0

    // Deduct material stock
    for (const recipeItem of recipe) {
      const toSubtract = recipeItem.quantity * productionQuantity
      const currentStock = materialInfoMap[recipeItem.material_id].currentStock
      const unitPrice = materialInfoMap[recipeItem.material_id].unitPrice

      totalCost += toSubtract * unitPrice

      const { error: updateError } = await supabase
        .from('raw_materials')
        .update({
          current_stock: currentStock - toSubtract,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipeItem.material_id)

      if (updateError) console.error(`Failed to update stock for material ${recipeItem.material_id}:`, updateError)
    }

    // Add to product stock_quantity
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single()

    if (!productError && product) {
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({
          stock_quantity: (product.stock_quantity || 0) + productionQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (productUpdateError) console.error('Failed to update product stock:', productUpdateError)
    }

    // Create production_order with status='completed'
    const id = crypto.randomUUID()

    const { data: productionOrder, error: poError } = await supabase
      .from('production_orders')
      .insert({
        id,
        product_id: productId,
        quantity: productionQuantity,
        total_cost: totalCost,
        notes: snakeBody.notes || '',
        status: 'completed',
      })
      .select()
      .single()

    if (poError) throw poError

    // Get product name for response
    const { data: productData } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single()

    const result = toCamelCase<ProductionOrder>(productionOrder)
    result.product = productData ? { id: productData.id, name: productData.name } : undefined

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating production order:', error)
    return NextResponse.json({ error: 'Failed to create production order' }, { status: 500 })
  }
}
