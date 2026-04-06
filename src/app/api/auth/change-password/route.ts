import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json()

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 })
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' }, { status: 400 })
    }

    const { data: admin, error: fetchError } = await supabase
      .from('admin')
      .select('id, username, password')
      .eq('username', username)
      .single()

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 })
    }

    const hashedCurrent = hashPassword(currentPassword)
    if (admin.password !== hashedCurrent) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 401 })
    }

    const hashedNew = hashPassword(newPassword)
    await supabase
      .from('admin')
      .update({ password: hashedNew, updated_at: new Date().toISOString() })
      .eq('id', admin.id)

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Đổi mật khẩu thất bại' }, { status: 500 })
  }
}
