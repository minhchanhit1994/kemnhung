import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { ShopInfo } from '@/lib/types'

export async function GET() {
  try {
    let shopInfo: ShopInfo | null = null

    const { data: existing, error: fetchError } = await supabase
      .from('shop_info')
      .select('*')
      .limit(1)

    if (fetchError) throw fetchError

    if (existing && existing.length > 0) {
      shopInfo = toCamelCase<ShopInfo>(existing[0])
    } else {
      // Create default shop info
      const { data: created, error: createError } = await supabase
        .from('shop_info')
        .insert({
          shop_name: 'Mộc Đậu Decor',
          phone: '',
          zalo: '',
          address: '',
          bank_name: '',
          bank_account: '',
          bank_account_name: '',
        })
        .select()
        .single()

      if (createError) throw createError
      shopInfo = toCamelCase<ShopInfo>(created)
    }

    return NextResponse.json(shopInfo)
  } catch (error) {
    console.error('Error fetching shop info:', error)
    return NextResponse.json({ error: 'Failed to fetch shop info' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const { data: existing, error: fetchError } = await supabase
      .from('shop_info')
      .select('id')
      .limit(1)

    if (fetchError) throw fetchError

    // Build update data - only include fields that are present in the body
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (snakeBody.shop_name !== undefined) updateData.shop_name = snakeBody.shop_name
    if (snakeBody.phone !== undefined) updateData.phone = snakeBody.phone
    if (snakeBody.zalo !== undefined) updateData.zalo = snakeBody.zalo
    if (snakeBody.address !== undefined) updateData.address = snakeBody.address
    if (snakeBody.bank_name !== undefined) updateData.bank_name = snakeBody.bank_name
    if (snakeBody.bank_account !== undefined) updateData.bank_account = snakeBody.bank_account
    if (snakeBody.bank_account_name !== undefined) updateData.bank_account_name = snakeBody.bank_account_name

    let shopInfo: ShopInfo

    if (existing && existing.length > 0) {
      const { data, error: updateError } = await supabase
        .from('shop_info')
        .update(updateData)
        .eq('id', existing[0].id)
        .select()
        .single()

      if (updateError) throw updateError
      shopInfo = toCamelCase<ShopInfo>(data)
    } else {
      const insertData: Record<string, unknown> = {
        shop_name: snakeBody.shop_name || 'Mộc Đậu Decor',
        phone: snakeBody.phone || '',
        zalo: snakeBody.zalo || '',
        address: snakeBody.address || '',
        bank_name: snakeBody.bank_name || '',
        bank_account: snakeBody.bank_account || '',
        bank_account_name: snakeBody.bank_account_name || '',
      }
      const { data, error: createError } = await supabase
        .from('shop_info')
        .insert(insertData)
        .select()
        .single()

      if (createError) throw createError
      shopInfo = toCamelCase<ShopInfo>(data)
    }

    return NextResponse.json(shopInfo)
  } catch (error) {
    console.error('Error updating shop info:', error)
    return NextResponse.json({ error: 'Failed to update shop info' }, { status: 500 })
  }
}
