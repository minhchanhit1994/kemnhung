const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zcimhemozyszyjzcubkk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaW1oZW1venlzenlqemN1YmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzM1MDcsImV4cCI6MjA5MTA0OTUwN30.w0T0W0zMlxf0gwNSJ4gMpagNQOtEoiAGcYIEy0M0_Dw'
);

// We can use the Supabase API to run raw SQL by creating a temporary RPC function
// But since we can't do DDL via REST, let's use a different approach
// We'll use fetch to call the Supabase SQL endpoint

async function runMigrations() {
  // Step 1: Try to create tables via direct REST inserts (will fail, but tells us table doesn't exist)
  // Step 2: Use the Supabase project's internal API
  
  // Actually, the best approach for Supabase: create tables via the Supabase Dashboard SQL Editor
  // or via supabase CLI
  
  // For now, let's verify we can at least query existing tables
  const { data, error } = await supabase.from('raw_materials').select('id').limit(1);
  if (error) {
    console.error('Cannot access existing tables:', error.message);
    process.exit(1);
  }
  console.log('Supabase connection verified! Tables need to be created manually.');
  console.log('Please run the following SQL in Supabase Dashboard > SQL Editor:');
  console.log(SQL);
}

const SQL = `
-- Analytics Tables Migration
CREATE TABLE IF NOT EXISTS page_views (
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_created_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON product_views(created_at);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and selects (for tracking from client)
CREATE POLICY "Allow anon insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select page_views" ON page_views FOR SELECT USING (true);
CREATE POLICY "Allow anon insert product_views" ON product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select product_views" ON product_views FOR SELECT USING (true);
CREATE POLICY "Allow anon insert search_queries" ON search_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select search_queries" ON search_queries FOR SELECT USING (true);
`;

runMigrations();
