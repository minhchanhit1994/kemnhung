import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

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
        { error: 'Định dạng file không được hỗ trợ. Chỉ hỗ trợ JPG, PNG, WebP, GIF, MP4, WebM, MOV' },
        { status: 400 }
      )
    }

    // Validate file size
    if (isImage && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ảnh quá lớn! Tối đa 10MB' },
        { status: 400 }
      )
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: 'Video quá lớn! Tối đa 50MB' },
        { status: 400 }
      )
    }

    // Generate unique file path
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4')
    const folder = isVideo ? 'videos' : 'products'
    const filePath = `${folder}/${timestamp}_${randomStr}.${ext}`

    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('mocdau')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)

      // If bucket doesn't exist, try to create it
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket('mocdau', {
          public: true,
          fileSizeLimit: MAX_VIDEO_SIZE,
        })

        if (createBucketError) {
          console.error('Create bucket error:', createBucketError)
          return NextResponse.json(
            { error: 'Lỗi tạo storage bucket. Vui lòng liên hệ quản trị viên.' },
            { status: 500 }
          )
        }

        // Retry upload after creating bucket
        const { error: retryError } = await supabase.storage
          .from('mocdau')
          .upload(filePath, arrayBuffer, {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false,
          })

        if (retryError) {
          console.error('Retry upload error:', retryError)
          return NextResponse.json(
            { error: 'Upload thất bại sau khi tạo bucket' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Upload thất bại: ' + uploadError.message },
          { status: 500 }
        )
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('mocdau').getPublicUrl(filePath)

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
