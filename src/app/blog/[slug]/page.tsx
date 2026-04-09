/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Eye, Share2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BlogPost } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  'huong-dan': 'Hướng dẫn',
  'cam-hung': 'Cảm hứng',
  'san-pham': 'Sản phẩm',
  'kien-thuc': 'Kiến thức',
  'khac': 'Khác',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BlogPostPage() {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    const path = window.location.pathname
    const slug = path.replace('/blog/', '')
    if (!slug || slug === 'blog') {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/blog-posts?slug=${slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelledRef.current) return
        if (data) {
          setPost(data)
          document.title = `${data.metaTitle || data.title} | Mộc Đậu Decor`
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelledRef.current) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { cancelledRef.current = true }
  }, [])

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Đã sao chép link bài viết!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-4 w-20 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-forest/40 mb-4">Không tìm thấy bài viết</p>
          <Link href="/blog" className="text-forest hover:underline">
            ← Quay lại Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-forest/5 border-b border-forest/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-forest/60 hover:text-forest transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Blog
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Article Header */}
        <article>
          <div className="mb-8">
            {post.category && CATEGORY_LABELS[post.category] && (
              <Badge variant="secondary" className="mb-3 bg-mint/30 text-forest-dark">
                {CATEGORY_LABELS[post.category]}
              </Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-forest-dark mb-3">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-forest/50">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewCount || 0} lượt xem
              </span>
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-forest/50">
                <Share2 className="w-4 h-4" />
                <span className="ml-1">Chia sẻ</span>
              </Button>
            </div>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-forest-dark prose-headings:font-bold prose-a:text-forest hover:prose-a:text-forest-dark prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Keywords */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-8 pt-6 border-t border-forest/10">
              <p className="text-xs text-forest/40 mb-2">Từ khóa:</p>
              <div className="flex flex-wrap gap-1.5">
                {post.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-forest/50">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Back to blog */}
        <div className="mt-12 pt-6 border-t border-forest/10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-forest hover:text-forest-dark transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Xem thêm bài viết
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-forest/5 border-t border-forest/10 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-forest/40">
          &copy; {new Date().getFullYear()} Mộc Đậu Decor. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
