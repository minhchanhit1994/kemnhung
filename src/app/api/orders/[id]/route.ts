import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase } from '@/lib/convert'
import { Order, OrderItem } from '@/lib/types'

const VALID_STATUSES = ['pending', 'completed', 'cancelled']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = toCamelCase<Order>(data)

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) throw itemsError

    const orderItems = itemsData.map((i) => toCamelCase<OrderItem>(i))

    return NextResponse.json({
      ...order,
      orderItems,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Status must be one of: pending, completed, cancelled' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(toCamelCase<Order>(data))
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check order exists and status allows deletion
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending' && order.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Only pending or cancelled orders can be deleted' },
        { status: 400 }
      )
    }

    // Delete order items first (in case no cascade is set)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id)

    if (itemsError) {
      console.error('Error deleting order items:', itemsError)
      // Continue with order deletion - cascade may handle it
    }

    // Delete the order
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
