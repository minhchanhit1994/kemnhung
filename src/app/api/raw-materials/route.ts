import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { RawMaterial } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('raw_materials')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const materials: RawMaterial[] = (data || []).map((item) => toCamelCase<RawMaterial>(item))

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching raw materials:', error)
    return NextResponse.json({ error: 'Failed to fetch raw materials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const id = crypto.randomUUID()

    const { data, error } = await supabase
      .from('raw_materials')
      .insert({
        id,
        name: snakeBody.name || '',
        unit: snakeBody.unit || '',
        description: snakeBody.description || '',
        current_stock: 0,
        min_stock: parseFloat(String(snakeBody.min_stock)) || 0,
        unit_price: 0,
      })
      .select()
      .single()

    if (error) throw error

    const material = toCamelCase<RawMaterial>(data)
    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Error creating raw material:', error)
    return NextResponse.json({ error: 'Failed to create raw material' }, { status: 500 })
  }
}
