import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  cover_image TEXT,
  excerpt TEXT DEFAULT '',
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'khac',
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on blog_posts" ON blog_posts
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, created_at DESC);
`

export async function POST() {
  try {
    if (!supabase) {
      return NextResponse.json({
        status: 'NOT_CONFIGURED',
        message: 'Chưa cấu hình Supabase. Vui lòng thêm SUPABASE_URL và SUPABASE_ANON_KEY vào .env',
        sql: CREATE_TABLE_SQL,
      })
    }

    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: CREATE_TABLE_SQL })

    if (rpcError) {
      return NextResponse.json({
        status: 'NEEDS_MANUAL_SETUP',
        message: 'Vui lòng chạy SQL sau trong Supabase Dashboard → SQL Editor:',
        sql: CREATE_TABLE_SQL,
      })
    }

    return NextResponse.json({
      status: 'OK',
      message: 'Đã tạo bảng blog_posts thành công!',
    })
  } catch (error) {
    console.error('Error setting up blog table:', error)
    return NextResponse.json({
      status: 'NEEDS_MANUAL_SETUP',
      message: 'Không thể tự động tạo bảng. Vui lòng chạy SQL thủ công:',
      sql: CREATE_TABLE_SQL,
    })
  }
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({
        status: 'NOT_CONFIGURED',
        message: 'Chưa cấu hình Supabase',
        sql: CREATE_TABLE_SQL,
      })
    }

    const { error } = await supabase.from('blog_posts').select('id').limit(1)

    if (error) {
      return NextResponse.json({
        status: 'NEEDS_SETUP',
        message: 'Bảng blog_posts chưa tồn tại',
        sql: CREATE_TABLE_SQL,
      })
    }

    return NextResponse.json({ status: 'OK', message: 'Bảng blog_posts đã sẵn sàng' })
  } catch {
    return NextResponse.json({
      status: 'NEEDS_SETUP',
      message: 'Không thể kiểm tra bảng',
      sql: CREATE_TABLE_SQL,
    })
  }
}
