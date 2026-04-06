import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// POST /api/auth/seed - create default admin if not exists
export async function POST() {
  try {
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin')
      .select('id, username')
      .eq('username', 'admin')
      .single()

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin đã tồn tại',
        admin: { username: existingAdmin.username },
      })
    }

    // Insert default admin (ignore checkError since it means no record found)
    const { data: admin, error: insertError } = await supabase
      .from('admin')
      .insert({
        username: 'admin',
        password: hashPassword('admin123'),
      })
      .select('id, username')
      .single()

    if (insertError) {
      // Handle race condition - admin might have been created by another request
      const { data: retryAdmin } = await supabase
        .from('admin')
        .select('id, username')
        .eq('username', 'admin')
        .single()

      if (retryAdmin) {
        return NextResponse.json({
          message: 'Admin đã tồn tại',
          admin: { username: 'admin' },
        })
      }

      throw insertError
    }

    // Also seed default shop info
    const { data: shopInfo } = await supabase
      .from('shop_info')
      .select('id')
      .limit(1)

    if (!shopInfo || shopInfo.length === 0) {
      await supabase.from('shop_info').insert({
        shop_name: 'Cửa hàng Kẽm Nhung',
        phone: '',
        zalo: '',
        address: '',
        bank_name: '',
        bank_account: '',
        bank_account_name: '',
      })
    }

    return NextResponse.json({
      message: 'Tạo admin mặc định thành công',
      admin: { username: admin?.username || 'admin' },
    }, { status: 201 })
  } catch (error) {
    console.error('Seed admin error:', error)
    return NextResponse.json({ error: 'Lỗi tạo admin' }, { status: 500 })
  }
}
