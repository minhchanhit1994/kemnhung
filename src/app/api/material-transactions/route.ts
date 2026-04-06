import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { MaterialTransaction } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('material_id')

    let query = supabase
      .from('material_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (materialId) {
      query = query.eq('material_id', materialId)
    }

    const { data, error } = await query

    if (error) throw error

    const transactions: MaterialTransaction[] = (data || []).map((item) => toCamelCase<MaterialTransaction>(item))

    // Fetch material details for all transactions
    const materialIds = [...new Set(transactions.map((t) => t.materialId))]

    let materialInfoMap: Record<string, { name: string; unit: string }> = {}

    if (materialIds.length > 0) {
      const { data: materialData } = await supabase
        .from('raw_materials')
        .select('id, name, unit')
        .in('id', materialIds)

      if (materialData) {
        for (const m of materialData) {
          materialInfoMap[m.id] = { name: m.name, unit: m.unit }
        }
      }
    }

    const result = transactions.map((t) => ({
      ...t,
      material: materialInfoMap[t.materialId]
        ? { name: materialInfoMap[t.materialId].name, unit: materialInfoMap[t.materialId].unit }
        : undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching material transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch material transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const materialId = String(snakeBody.material_id || '')
    const quantity = parseFloat(String(snakeBody.quantity)) || 0
    const totalPrice = parseFloat(String(snakeBody.total_price)) || 0

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Số lượng phải lớn hơn 0' }, { status: 400 })
    }

    if (totalPrice < 0) {
      return NextResponse.json({ error: 'Tổng tiền không được âm' }, { status: 400 })
    }

    // 1. Calculate unit price for this import
    const importUnitPrice = totalPrice / quantity

    // 2. Get current material stock and unit price
    const { data: material, error: materialError } = await supabase
      .from('raw_materials')
      .select('id, current_stock, unit_price')
      .eq('id', materialId)
      .single()

    if (materialError || !material) {
      return NextResponse.json({ error: 'Nguyên liệu không tồn tại' }, { status: 400 })
    }

    // 3. Calculate new average unit price
    const oldStock = material.current_stock || 0
    const oldUnitPrice = material.unit_price || 0
    const newTotalStock = oldStock + quantity
    const newAvgUnitPrice = newTotalStock > 0
      ? ((oldStock * oldUnitPrice) + totalPrice) / newTotalStock
      : importUnitPrice

    // 4. Update raw_materials: currentStock += quantity, unitPrice = new average
    const { error: updateError } = await supabase
      .from('raw_materials')
      .update({
        current_stock: newTotalStock,
        unit_price: newAvgUnitPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)

    if (updateError) throw updateError

    // 5. Create material_transaction with type='import'
    const id = crypto.randomUUID()

    const { data: transaction, error: txError } = await supabase
      .from('material_transactions')
      .insert({
        id,
        material_id: materialId,
        type: 'import',
        quantity,
        unit_price: importUnitPrice,
        total_price: totalPrice,
        supplier_id: snakeBody.supplier_id || null,
        notes: snakeBody.notes || '',
        source: snakeBody.source || '',
      })
      .select()
      .single()

    if (txError) throw txError

    const result = toCamelCase<MaterialTransaction>(transaction)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating material transaction:', error)
    return NextResponse.json({ error: 'Failed to create material transaction' }, { status: 500 })
  }
}
