import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { Product, ProductMaterial, RawMaterial } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === '1'
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', 1)
    }
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const products: Product[] = (data || []).map((item) => toCamelCase<Product>(item))

    // Fetch recipes (product_materials) for all products
    const productIds = products.map((p) => p.id)
    let recipeMap: Record<string, ProductMaterial[]> = {}

    if (productIds.length > 0) {
      const { data: pmData, error: pmError } = await supabase
        .from('product_materials')
        .select('*')
        .in('product_id', productIds)

      if (!pmError && pmData && pmData.length > 0) {
        // Fetch material details for all materials in recipes
        const materialIds = [...new Set(pmData.map((pm) => pm.material_id))]
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

        for (const pm of pmData) {
          const camelPm = toCamelCase<ProductMaterial>(pm)
          camelPm.material = materialInfoMap[pm.material_id]
          if (!recipeMap[pm.product_id]) {
            recipeMap[pm.product_id] = []
          }
          recipeMap[pm.product_id].push(camelPm)
        }
      }
    }

    const result = products.map((product) => ({
      ...product,
      productMaterials: recipeMap[product.id] || [],
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const id = crypto.randomUUID()

    const isActive = snakeBody.is_active !== undefined
      ? (snakeBody.is_active ? 1 : 0)
      : 1

    // Create product
    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        name: snakeBody.name || '',
        description: snakeBody.description || '',
        price: parseFloat(String(snakeBody.price)) || 0,
        cost_price: parseFloat(String(snakeBody.cost_price)) || 0,
        stock_quantity: parseInt(String(snakeBody.stock_quantity)) || 0,
        image_url: snakeBody.image_url || null,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) throw error

    // Handle materials (recipe)
    if (snakeBody.materials && Array.isArray(snakeBody.materials) && snakeBody.materials.length > 0) {
      const materials = snakeBody.materials as Array<{ material_id: string; quantity: number }>

      // Fetch all material unit prices
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

      // Insert product_materials
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
      const { error: updateError } = await supabase
        .from('products')
        .update({ cost_price: calculatedCostPrice })
        .eq('id', id)

      if (updateError) throw updateError

      data.cost_price = calculatedCostPrice
    }

    const product = toCamelCase<Product>(data)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
