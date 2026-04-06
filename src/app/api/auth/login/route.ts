import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)

    const { data: admin, error } = await supabase
      .from('admin')
      .select('id, username, password')
      .eq('username', username)
      .single()

    if (error || !admin || admin.password !== hashedPassword) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu sai' }, { status: 401 })
    }

    // Create a session token (simple token-based auth)
    const token = createHash('sha256').update(`${admin.id}-${Date.now()}-${Math.random()}`).digest('hex')

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Đăng nhập thất bại' }, { status: 500 })
  }
}
