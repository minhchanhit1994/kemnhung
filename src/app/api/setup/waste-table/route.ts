import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/setup/waste-table - Create waste_records table if not exists
export async function POST() {
  try {
    // Check if table already exists by trying a simple select
    const { error: checkError } = await supabase
      .from('waste_records')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ message: 'Bảng waste_records đã tồn tại' })
    }

    // Table doesn't exist, create it via Supabase SQL
    // Using the supabase.rpc or direct SQL approach
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS waste_records (
          id TEXT PRIMARY KEY,
          material_id TEXT NOT NULL REFERENCES raw_materials(id),
          quantity REAL NOT NULL DEFAULT 0,
          unit_price REAL NOT NULL DEFAULT 0,
          total_cost REAL NOT NULL DEFAULT 0,
          note TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
      `,
    })

    // If rpc not available, try direct approach
    if (createError) {
      // Fallback: try inserting a dummy record to force table creation hint
      return NextResponse.json({
        message: 'Vui lòng tạo bảng waste_records trong Supabase Dashboard với SQL sau',
        sql: `CREATE TABLE waste_records (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES raw_materials(id),
  quantity REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);`,
      }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tạo bảng waste_records thành công' }, { status: 201 })
  } catch (error) {
    console.error('Setup waste table error:', error)
    return NextResponse.json({ error: 'Lỗi tạo bảng waste_records' }, { status: 500 })
  }
}
