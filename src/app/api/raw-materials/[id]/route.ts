import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { RawMaterial } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Nguyên liệu không tồn tại' }, { status: 404 })
    }

    const material = toCamelCase<RawMaterial>(data)
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error fetching raw material:', error)
    return NextResponse.json({ error: 'Failed to fetch raw material' }, { status: 500 })
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
    if (snakeBody.unit !== undefined) updateFields.unit = snakeBody.unit
    if (snakeBody.description !== undefined) updateFields.description = snakeBody.description
    if (snakeBody.current_stock !== undefined) updateFields.current_stock = parseFloat(String(snakeBody.current_stock)) || 0
    if (snakeBody.min_stock !== undefined) updateFields.min_stock = parseFloat(String(snakeBody.min_stock)) || 0
    if (snakeBody.unit_price !== undefined) updateFields.unit_price = parseFloat(String(snakeBody.unit_price)) || 0

    const { data, error } = await supabase
      .from('raw_materials')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Không thể cập nhật nguyên liệu' }, { status: 500 })
    }

    const material = toCamelCase<RawMaterial>(data)
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating raw material:', error)
    return NextResponse.json({ error: 'Failed to update raw material' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('raw_materials')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Đã xóa nguyên liệu' })
  } catch (error) {
    console.error('Error deleting raw material:', error)
    return NextResponse.json({ error: 'Failed to delete raw material' }, { status: 500 })
  }
}
