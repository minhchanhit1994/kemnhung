import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { Product, ProductMaterial, RawMaterial } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Sản phẩm không tồn tại' }, { status: 404 })
    }

    const product = toCamelCase<Product>(data)

    // Fetch recipe (product_materials with material details)
    const { data: pmData, error: pmError } = await supabase
      .from('product_materials')
      .select('*')
      .eq('product_id', id)

    if (!pmError && pmData && pmData.length > 0) {
      const materialIds = pmData.map((pm) => pm.material_id)
      const { data: materialData } = await supabase
        .from('raw_materials')
        .select('id, name, unit, unit_price')
        .in('id', materialIds)

      const materialInfoMap: Record<string, RawMaterial> = {}
      if (materialData) {
        for (const m of materialData) {
          materialInfoMap[m.id] = toCamelCase<RawMaterial>(m)
        }
      }

      product.productMaterials = pmData.map((pm) => ({
        ...toCamelCase<ProductMaterial>(pm),
        material: materialInfoMap[pm.material_id] || undefined,
      }))
    } else {
      product.productMaterials = []
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (snakeBody.name !== undefined) updateFields.name = snakeBody.name
    if (snakeBody.description !== undefined) updateFields.description = snakeBody.description
    if (snakeBody.price !== undefined) updateFields.price = parseFloat(String(snakeBody.price)) || 0
    if (snakeBody.stock_quantity !== undefined) updateFields.stock_quantity = parseInt(String(snakeBody.stock_quantity)) || 0
    if (snakeBody.image_url !== undefined) updateFields.image_url = snakeBody.image_url || null
    if (snakeBody.is_active !== undefined) updateFields.is_active = snakeBody.is_active ? 1 : 0

    // Update product basic fields
    const { data, error } = await supabase
      .from('products')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Không thể cập nhật sản phẩm' }, { status: 500 })
    }

    // Handle materials (recipe) replacement
    if (snakeBody.materials && Array.isArray(snakeBody.materials)) {
      const materials = snakeBody.materials as Array<{ material_id: string; quantity: number }>

      // Delete all existing product_materials for this product
      const { error: deleteError } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', id)

      if (deleteError) throw deleteError

      // Insert new product_materials if any
      if (materials.length > 0) {
        // Fetch material unit prices
        const materialIds = materials.map((m) => m.material_id)
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

        // Calculate cost price
        let calculatedCostPrice = 0
        for (const mat of materials) {
          calculatedCostPrice += (parseFloat(String(mat.quantity)) || 0) * (materialPriceMap[mat.material_id] || 0)
        }

        const pmInserts = materials.map((mat) => ({
          id: crypto.randomUUID(),
          product_id: id,
          material_id: mat.material_id,
          quantity: parseFloat(String(mat.quantity)) || 0,
        }))

        const { error: pmError } = await supabase
          .from('product_materials')
          .insert(pmInserts)

        if (pmError) throw pmError

        // Update product's cost_price
        const { error: costError } = await supabase
          .from('products')
          .update({ cost_price: calculatedCostPrice })
          .eq('id', id)

        if (costError) throw costError

        data.cost_price = calculatedCostPrice
      } else {
        // No materials - set cost_price to 0
        const { error: costError } = await supabase
          .from('products')
          .update({ cost_price: 0 })
          .eq('id', id)

        if (costError) throw costError

        data.cost_price = 0
      }
    }

    const product = toCamelCase<Product>(data)
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Đã xóa sản phẩm' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
