import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

const BUCKET_NAME = 'product-images'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase chưa được cấu hình' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 })
    }

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Định dạng không hỗ trợ. Chỉ hỗ trợ JPG, PNG, WebP, GIF, MP4, WebM, MOV' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isImage ? 'Ảnh quá lớn! Tối đa 10MB' : 'Video quá lớn! Tối đa 50MB' },
        { status: 400 }
      )
    }

    // Generate unique file path
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4')
    const folder = isVideo ? 'videos' : 'images'
    const filePath = `${folder}/${timestamp}_${randomStr}.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      return NextResponse.json(
        { error: 'Upload thất bại: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi upload file' },
      { status: 500 }
    )
  }
}
