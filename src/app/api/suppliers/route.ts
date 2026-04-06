import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { Supplier } from '@/lib/types'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const suppliers: Supplier[] = (data || []).map((item) => toCamelCase<Supplier>(item))

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: snakeBody.name || '',
        phone: snakeBody.phone || '',
        address: snakeBody.address || '',
        notes: snakeBody.notes || '',
      })
      .select()
      .single()

    if (error) throw error

    const supplier = toCamelCase<Supplier>(data)
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
