import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { ProductionOrder } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('production_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Phiếu sản xuất không tồn tại' }, { status: 404 })
    }

    const order = toCamelCase<ProductionOrder>(data)

    // Fetch product name
    const { data: productData } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', order.productId)
      .single()

    if (productData) {
      order.product = { id: productData.id, name: productData.name }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching production order:', error)
    return NextResponse.json({ error: 'Failed to fetch production order' }, { status: 500 })
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

    if (snakeBody.status !== undefined) updateFields.status = snakeBody.status
    if (snakeBody.notes !== undefined) updateFields.notes = snakeBody.notes

    const { data, error } = await supabase
      .from('production_orders')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Không thể cập nhật phiếu sản xuất' }, { status: 500 })
    }

    const order = toCamelCase<ProductionOrder>(data)
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating production order:', error)
    return NextResponse.json({ error: 'Failed to update production order' }, { status: 500 })
  }
}
