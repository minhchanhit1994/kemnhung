/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Eye, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BlogPost } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  'huong-dan': 'Hướng dẫn',
  'cam-hung': 'Cảm hứng',
  'san-pham': 'Sản phẩm',
  'kien-thuc': 'Kiến thức',
  'khac': 'Khác',
}

const POSTS_PER_PAGE = 9

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function BlogListClient() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      try {
        let url = `/api/blog-posts?published=true&limit=${POSTS_PER_PAGE}&offset=${(page - 1) * POSTS_PER_PAGE}`
        if (activeCategory) url += `&category=${activeCategory}`
        const res = await fetch(url)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setPosts(data.posts || [])
          setTotal(data.total || 0)
        }
      } catch (err) {
        console.error('Error fetching posts:', err)
      }
      if (!cancelled) setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [page, activeCategory])

  const filtered = search
    ? posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase())
      )
    : posts

  const categories = ['huong-dan', 'cam-hung', 'san-pham', 'kien-thuc', 'khac']

  const totalPages = Math.ceil(total / POSTS_PER_PAGE)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-forest text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Blog</h1>
          <p className="text-white/70 text-lg">Cảm hứng, hướng dẫn và kiến thức về trang sức handmade</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search & Categories */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bài viết..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveCategory(null); setPage(1) }}
              className={activeCategory === null ? 'bg-forest hover:bg-forest-dark' : ''}
            >
              Tất cả
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setActiveCategory(cat); setPage(1) }}
                className={activeCategory === cat ? 'bg-forest hover:bg-forest-dark' : ''}
              >
                {CATEGORY_LABELS[cat] || cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-forest/40 mb-2">Chưa có bài viết nào</p>
            <p className="text-forest/30">Bài viết mới sẽ sớm xuất hiện ở đây!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {post.coverImage ? (
                      <div className="relative h-48 overflow-hidden bg-mint-light">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-mint to-forest/10 flex items-center justify-center">
                        <span className="text-5xl opacity-20">📝</span>
                      </div>
                    )}
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        {post.category && CATEGORY_LABELS[post.category] && (
                          <Badge variant="secondary" className="text-xs bg-mint/30 text-forest-dark">
                            {CATEGORY_LABELS[post.category]}
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-semibold text-forest-dark group-hover:text-forest transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-forest/60 line-clamp-3 flex-1">
                        {post.excerpt || stripHtml(post.content).slice(0, 120) + '...'}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-forest/60">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-forest/5 border-t border-forest/10 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-forest/40">
          &copy; {new Date().getFullYear()} Mộc Đậu Decor. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
