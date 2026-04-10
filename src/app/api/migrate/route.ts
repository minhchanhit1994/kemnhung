import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SQL = `CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL DEFAULT 'home',
  referrer TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_views (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL DEFAULT '',
  results_count INTEGER DEFAULT 0,
  ip TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON product_views(created_at);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_page_views" ON page_views FOR SELECT USING (true);
CREATE POLICY "anon_insert_product_views" ON product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_product_views" ON product_views FOR SELECT USING (true);
CREATE POLICY "anon_insert_search_queries" ON search_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_search_queries" ON search_queries FOR SELECT USING (true);`

export async function GET() {
  if (!supabase) {
    return NextResponse.json({
      connected: false,
      error: 'Supabase not configured. Analytics will use local file storage.',
      tables: { page_views: false, product_views: false, search_queries: false },
      allExist: false,
      sql: SQL,
      storageMode: 'file',
    })
  }

  try {
    const { error: connError } = await supabase.from('raw_materials').select('id').limit(1)
    if (connError) {
      return NextResponse.json({
        connected: false,
        error: connError.message,
        tables: { page_views: false, product_views: false, search_queries: false },
        allExist: false,
        sql: SQL,
        storageMode: 'file',
      })
    }

    const [pvCheck, prodCheck, sqCheck] = await Promise.all([
      supabase.from('page_views').select('id').limit(1),
      supabase.from('product_views').select('id').limit(1),
      supabase.from('search_queries').select('id').limit(1),
    ])

    const tables = {
      page_views: !pvCheck.error,
      product_views: !prodCheck.error,
      search_queries: !sqCheck.error,
    }

    const allExist = tables.page_views && tables.product_views && tables.search_queries

    return NextResponse.json({
      connected: true,
      tables,
      allExist,
      sql: allExist ? null : SQL,
      storageMode: allExist ? 'supabase' : 'file',
      message: allExist
        ? 'All analytics tables ready! Using Supabase storage.'
        : 'Some tables missing. Run SQL in Supabase Dashboard > SQL Editor to enable Supabase storage.',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      connected: false,
      error: msg,
      tables: { page_views: false, product_views: false, search_queries: false },
      allExist: false,
      sql: SQL,
      storageMode: 'file',
    })
  }
}
