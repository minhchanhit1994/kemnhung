/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, BookOpen, AlertTriangle, CheckCircle, ImagePlus,
} from 'lucide-react'
import TipTapEditor from '@/components/tiptap-editor'
import ImageCropDialog from './image-crop-dialog'
import type { BlogPost } from '@/lib/types'

const CATEGORIES = [
  { value: 'huong-dan', label: 'Hướng dẫn' },
  { value: 'cam-hung', label: 'Cảm hứng' },
  { value: 'san-pham', label: 'Sản phẩm' },
  { value: 'kien-thuc', label: 'Kiến thức' },
  { value: 'khac', label: 'Khác' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
)

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim().slice(0, 160)
}

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'needs_setup'>('checking')
  const [coverCropOpen, setCoverCropOpen] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    coverImage: '',
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    category: 'khac',
    isPublished: false,
  })

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/blog-posts?admin=true&limit=50')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err)
    }
    setLoading(false)
  }, [])

  const checkDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/blog-posts/setup')
      if (res.ok) {
        const data = await res.json()
        setDbStatus(data.status === 'OK' ? 'ok' : 'needs_setup')
      }
    } catch {
      setDbStatus('needs_setup')
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      await checkDbStatus()
      if (mounted) await fetchPosts()
    }
    init()
    return () => { mounted = false }
  }, [checkDbStatus, fetchPosts])

  const setupDatabase = async () => {
    const res = await fetch('/api/blog-posts/setup', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      if (data.status === 'OK') {
        setDbStatus('ok')
        fetchPosts()
      } else {
        alert('Không thể tự động tạo bảng. Vui lòng chạy SQL thủ công trong Supabase Dashboard.\n\nXem Console (F12) để lấy SQL.')
        console.log('SQL cần chạy:', data.sql)
      }
    }
  }

  const openNewPost = () => {
    setEditingPost(null)
    setForm({
      title: '', slug: '', content: '', coverImage: '',
      excerpt: '', metaTitle: '', metaDescription: '',
      keywords: '', category: 'khac', isPublished: false,
    })
    setDialogOpen(true)
  }

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      coverImage: post.coverImage || '',
      excerpt: post.excerpt,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      keywords: (post.keywords || []).join(', '),
      category: post.category || 'khac',
      isPublished: post.isPublished,
    })
    setDialogOpen(true)
  }

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
      metaTitle: editingPost ? prev.metaTitle : `${title} | Mộc Đậu Decor`,
    }))
  }

  const handleContentChange = (html: string) => {
    setForm(prev => ({
      ...prev,
      content: html,
      excerpt: prev.excerpt || stripHtml(html).slice(0, 160),
      metaDescription: prev.metaDescription || stripHtml(html).slice(0, 155),
    }))
  }

  const savePost = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const url = editingPost ? `/api/blog-posts/${editingPost.id}` : '/api/blog-posts'
      const method = editingPost ? 'PUT' : 'POST'

      const body = {
        ...form,
        keywords: form.keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
      }

      if (!editingPost) delete body.id

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchPosts()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi lưu bài viết')
      }
    } catch (err) {
      alert('Lỗi kết nối')
    }
    setSaving(false)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return
    try {
      const res = await fetch(`/api/blog-posts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPosts()
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi xóa bài viết')
      }
    } catch {
      alert('Lỗi kết nối')
    }
  }

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog-posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      })
      if (res.ok) {
        fetchPosts()
      }
    } catch {
      // ignore
    }
  }

  if (dbStatus === 'checking') {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-forest/40">Đang kiểm tra...</p>
      </div>
    )
  }

  if (dbStatus === 'needs_setup') {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cài đặt Blog
          </CardTitle>
          <CardDescription>
            Cần tạo bảng blog_posts trên Supabase để sử dụng tính năng Blog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={setupDatabase} className="bg-forest hover:bg-forest-dark w-full">
            Tự động cài đặt
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-forest" />
          <h2 className="text-xl font-bold text-forest-dark">Quản lý Blog</h2>
          <Badge variant="secondary">{posts.length} bài viết</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            DB sẵn sàng
          </Badge>
          <Button onClick={openNewPost} className="bg-forest hover:bg-forest-dark">
            <Plus className="w-4 h-4 mr-1" />
            Viết bài mới
          </Button>
        </div>
      </div>

      {/* Posts List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-forest/40">Đang tải...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-forest/20 mb-3" />
              <p className="text-lg text-forest/40 mb-1">Chưa có bài viết nào</p>
              <p className="text-sm text-forest/30 mb-4">Bắt đầu viết bài đầu tiên để thu hút khách hàng!</p>
              <Button onClick={openNewPost} className="bg-forest hover:bg-forest-dark">
                <Plus className="w-4 h-4 mr-1" />
                Viết bài mới
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-forest/5">
              {posts.map(post => (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-forest/5 transition-colors">
                  {/* Cover thumbnail */}
                  <div className="w-16 h-12 rounded bg-forest/5 overflow-hidden flex-shrink-0">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-forest/20">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm truncate">{post.title}</h3>
                      <Badge
                        variant={post.isPublished ? 'default' : 'secondary'}
                        className={`text-xs flex-shrink-0 ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {post.isPublished ? 'Đã xuất bản' : 'Nháp'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-forest/40">
                      <span>{formatDate(post.createdAt)}</span>
                      {post.category && (
                        <span>{CATEGORY_LABELS[post.category] || post.category}</span>
                      )}
                      <span>{post.viewCount || 0} lượt xem</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => togglePublish(post)}
                      title={post.isPublished ? 'Bỏ xuất bản' : 'Xuất bản'}
                    >
                      {post.isPublished ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    {post.isPublished && (
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Xem bài viết">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditPost(post)} title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => deletePost(post.id)} title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Sửa bài viết' : 'Viết bài mới'}</DialogTitle>
            <DialogDescription>
              {editingPost
                ? 'Chỉnh sửa nội dung bài viết. Copy-paste từ Word/website giữ nguyên định dạng.'
                : 'Copy bài viết từ Word, Google Docs hoặc website → Paste (Ctrl+V) giữ nguyên định dạng và ảnh.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="blog-title">Tiêu đề bài viết *</Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="text-lg"
              />
            </div>

            {/* Slug & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blog-slug">URL (slug)</Label>
                <Input
                  id="blog-slug"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-bai-viet"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tự động tạo từ tiêu đề. Có thể sửa tay.
                </p>
              </div>
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <Label>Ảnh bìa</Label>
              <div className="flex gap-2">
                <Input
                  value={form.coverImage}
                  onChange={(e) => setForm(prev => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="Dán URL ảnh bìa..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCoverCropOpen(true)}
                  className="whitespace-nowrap"
                >
                  <ImagePlus className="w-4 h-4 mr-1" />
                  Upload & Cắt
                </Button>
              </div>
              {form.coverImage && (
                <div className="mt-2 relative">
                  <img src={form.coverImage} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 px-2 text-xs"
                    onClick={() => setForm(prev => ({ ...prev, coverImage: '' }))}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Xóa
                  </Button>
                </div>
              )}
            </div>

            {/* Content Editor - TipTap */}
            <div>
              <Label>Nội dung bài viết *</Label>
              <TipTapEditor
                content={form.content}
                onChange={handleContentChange}
                placeholder="Bắt đầu viết hoặc paste nội dung từ Word/website..."
              />
            </div>

            {/* SEO Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-1.5">
                🔍 Tối ưu SEO
              </h4>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="blog-excerpt">Tóm tắt (hiển thị trên thẻ)</Label>
                  <Textarea
                    id="blog-excerpt"
                    value={form.excerpt}
                    onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Tóm tắt ngắn gọn (tự động lấy từ nội dung nếu để trống)"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="blog-meta-title">Meta Title</Label>
                    <Input
                      id="blog-meta-title"
                      value={form.metaTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                      placeholder="Tự động tạo từ tiêu đề"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blog-keywords">Từ khóa (cách nhau bởi dấu phẩy)</Label>
                    <Input
                      id="blog-keywords"
                      value={form.keywords}
                      onChange={(e) => setForm(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="trang sức, vòng tay, handmade"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="blog-meta-desc">Meta Description</Label>
                  <Textarea
                    id="blog-meta-desc"
                    value={form.metaDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Mô tả hiển thị trên Google (tự động lấy từ nội dung nếu để trống)"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.metaDescription.length}/160 ký tự
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(prev => ({ ...prev, isPublished: false }))
                savePost()
              }}
              disabled={saving || !form.title.trim()}
            >
              Lưu nháp
            </Button>
            <Button
              onClick={() => {
                setForm(prev => ({ ...prev, isPublished: true }))
                savePost()
              }}
              disabled={saving || !form.title.trim()}
              className="bg-forest hover:bg-forest-dark"
            >
              {saving ? 'Đang lưu...' : 'Xuất bản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Image Crop Dialog */}
      <ImageCropDialog
        open={coverCropOpen}
        onOpenChange={setCoverCropOpen}
        onImageReady={(dataUrl) => setForm(prev => ({ ...prev, coverImage: dataUrl }))}
      />
    </div>
  )
}
