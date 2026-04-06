import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Resize image to max 400x400 using sharp
    let processedBuffer = buffer
    try {
      const sharp = (await import('sharp')).default
      processedBuffer = await sharp(buffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer()
    } catch {
      // If sharp is not available, use original buffer
      console.warn('Sharp not available, using original image')
    }

    // Generate unique filename
    const ext = '.jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uniqueName, processedBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      // If bucket doesn't exist, return a helpful error
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        console.error('Storage bucket "product-images" does not exist. Please create it in Supabase dashboard.')
        return NextResponse.json(
          { error: 'Storage bucket not configured. Please create "product-images" bucket in Supabase.' },
          { status: 500 }
        )
      }
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    const imageUrl = urlData.publicUrl

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
