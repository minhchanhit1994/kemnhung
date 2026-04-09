import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CREATE_TABLES_SQL = `-- Analytics tables for Kẽm Nhung / Mộc Đậu Decor
-- Run this SQL in Supabase Dashboard → SQL Editor

-- 1. Page views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Product views table
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Search queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  ip TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON product_views(created_at);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_session ON search_queries(session_id);

-- Enable Row Level Security
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking from website visitors)
CREATE POLICY "Allow anonymous inserts on page_views" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on product_views" ON product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on search_queries" ON search_queries
  FOR INSERT WITH CHECK (true);

-- Allow authenticated reads (for admin dashboard)
CREATE POLICY "Allow select on page_views" ON page_views
  FOR SELECT USING (true);

CREATE POLICY "Allow select on product_views" ON product_views
  FOR SELECT USING (true);

CREATE POLICY "Allow select on search_queries" ON search_queries
  FOR SELECT USING (true);
`

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseConfig = !!(supabaseUrl && supabase)

  // Check if Supabase tables exist
  let tablesExist = false
  let connectionError: string | null = null

  if (hasSupabaseConfig) {
    try {
      const { error } = await supabase!.from('page_views').select('id').limit(1)
      tablesExist = !error
      if (error) {
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('does not exist') || msg.includes('not found') || msg.includes('relation')) {
          connectionError = 'TABLES_MISSING'
        } else {
          connectionError = error.message
        }
      }
    } catch (err) {
      connectionError = err instanceof Error ? err.message : 'Connection failed'
    }
  }

  return NextResponse.json({
    configured: hasSupabaseConfig,
    tablesExist,
    connectionError,
    sql: CREATE_TABLES_SQL,
    supabaseDashboardUrl: supabaseUrl
      ? `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/project/default/sql`
      : null,
    status: !hasSupabaseConfig
      ? 'NOT_CONFIGURED'
      : tablesExist
        ? 'CONNECTED'
        : 'NEEDS_SETUP',
  })
}

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabase) {
    return NextResponse.json({
      success: false,
      error: 'Supabase chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào file .env',
    }, { status: 400 })
  }

  // Try to auto-create tables via Supabase REST API
  try {
    // Attempt 1: Try using Supabase's /pg endpoint (if available)
    const pgResponse = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ query: CREATE_TABLES_SQL }),
    })

    if (pgResponse.ok) {
      const result = await pgResponse.json()
      if (!result.error) {
        const { error: checkError } = await supabase.from('page_views').select('id').limit(1)
        if (!checkError) {
          return NextResponse.json({ success: true, method: 'pg_endpoint' })
        }
      }
    }

    // Attempt 2: Try via RPC (need exec_sql function)
    const rpcResponse = await supabase.rpc('exec_sql', { sql_string: CREATE_TABLES_SQL })
    if (!rpcResponse.error) {
      return NextResponse.json({ success: true, method: 'rpc' })
    }

    // All auto-attempts failed - return SQL for manual execution
    return NextResponse.json({
      success: false,
      autoSetupFailed: true,
      error: 'Không thể tự động tạo bảng. Vui lòng chạy SQL thủ công trong Supabase Dashboard.',
      sql: CREATE_TABLES_SQL,
      supabaseDashboardUrl: `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/project/default/sql`,
      instructions: [
        '1. Mở Supabase Dashboard: https://supabase.com/dashboard',
        '2. Chọn project zcimhemozyszyjzcubkk',
        '3. Vào mục SQL Editor (bên trái)',
        '4. Dán đoạn SQL bên dưới và nhấn "Run"',
      ],
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      autoSetupFailed: true,
      error: err instanceof Error ? err.message : 'Lỗi kết nối',
      sql: CREATE_TABLES_SQL,
    })
  }
}
