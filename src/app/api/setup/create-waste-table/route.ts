import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    // Try service role first, fallback to anon
    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : createClient(supabaseUrl, supabaseAnonKey)

    // Check if table already exists
    const { error: checkError } = await supabase
      .from('waste_records')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ success: true, message: 'Bảng waste_records đã tồn tại!' })
    }

    // Try to create via RPC if exec_sql function exists
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS waste_records (
          id TEXT PRIMARY KEY,
          material_id TEXT NOT NULL REFERENCES raw_materials(id),
          quantity REAL NOT NULL DEFAULT 0,
          unit_price REAL NOT NULL DEFAULT 0,
          total_cost REAL NOT NULL DEFAULT 0,
          note TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;

        DO $$ BEGIN
          CREATE POLICY "Allow anon all" ON waste_records FOR ALL USING (true) WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `,
    })

    if (rpcError) {
      return NextResponse.json({
        success: false,
        error: rpcError.message,
        solution: `Bảng waste_records chưa được tạo. Vui lòng chạy SQL sau trong Supabase Dashboard → SQL Editor:\n\nCREATE TABLE waste_records (\n  id TEXT PRIMARY KEY,\n  material_id TEXT NOT NULL REFERENCES raw_materials(id),\n  quantity REAL NOT NULL DEFAULT 0,\n  unit_price REAL NOT NULL DEFAULT 0,\n  total_cost REAL NOT NULL DEFAULT 0,\n  note TEXT DEFAULT '',\n  created_at TIMESTAMPTZ DEFAULT now(),\n  updated_at TIMESTAMPTZ DEFAULT now()\n);\n\nALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Allow anon all" ON waste_records FOR ALL USING (true) WITH CHECK (true);`,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tạo bảng waste_records thành công!' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: msg,
      solution: `Bảng waste_records chưa được tạo. Vui lòng chạy SQL sau trong Supabase Dashboard → SQL Editor:\n\nCREATE TABLE waste_records (\n  id TEXT PRIMARY KEY,\n  material_id TEXT NOT NULL REFERENCES raw_materials(id),\n  quantity REAL NOT NULL DEFAULT 0,\n  unit_price REAL NOT NULL DEFAULT 0,\n  total_cost REAL NOT NULL DEFAULT 0,\n  note TEXT DEFAULT '',\n  created_at TIMESTAMPTZ DEFAULT now(),\n  updated_at TIMESTAMPTZ DEFAULT now()\n);\n\nALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Allow anon all" ON waste_records FOR ALL USING (true) WITH CHECK (true);`,
    }, { status: 500 })
  }
}
