import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { ProductMaterial, RawMaterial } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ error: 'Thiếu product_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_materials')
      .select('*')
      .eq('product_id', productId)

    if (error) throw error

    const productMaterials: ProductMaterial[] = (data || []).map((item) => toCamelCase<ProductMaterial>(item))

    // Fetch material details
    const materialIds = [...new Set(productMaterials.map((pm) => pm.materialId))]
    let materialInfoMap: Record<string, RawMaterial> = {}

    if (materialIds.length > 0) {
      const { data: materialData } = await supabase
        .from('raw_materials')
        .select('*')
        .in('id', materialIds)

      if (materialData) {
        for (const m of materialData) {
          materialInfoMap[m.id] = toCamelCase<RawMaterial>(m)
        }
      }
    }

    const materials = productMaterials.map((pm) => ({
      ...pm,
      material: materialInfoMap[pm.materialId] || undefined,
    }))

    // Calculate total cost
    let totalCost = 0
    for (const pm of productMaterials) {
      const materialUnitPrice = materialInfoMap[pm.materialId]?.unitPrice || 0
      totalCost += pm.quantity * materialUnitPrice
    }

    return NextResponse.json({ materials, totalCost })
  } catch (error) {
    console.error('Error fetching product materials:', error)
    return NextResponse.json({ error: 'Failed to fetch product materials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const productId = String(snakeBody.product_id || '')
    const materialId = String(snakeBody.material_id || '')
    const quantity = parseFloat(String(snakeBody.quantity)) || 0

    if (!productId || !materialId) {
      return NextResponse.json({ error: 'Thiếu product_id hoặc material_id' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Số lượng phải lớn hơn 0' }, { status: 400 })
    }

    // Create product_material entry
    const id = crypto.randomUUID()

    const { data, error } = await supabase
      .from('product_materials')
      .insert({
        id,
        product_id: productId,
        material_id: materialId,
        quantity,
      })
      .select()
      .single()

    if (error) throw error

    // Recalculate product's costPrice
    await recalculateProductCost(productId)

    const productMaterial = toCamelCase<ProductMaterial>(data)
    return NextResponse.json(productMaterial, { status: 201 })
  } catch (error) {
    console.error('Error creating product material:', error)
    return NextResponse.json({ error: 'Failed to create product material' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })
    }

    // Get the product_material entry first to know the product_id
    const { data: pmData, error: pmError } = await supabase
      .from('product_materials')
      .select('id, product_id')
      .eq('id', id)
      .single()

    if (pmError || !pmData) {
      return NextResponse.json({ error: 'Bản ghi không tồn tại' }, { status: 404 })
    }

    // Delete the entry
    const { error: deleteError } = await supabase
      .from('product_materials')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Recalculate product's costPrice
    await recalculateProductCost(pmData.product_id)

    return NextResponse.json({ message: 'Đã xóa nguyên liệu khỏi công thức' })
  } catch (error) {
    console.error('Error deleting product material:', error)
    return NextResponse.json({ error: 'Failed to delete product material' }, { status: 500 })
  }
}

/**
 * Helper: Recalculate a product's cost_price from its recipe materials.
 */
async function recalculateProductCost(productId: string) {
  // Fetch all product_materials for this product
  const { data: pmData } = await supabase
    .from('product_materials')
    .select('material_id, quantity')
    .eq('product_id', productId)

  if (!pmData || pmData.length === 0) {
    // No recipe - set cost to 0
    await supabase
      .from('products')
      .update({ cost_price: 0, updated_at: new Date().toISOString() })
      .eq('id', productId)
    return
  }

  // Fetch material unit prices
  const materialIds = pmData.map((pm) => pm.material_id)
  const { data: materialData } = await supabase
    .from('raw_materials')
    .select('id, unit_price')
    .in('id', materialIds)

  const materialPriceMap: Record<string, number> = {}
  if (materialData) {
    for (const m of materialData) {
      materialPriceMap[m.id] = m.unit_price || 0
    }
  }

  // Calculate total cost
  let costPrice = 0
  for (const pm of pmData) {
    costPrice += (pm.quantity || 0) * (materialPriceMap[pm.material_id] || 0)
  }

  // Update product
  await supabase
    .from('products')
    .update({ cost_price: costPrice, updated_at: new Date().toISOString() })
    .eq('id', productId)
}
