import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mocdau-decor.vercel.app'

  const staticPages = [
    { url: baseUrl, lastmod: new Date().toISOString(), changefreq: 'daily', priority: '1.0' },
    { url: `${baseUrl}/blog`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: '0.8' },
  ]

  let blogPages: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = []

  try {
    if (supabase) {
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })

      if (data) {
        blogPages = data.map(post => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastmod: post.updated_at || post.created_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: '0.7',
        }))
      }
    }
  } catch (error) {
    console.error('Error generating blog sitemap:', error)
  }

  const allPages = [...staticPages, ...blogPages]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  })
}
