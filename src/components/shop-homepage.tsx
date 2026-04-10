'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag, Gem, Video, X, Phone, MessageCircle, Maximize2 } from 'lucide-react'
import type { Product, ShopInfo } from '@/lib/types'
import BlogSection from '@/components/blog-section'

interface ShopHomepageProps {
  onAdminClick: () => void
}

const DEFAULT_SHOP: ShopInfo = {
  id: '',
  shopName: 'Mộc Đậu Decor',
  phone: '',
  zalo: '',
  address: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  createdAt: '',
  updatedAt: '',
}

export default function ShopHomepage({ onAdminClick }: ShopHomepageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [shopInfo, setShopInfo] = useState<ShopInfo>(DEFAULT_SHOP)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  // === Analytics Session ID ===
  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const ua = navigator.userAgent + (window.screen.width + 'x' + window.screen.height)
    let hash = 0
    for (let i = 0; i < ua.length; i++) {
      const char = ua.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }, [])

  const trackedProducts = useRef<Set<string>>(new Set())
  const trackedSearches = useRef<Map<string, number>>(new Map())
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === Analytics: Track page view on mount ===
  useEffect(() => {
    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: 'home',
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        sessionId,
      }),
    }).catch(() => {})
  }, [sessionId])

  // === Analytics: Track product view ===
  useEffect(() => {
    if (selectedProduct && !trackedProducts.current.has(selectedProduct.id)) {
      trackedProducts.current.add(selectedProduct.id)
      fetch('/api/analytics/product-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          userAgent: navigator.userAgent,
          sessionId,
        }),
      }).catch(() => {})
    }
  }, [selectedProduct, sessionId])

  // === Analytics: Track search (debounced) ===
  const trackSearch = useCallback((query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (!query.trim()) return
    searchDebounceRef.current = setTimeout(() => {
      const lastTracked = trackedSearches.current.get(query.trim().toLowerCase())
      const now = Date.now()
      // Don't track same query more than once per 10 seconds
      if (lastTracked && now - lastTracked < 10000) return
      trackedSearches.current.set(query.trim().toLowerCase(), now)
      const resultCount = products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).length
      fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          resultsCount: resultCount,
          sessionId,
        }),
      }).catch(() => {})
    }, 800)
  }, [products, sessionId])

  useEffect(() => {
    if (search.trim()) trackSearch(search)
  }, [search, trackSearch])

  useEffect(() => {
    Promise.all([fetchShopInfo(), fetchProducts()])
  }, [])

  const fetchShopInfo = async () => {
    try {
      const res = await fetch('/api/shop-info')
      if (res.ok) {
        const data = await res.json()
        setShopInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch shop info:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        const active = (Array.isArray(data) ? data : []).filter(
          (p: Product) => p.isActive && p.stockQuantity > 0
        )
        setProducts(active)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const zaloNumber = shopInfo.zalo || shopInfo.phone
  const zaloClean = zaloNumber ? zaloNumber.replace(/^0/, '') : ''
  // Phone with country code (84 for Vietnam) for Zalo deep link
  const zaloWithCC = zaloClean ? `84${zaloClean}` : ''
  // Web link for desktop (opens Zalo web)
  const zaloWebLink = zaloClean ? `https://zalo.me/${zaloClean}` : null
  // Fallback page for mobile
  const zaloFallbackLink = zaloClean ? `/api/zalo?phone=${zaloClean}&shop=${encodeURIComponent(shopInfo.shopName || 'Mộc Đậu Decor')}` : null
  const displayPhone = shopInfo.phone || shopInfo.zalo || ''
  const telLink = displayPhone ? `tel:${displayPhone}` : null

  // Zalo click handler
  // Desktop: open https://zalo.me/ directly (Zalo web works fine)
  // iOS: use zalo:// URI scheme with country code (84 prefix)
  // Android: use intent:// URL which Chrome allows programmatically
  //   intent:// has built-in fallback URL when app can't handle it
  const handleZaloClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!zaloClean || !zaloWebLink) return
    const ua = navigator.userAgent || ''
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
    if (!isMobile) return // Desktop: let <a href="https://zalo.me/..."> work normally

    e.preventDefault()

    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    const isAndroid = /Android/i.test(ua)

    if (isIOS) {
      // iOS Safari handles zalo:// custom URI scheme natively
      // Use country code (84) prefix for Vietnam phone numbers
      window.location.href = `zalo://conversation?phone=${zaloWithCC}`
    } else if (isAndroid) {
      // Android Chrome BLOCKS custom URI schemes (zalo://) programmatically
      // But Chrome ALLOWS intent:// URLs (they have built-in fallback handling)
      // Format: intent://<path>#Intent;scheme=<scheme>;package=<pkg>;S.browser_fallback_url=<url>;end
      // This tells Chrome: try zalo://conversation?phone=84xxx via Zalo app,
      // if app can't handle it, fall back to the URL below
      const fallback = encodeURIComponent(zaloFallbackLink || zaloWebLink)
      const intentUrl = `intent://conversation?phone=${zaloWithCC}#Intent;scheme=zalo;package=com.zing.zalo;S.browser_fallback_url=${fallback};end`
      window.location.href = intentUrl
    } else {
      // Other mobile browsers: try direct scheme, fallback to redirect page
      window.location.href = `zalo://conversation?phone=${zaloWithCC}`
    }
  }, [zaloClean, zaloWebLink, zaloWithCC, zaloFallbackLink])

  const shopNameParts = shopInfo.shopName || 'Mộc Đậu Decor'
  const nameWords = shopNameParts.trim().split(/\s+/)
  const highlightWord = nameWords.length > 0 ? nameWords[nameWords.length - 1] : ''

  return (
    <div className="min-h-screen bg-white">
      {/* === Hero Section === */}
      <header className="relative bg-mint">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-10 md:pt-12 md:pb-16 text-center">
          {/* Logo - use object-contain with fixed width to preserve aspect ratio */}
          <div className="mb-4 flex justify-center overflow-visible">
            <img
              src="/logo.png"
              alt="Mộc Đậu Decor Logo"
              className="max-h-52 md:max-h-64 w-auto max-w-full"
              loading="eager"
            />
          </div>
          {/* Handmade with Love - Soft decorative vine badge */}
          <div className="mb-4 flex justify-center">
            <div className="relative inline-flex items-center">
              {/* Left vine - soft flowing curves */}
              <svg className="w-20 md:w-28 -mr-3 md:-mr-5 text-forest/20 flex-shrink-0" viewBox="0 0 100 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M95 18 C78 16, 68 6, 52 10 C40 13, 34 22, 22 18 C16 16, 12 12, 5 14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
                <path d="M95 20 C76 24, 64 30, 48 26 C38 23, 30 16, 18 20 C14 21, 10 18, 4 20" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.5"/>
                {/* Delicate curling tendrils */}
                <path d="M52 10 C48 4, 42 3, 40 7" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                <path d="M22 18 C18 24, 14 26, 12 22" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.3"/>
                {/* Soft leaves - thin and wispy */}
                <path d="M42 8 C38 4, 36 5, 38 9" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.15"/>
                <path d="M30 14 C26 10, 24 11, 26 15" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.12"/>
                <path d="M16 16 C12 12, 10 13, 12 17" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.1"/>
                {/* Tiny delicate flower bud */}
                <circle cx="5" cy="13" r="1.5" fill="currentColor" opacity="0.15"/>
                <circle cx="4" cy="19.5" r="1" fill="currentColor" opacity="0.12"/>
              </svg>

              {/* Center badge - soft and airy */}
              <div className="relative px-6 py-2">
                <span className="text-lg md:text-xl font-bold tracking-widest text-[#6B4F3A] italic select-none">Handmade with Love</span>
                {/* Soft dot accents */}
                <span className="absolute -top-1.5 right-2 w-1 h-1 rounded-full bg-tan/25"></span>
                <span className="absolute -bottom-1 left-3 w-0.5 h-0.5 rounded-full bg-forest/15"></span>
              </div>

              {/* Right vine - soft flowing curves (mirror) */}
              <svg className="w-20 md:w-28 -ml-3 md:-ml-5 text-forest/20 flex-shrink-0" viewBox="0 0 100 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 18 C22 16, 32 6, 48 10 C60 13, 66 22, 78 18 C84 16, 88 12, 95 14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
                <path d="M5 20 C24 24, 36 30, 52 26 C62 23, 70 16, 82 20 C86 21, 90 18, 96 20" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.5"/>
                {/* Delicate curling tendrils */}
                <path d="M48 10 C52 4, 58 3, 60 7" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                <path d="M78 18 C82 24, 86 26, 88 22" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.3"/>
                {/* Soft leaves - thin and wispy */}
                <path d="M58 8 C62 4, 64 5, 62 9" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.15"/>
                <path d="M70 14 C74 10, 76 11, 74 15" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.12"/>
                <path d="M84 16 C88 12, 90 13, 88 17" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.1"/>
                {/* Tiny delicate flower bud */}
                <circle cx="95" cy="13" r="1.5" fill="currentColor" opacity="0.15"/>
                <circle cx="96" cy="19.5" r="1" fill="currentColor" opacity="0.12"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight text-forest-dark">
            {nameWords.length > 1 ? (
              <>
                {nameWords.slice(0, -1).join(' ')}{' '}
                <span className="text-tan">{highlightWord}</span>
              </>
            ) : (
              <span className="text-tan">{shopNameParts}</span>
            )}
          </h1>
          <p className="text-base md:text-lg text-forest/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            Mộc Đậu Decor – Đậu lại chút xinh cho góc nhỏ của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#products" className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md hover:shadow-lg">
              <ShoppingBag className="w-5 h-5" />
              Xem sản phẩm
            </a>
            {zaloWebLink ? (
              <a href={zaloWebLink} onClick={handleZaloClick} className="inline-flex items-center justify-center gap-2 bg-white/70 hover:bg-white border border-white/80 px-8 py-3 rounded-full transition-colors text-forest-dark font-medium">
                <MessageCircle className="w-5 h-5" />
                Liên hệ đặt hàng
              </a>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 bg-white/40 border border-white/50 px-8 py-3 rounded-full text-forest/30 cursor-not-allowed">
                <MessageCircle className="w-5 h-5" />
                Liên hệ đặt hàng
              </span>
            )}
          </div>
        </div>
      </header>

      {/* === Products Section === */}
      <section id="products" className="max-w-6xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-forest/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="pl-10 h-11 rounded-full border-mint-dark bg-mint-light shadow-sm focus:ring-forest/30"
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-forest-dark mb-2">
            Sản phẩm của chúng tôi
          </h2>
          <div className="w-20 h-1 bg-tan mx-auto rounded-full" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-forest/20 mx-auto mb-4" />
            <p className="text-lg text-forest/50">
              {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden bg-white rounded-2xl border-mint-dark/40"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-square bg-mint-light overflow-hidden rounded-t-2xl">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mint-light to-tan/10">
                      <Gem className="w-12 h-12 text-forest/20" />
                    </div>
                  )}
                  {product.videoUrl && (
                    <div className="absolute top-2 right-2 bg-forest-dark/50 backdrop-blur-sm rounded-full p-1.5">
                      <Video className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-forest text-white text-[10px] px-2 py-0.5 rounded-full">
                      Còn hàng
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3 md:p-4">
                  <h3 className="font-semibold text-forest-dark text-sm md:text-base line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-forest/50 line-clamp-1 mb-2">{product.description}</p>
                  )}
                  <p className="text-forest font-bold text-sm md:text-lg">
                    {formatPrice(product.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* === Footer === */}
      <footer className="bg-mint text-forest mt-12">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center">
            <div className="mb-4 flex justify-center overflow-visible">
              <img
                src="/logo.png"
                alt="Mộc Đậu Decor Logo"
                className="max-h-32 w-auto max-w-full opacity-80"
              />
            </div>
            <h3 className="text-xl font-bold text-forest-dark mb-2">
              {nameWords.length > 1 ? (
                <>
                  {nameWords.slice(0, -1).join(' ')}{' '}
                  <span className="text-tan">{highlightWord}</span>
                </>
              ) : (
                <span className="text-tan">{shopNameParts}</span>
              )}
            </h3>
            <p className="text-sm mb-4 text-forest/70">Mộc Đậu Decor – Đậu lại chút xinh cho góc nhỏ của bạn.</p>
            {displayPhone && (
              <div className="flex items-center justify-center gap-4 text-sm mb-2">
                {telLink && (
                  <a
                    href={telLink}
                    className="flex items-center gap-1.5 hover:text-tan transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {displayPhone}
                  </a>
                )}
                {zaloWebLink && (
                  <a
                    href={zaloWebLink}
                    onClick={handleZaloClick}
                    className="flex items-center gap-1.5 hover:text-tan transition-colors"
                    title="Chat Zalo"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Zalo
                  </a>
                )}
              </div>
            )}
            <p className="text-xs text-forest/50 mt-6">
              &copy; {new Date().getFullYear()} {shopNameParts}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* === Blog Section === */}
      <BlogSection />

      {/* === Floating Admin Button === */}
      <button
        onClick={onAdminClick}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-forest/80 hover:bg-forest text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
        title="Đăng nhập quản trị"
        aria-label="Đăng nhập quản trị"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
        </svg>
      </button>

      {/* === Product Detail Dialog === */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProduct.imageUrl && (
              <button
                onClick={() => setZoomedImage(selectedProduct.imageUrl)}
                className="absolute top-4 right-14 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all active:scale-95"
                title="Phóng to ảnh"
              >
                <Maximize2 className="w-4 h-4 text-forest" />
              </button>
            )}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-forest" />
            </button>

            <div className="relative aspect-square bg-mint-light rounded-t-2xl overflow-hidden">
              {selectedProduct.videoUrl ? (
                <video
                  src={selectedProduct.videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  poster={selectedProduct.imageUrl || undefined}
                />
              ) : selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mint-light to-tan/10">
                  <Gem className="w-20 h-20 text-forest/20" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <Badge className="bg-forest text-white text-xs px-3 py-1 rounded-full">
                  Còn hàng
                </Badge>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-forest-dark mb-2">
                {selectedProduct.name}
              </h2>
              {selectedProduct.description && (
                <p className="text-forest/60 mb-4 leading-relaxed whitespace-pre-line">{selectedProduct.description}</p>
              )}

              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs text-forest/40 uppercase tracking-wider mb-1">Giá bán</p>
                  <p className="text-2xl md:text-3xl font-bold text-forest">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-forest/60 border-forest/20">
                  Tồn kho: {selectedProduct.stockQuantity}
                </Badge>
              </div>

              {zaloWebLink ? (
                <a
                  href={zaloWebLink}
                  onClick={handleZaloClick}
                  className="flex items-center justify-center gap-2 w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Liên hệ Zalo để đặt hàng
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full bg-tan/20 text-forest/40 font-semibold py-3 rounded-xl cursor-not-allowed">
                  <MessageCircle className="w-5 h-5" />
                  Chưa cấu hình Zalo
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Image Zoom Fullscreen === */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={zoomedImage}
            alt="Ảnh phóng to"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
