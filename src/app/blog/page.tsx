import type { Metadata } from 'next'
import BlogListClient from './blog-list-client'

export const metadata: Metadata = {
  title: 'Blog | Mộc Đậu Decor',
  description: 'Cảm hứng trang sức handmade, hướng dẫn phối đồ, chăm sóc sản phẩm và nhiều bài viết thú vị khác.',
  openGraph: {
    title: 'Blog | Mộc Đậu Decor',
    description: 'Cảm hứng trang sức handmade, hướng dẫn phối đồ, chăm sóc sản phẩm.',
    type: 'website',
  },
}

export default function BlogPage() {
  return <BlogListClient />
}
