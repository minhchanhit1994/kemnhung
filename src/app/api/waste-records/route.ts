import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/convert'
import type { WasteRecord } from '@/lib/types'

let tableChecked = false

async function ensureTableExists(): Promise<boolean> {
  if (tableChecked) return true

  try {
    // Quick check if table exists
    const { error } = await supabase
      .from('waste_records')
      .select('id')
      .limit(1)

    if (!error) {
      tableChecked = true
      return true
    }
  } catch {
    // Continue to try creation
  }

  // Table doesn't exist - try RPC approach
  try {
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

    if (!rpcError) {
      tableChecked = true
      return true
    }
  } catch {
    // RPC not available
  }

  tableChecked = true
  return false
}

export async function GET(request: NextRequest) {
  try {
    const tableOk = await ensureTableExists()
    if (!tableOk) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('material_id')

    let query = supabase
      .from('waste_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (materialId) {
      query = query.eq('material_id', materialId)
    }

    const { data, error } = await query
    if (error) throw error

    const records: WasteRecord[] = (data || []).map((item) => toCamelCase<WasteRecord>(item))

    // Fetch material details
    const materialIds = [...new Set(records.map((r) => r.materialId))]
    let materialInfoMap: Record<string, { name: string; unit: string }> = {}

    if (materialIds.length > 0) {
      const { data: materialData } = await supabase
        .from('raw_materials')
        .select('id, name, unit')
        .in('id', materialIds)

      if (materialData) {
        for (const m of materialData) {
          materialInfoMap[m.id] = { name: m.name, unit: m.unit }
        }
      }
    }

    const result = records.map((r) => ({
      ...r,
      material: materialInfoMap[r.materialId]
        ? { name: materialInfoMap[r.materialId].name, unit: materialInfoMap[r.materialId].unit }
        : undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching waste records:', error)
    return NextResponse.json({ error: 'Failed to fetch waste records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tableOk = await ensureTableExists()
    if (!tableOk) {
      return NextResponse.json({
        error: 'Bảng waste_records chưa được tạo. Vui lòng chạy SQL trong Supabase Dashboard → SQL Editor.',
      }, { status: 500 })
    }

    const body = await request.json()
    const snakeBody = toSnakeCase(body)

    const materialId = String(snakeBody.material_id || '')
    const quantity = parseFloat(String(snakeBody.quantity)) || 0
    const note = String(snakeBody.note || 'Sản phẩm lỗi')

    if (!materialId) {
      return NextResponse.json({ error: 'Vui lòng chọn nguyên liệu' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Số lượng hao hụt phải lớn hơn 0' }, { status: 400 })
    }

    // 1. Get current material stock and unit price
    const { data: material, error: materialError } = await supabase
      .from('raw_materials')
      .select('id, name, current_stock, unit_price')
      .eq('id', materialId)
      .single()

    if (materialError || !material) {
      return NextResponse.json({ error: 'Nguyên liệu không tồn tại' }, { status: 400 })
    }

    const currentStock = material.current_stock || 0
    const unitPrice = material.unit_price || 0

    if (currentStock < quantity) {
      return NextResponse.json({
        error: `Nguyên liệu ${material.name} không đủ. Cần hao hụt ${quantity}, hiện có ${currentStock}`,
      }, { status: 400 })
    }

    const totalCost = quantity * unitPrice

    // 2. Deduct material stock
    const { error: updateError } = await supabase
      .from('raw_materials')
      .update({
        current_stock: currentStock - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)

    if (updateError) throw updateError

    // 3. Create waste record
    const id = crypto.randomUUID()

    const { data: record, error: insertError } = await supabase
      .from('waste_records')
      .insert({
        id,
        material_id: materialId,
        quantity,
        unit_price: unitPrice,
        total_cost: totalCost,
        note,
      })
      .select()
      .single()

    if (insertError) {
      // Rollback stock
      await supabase
        .from('raw_materials')
        .update({ current_stock: currentStock, updated_at: new Date().toISOString() })
        .eq('id', materialId)
      throw insertError
    }

    const result = toCamelCase<WasteRecord>(record)
    result.material = { name: material.name, unit: material.unit }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating waste record:', error)
    return NextResponse.json({ error: 'Failed to create waste record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
    }

    // 1. Get the waste record first
    const { data: record, error: fetchError } = await supabase
      .from('waste_records')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Bản ghi hao hụt không tồn tại' }, { status: 404 })
    }

    // 2. Restore material stock
    const { data: material } = await supabase
      .from('raw_materials')
      .select('id, current_stock')
      .eq('id', record.material_id)
      .single()

    if (material) {
      await supabase
        .from('raw_materials')
        .update({
          current_stock: (material.current_stock || 0) + (record.quantity || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.material_id)
    }

    // 3. Delete the waste record
    const { error: deleteError } = await supabase
      .from('waste_records')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Xóa bản ghi hao hụt thành công, đã khôi phục tồn kho' })
  } catch (error) {
    console.error('Error deleting waste record:', error)
    return NextResponse.json({ error: 'Failed to delete waste record' }, { status: 500 })
  }
}
