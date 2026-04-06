import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/auth/check - verify session
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Simple token validation - check admin count and token format
    const { count, error } = await supabase
      .from('admin')
      .select('*', { count: 'exact', head: true })

    if (error || count === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Simple token validation - in production use JWT or proper session
    if (token && token.length === 64) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
