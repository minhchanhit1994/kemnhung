import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import { Order, OrderItem } from '@/lib/types'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const orders = data.map((o) => toCamelCase<Order>(o))

    // Batch-fetch all order items
    const orderIds = orders.map((o) => o.id)
    let allItems: OrderItem[] = []

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError

      allItems = itemsData.map((i) => toCamelCase<OrderItem>(i))
    }

    // Group items by order
    const itemsByOrder = new Map<string, OrderItem[]>()
    for (const item of allItems) {
      const existing = itemsByOrder.get(item.orderId) || []
      existing.push(item)
      itemsByOrder.set(item.orderId, existing)
    }

    const ordersWithItems = orders.map((order) => ({
      ...order,
      orderItems: itemsByOrder.get(order.id) || [],
    }))

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerPhone, customerAddress, items, notes } = body

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name and at least one item are required' },
        { status: 400 }
      )
    }

    // Calculate total amount from items
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )

    const now = new Date().toISOString()

    const orderId = crypto.randomUUID()
    const orderData = {
      id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      customer_address: customerAddress || null,
      total_amount: totalAmount,
      status: 'pending',
      notes: notes || null,
      created_at: now,
      updated_at: now,
    }

    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItemsData = items.map(
      (item: { productId: string; productName: string; quantity: number; unitPrice: number }) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        created_at: now,
      })
    )

    const { data: itemsResult, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)
      .select()

    if (itemsError) throw itemsError

    const order = toCamelCase<Order>(orderResult)
    const orderItems = itemsResult.map((i) => toCamelCase<OrderItem>(i))

    return NextResponse.json({
      ...order,
      orderItems,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
