/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Eye, BookOpen, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  'huong-dan': 'Hướng dẫn',
  'cam-hung': 'Cảm hứng',
  'san-pham': 'Sản phẩm',
  'kien-thuc': 'Kiến thức',
  'khac': 'Khác',
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog-posts?published=true&limit=3')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.posts) setPosts(data.posts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  // Don't render if no published posts
  if (posts.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-forest" />
            <h2 className="text-2xl font-bold text-forest-dark">Blog</h2>
          </div>
          <p className="text-forest/60 text-sm">Cảm hứng, hướng dẫn và kiến thức về trang sức handmade</p>
        </div>
        <Link
          href="/blog"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-dark transition-colors"
        >
          Xem tất cả
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group">
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
              {post.coverImage ? (
                <div className="relative h-44 overflow-hidden bg-mint-light">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-mint to-forest/10 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-forest/20" />
                </div>
              )}
              <CardContent className="p-4 flex-1 flex flex-col">
                {post.category && CATEGORY_LABELS[post.category] && (
                  <Badge variant="secondary" className="text-xs bg-mint/30 text-forest-dark mb-2 w-fit">
                    {CATEGORY_LABELS[post.category]}
                  </Badge>
                )}
                <h3 className="font-semibold text-forest-dark group-hover:text-forest transition-colors mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-forest/60 line-clamp-2 flex-1">
                  {post.excerpt || stripHtml(post.content).slice(0, 100) + '...'}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-forest/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.viewCount || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Mobile "View All" link */}
      <div className="mt-6 text-center sm:hidden">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-dark transition-colors"
        >
          Xem tất cả bài viết
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
