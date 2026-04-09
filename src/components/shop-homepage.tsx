'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag, Gem, Video, X, Phone, MessageCircle, Maximize2 } from 'lucide-react'
import type { Product, ShopInfo } from '@/lib/types'

interface ShopHomepageProps {
  onAdminClick: () => void
}

const DEFAULT_SHOP: ShopInfo = {
  id: '',
  shopName: 'Kẽm Nhung',
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
  const zaloLink = zaloNumber ? `https://zalo.me/${zaloNumber.replace(/^0/, '')}` : null
  const displayPhone = shopInfo.phone || shopInfo.zalo || ''

  const shopNameParts = shopInfo.shopName || 'Kẽm Nhung'
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
          {/* Handmade with Love - Decorative vine badge */}
          <div className="mb-4 flex justify-center">
            <div className="relative inline-flex items-center">
              {/* Left vine */}
              <svg className="w-16 md:w-20 -mr-2 md:-mr-3 text-forest/30 flex-shrink-0" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M75 20 C60 20, 50 8, 35 12 C25 15, 20 25, 8 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M75 20 C58 22, 48 32, 32 28 C22 25, 16 16, 5 22" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
                {/* Left small leaves */}
                <ellipse cx="28" cy="10" rx="4" ry="2.5" transform="rotate(-30 28 10)" fill="currentColor" opacity="0.4"/>
                <ellipse cx="18" cy="18" rx="3.5" ry="2" transform="rotate(20 18 18)" fill="currentColor" opacity="0.35"/>
                <ellipse cx="10" cy="15" rx="3" ry="1.8" transform="rotate(-40 10 15)" fill="currentColor" opacity="0.3"/>
                {/* Tiny flower on left */}
                <circle cx="6" cy="21" r="2" fill="currentColor" opacity="0.25"/>
                <circle cx="6" cy="21" r="1" fill="currentColor" opacity="0.4"/>
              </svg>

              {/* Center badge */}
              <div className="relative bg-white/50 backdrop-blur-sm border border-white/60 rounded-full px-5 py-2 shadow-sm">
                <span className="text-sm md:text-base font-medium tracking-wide text-forest-light italic">Handmade with Love</span>
                {/* Tiny flowers on badge */}
                <svg className="absolute -top-2 -right-1 w-4 h-4 text-tan/40" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="2.5"/>
                  <ellipse cx="8" cy="4" rx="1.5" ry="2.5"/>
                  <ellipse cx="8" cy="12" rx="1.5" ry="2.5"/>
                  <ellipse cx="4" cy="8" rx="2.5" ry="1.5"/>
                  <ellipse cx="12" cy="8" rx="2.5" ry="1.5"/>
                  <circle cx="8" cy="8" r="1.5" fill="white" opacity="0.5"/>
                </svg>
                <svg className="absolute -bottom-1.5 -left-1 w-3.5 h-3.5 text-forest/20" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="2"/>
                  <ellipse cx="8" cy="4.5" rx="1.2" ry="2"/>
                  <ellipse cx="8" cy="11.5" rx="1.2" ry="2"/>
                  <ellipse cx="4.5" cy="8" rx="2" ry="1.2"/>
                  <ellipse cx="11.5" cy="8" rx="2" ry="1.2"/>
                </svg>
              </div>

              {/* Right vine */}
              <svg className="w-16 md:w-20 -ml-2 md:-ml-3 text-forest/30 flex-shrink-0" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20 C20 20, 30 8, 45 12 C55 15, 60 25, 72 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M5 20 C22 22, 32 32, 48 28 C58 25, 64 16, 75 22" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
                {/* Right small leaves */}
                <ellipse cx="52" cy="10" rx="4" ry="2.5" transform="rotate(30 52 10)" fill="currentColor" opacity="0.4"/>
                <ellipse cx="62" cy="18" rx="3.5" ry="2" transform="rotate(-20 62 18)" fill="currentColor" opacity="0.35"/>
                <ellipse cx="70" cy="15" rx="3" ry="1.8" transform="rotate(40 70 15)" fill="currentColor" opacity="0.3"/>
                {/* Tiny flower on right */}
                <circle cx="74" cy="21" r="2" fill="currentColor" opacity="0.25"/>
                <circle cx="74" cy="21" r="1" fill="currentColor" opacity="0.4"/>
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
            {zaloLink ? (
              <a href={zaloLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/70 hover:bg-white border border-white/80 px-8 py-3 rounded-full transition-colors text-forest-dark font-medium">
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
                <a
                  href={zaloLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-tan transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {displayPhone}
                </a>
              </div>
            )}
            <p className="text-xs text-forest/50 mt-6">
              &copy; {new Date().getFullYear()} {shopNameParts}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

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

              {zaloLink ? (
                <a
                  href={zaloLink}
                  target="_blank"
                  rel="noopener noreferrer"
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
