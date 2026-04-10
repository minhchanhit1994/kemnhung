import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mocdau-decor.vercel.app'

  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap
`

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
