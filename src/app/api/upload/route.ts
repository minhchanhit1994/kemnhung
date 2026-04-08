import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
  }
  return map[mimeType] || '.bin'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Only image and video files are allowed (jpeg, png, gif, webp, mp4, webm, mov)' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      const maxLabel = isVideo ? '50MB' : '5MB'
      return NextResponse.json(
        { error: `File size must be less than ${maxLabel}` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Only process images with sharp (resize to max 1200x1200, high quality)
    if (isImage) {
      try {
        const sharp = (await import('sharp')).default
        const isWebP = file.type === 'image/webp'
        buffer = await sharp(buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          [isWebP ? 'webp' : 'jpeg']({ quality: 90 })
          .toBuffer()
        const ext = isWebP ? '.webp' : '.jpg'
        const contentType = isWebP ? 'image/webp' : 'image/jpeg'
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(uniqueName, buffer, {
            contentType,
            upsert: true,
          })

        if (error) {
          if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
            console.error('Storage bucket "product-images" does not exist. Please create it in Supabase dashboard.')
            return NextResponse.json(
              { error: 'Storage bucket not configured. Please create "product-images" bucket in Supabase.' },
              { status: 500 }
            )
          }
          throw error
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path)

        return NextResponse.json({ url: urlData.publicUrl, type: 'image' })
      } catch {
        // If sharp is not available, use original buffer
        console.warn('Sharp not available, using original image')
      }
    }

    // For videos or images without sharp
    const ext = getExtension(file.type)
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        console.error('Storage bucket "product-images" does not exist. Please create it in Supabase dashboard.')
        return NextResponse.json(
          { error: 'Storage bucket not configured. Please create "product-images" bucket in Supabase.' },
          { status: 500 }
        )
      }
      throw error
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl, type: isVideo ? 'video' : 'image' })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
