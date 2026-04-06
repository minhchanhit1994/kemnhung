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

    // Fetch current order to get its existing status
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = existingOrder.status

    // Prevent invalid transitions
    if (previousStatus === 'completed' && status !== 'completed') {
      return NextResponse.json(
        { error: 'Không thể thay đổi đơn hàng đã hoàn thành' },
        { status: 400 }
      )
    }

    // Update order status
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

    // When order is completed → deduct stock from products
    if (status === 'completed' && previousStatus !== 'completed') {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id)

      if (itemsError) {
        console.error('Error fetching order items for stock deduction:', itemsError)
      } else if (itemsData && itemsData.length > 0) {
        // Deduct stock for each product in the order
        for (const item of itemsData) {
          if (!item.product_id || item.quantity <= 0) continue

          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .eq('id', item.product_id)
            .single()

          if (productError || !product) {
            console.error(`Product ${item.product_id} not found for stock deduction`)
            continue
          }

          const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity)

          const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock, updated_at: now })
            .eq('id', item.product_id)

          if (updateError) {
            console.error(`Failed to deduct stock for product ${item.product_id}:`, updateError)
          }
        }
      }
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
