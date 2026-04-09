import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Test connection
    const { error: connError } = await supabase.from('raw_materials').select('id').limit(1)
    if (connError) {
      return NextResponse.json({ error: 'Supabase connection failed: ' + connError.message }, { status: 500 })
    }

    // Check if tables exist
    const testPV = await supabase.from('page_views').select('id').limit(1)
    const testProductV = await supabase.from('product_views').select('id').limit(1)
    const testSQ = await supabase.from('search_queries').select('id').limit(1)

    const results = {
      supabaseConnected: true,
      pageViews: testPV.error ? 'NOT FOUND' : 'EXISTS',
      productViews: testProductV.error ? 'NOT FOUND' : 'EXISTS',
      searchQueries: testSQ.error ? 'NOT FOUND' : 'EXISTS',
      errors: {
        pageViews: testPV.error?.message,
        productViews: testProductV.error?.message,
        searchQueries: testSQ.error?.message,
      },
    }

    return NextResponse.json(results)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
