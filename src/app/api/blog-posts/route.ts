import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/lib/types'

function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = value
  }
  return result as T
}

// GET /api/blog-posts - list all posts (admin sees all, public sees published)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const category = searchParams.get('category')
    const published = searchParams.get('published')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const admin = searchParams.get('admin') === 'true'

    if (slug) {
      // Get single post by slug
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
      }

      // Increment view count
      await supabase
        .from('blog_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id)

      const post = toCamelCase<BlogPost>(data)
      return NextResponse.json(post)
    }

    // List posts
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    // Public: only show published
    if (!admin && published !== 'false') {
      query = query.eq('is_published', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Get total count
    const countQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })

    if (!admin && published !== 'false') {
      countQuery.eq('is_published', true)
    }
    if (category) {
      countQuery.eq('category', category)
    }

    const { count } = await countQuery

    const { data, error } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    const posts: BlogPost[] = (data || []).map((item) => toCamelCase<BlogPost>(item))

    return NextResponse.json({
      posts,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}

// POST /api/blog-posts - create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate slug from title if not provided
    const title = body.title || ''
    let slug = body.slug || ''
    if (!slug && title) {
      slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
    }

    // Check slug uniqueness
    if (slug) {
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        content: body.content || '',
        cover_image: body.coverImage || null,
        excerpt: body.excerpt || '',
        meta_title: body.metaTitle || title,
        meta_description: body.metaDescription || body.excerpt || '',
        keywords: body.keywords || [],
        category: body.category || 'khac',
        is_published: body.isPublished ?? false,
        view_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    const post = toCamelCase<BlogPost>(data)
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}
