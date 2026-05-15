'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ImageIcon,
  Stamp,
  Expand,
  RotateCcw,
  Download,
  X,
  CloudUpload,
  Grip,
  Sliders,
  TableCellsSplit,
  Eye,
  Maximize,
  RotateCw,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'

type PositionMode = 'preset' | 'custom' | 'tile'

export default function WatermarkStudio() {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const productImgRef = useRef<HTMLImageElement | null>(null)
  const logoImgRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // State
  const [hasImage, setHasImage] = useState(false)
  const [hasLogo, setHasLogo] = useState(false)
  const [imageName, setImageName] = useState('')
  const [imageSize, setImageSize] = useState('')
  const [logoName, setLogoName] = useState('')
  const [logoSize, setLogoSize] = useState('')
  const [downloadCount, setDownloadCount] = useState(0)

  // Watermark Settings
  const [positionMode, setPositionMode] = useState<PositionMode>('preset')
  const [presetPos, setPresetPos] = useState({ x: 90, y: 10 })
  const [customPos, setCustomPos] = useState({ x: 80, y: 20 })
  const [opacity, setOpacity] = useState(30)
  const [size, setSize] = useState(18)
  const [rotation, setRotation] = useState(0)
  const [tileGap, setTileGap] = useState(40)
  const [tileRotation, setTileRotation] = useState(-30)

  // Helpers
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  // Draw Function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. Draw Product Image
    if (productImgRef.current && hasImage) {
      ctx.drawImage(productImgRef.current, 0, 0, canvas.width, canvas.height)
    }

    // 2. Draw Watermark
    if (logoImgRef.current && hasLogo && hasImage) {
      const alpha = opacity / 100
      const sizePercent = size / 100
      const rotateRad = (rotation * Math.PI) / 180

      let logoW = canvas.width * sizePercent
      let logoH = logoImgRef.current.height * (logoW / Math.max(1, logoImgRef.current.width))

      ctx.globalAlpha = alpha

      if (positionMode === 'tile') {
        const gapPercent = tileGap / 100
        const tRotateRad = (tileRotation * Math.PI) / 180

        const gapX = logoW * (gapPercent / 0.2)
        const gapY = logoH * (gapPercent / 0.2)
        const stepX = logoW + gapX
        const stepY = logoH + gapY

        const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height)
        const startX = -diagonal / 2
        const startY = -diagonal / 2
        const endX = canvas.width + diagonal / 2
        const endY = canvas.height + diagonal / 2

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(tRotateRad)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)

        for (let y = startY; y < endY; y += stepY) {
          for (let x = startX; x < endX; x += stepX) {
            ctx.drawImage(logoImgRef.current, x, y, logoW, logoH)
          }
        }
        ctx.restore()
      } else {
        let posX, posY
        if (positionMode === 'preset') {
          posX = presetPos.x
          posY = presetPos.y
        } else {
          posX = customPos.x
          posY = customPos.y
        }

        const x = (canvas.width * posX) / 100 - logoW / 2
        const y = (canvas.height * posY) / 100 - logoH / 2

        ctx.save()
        ctx.translate(x + logoW / 2, y + logoH / 2)
        ctx.rotate(rotateRad)
        ctx.drawImage(logoImgRef.current, -logoW / 2, -logoH / 2, logoW, logoH)
        ctx.restore()
      }

      ctx.globalAlpha = 1.0
    }
  }, [hasImage, hasLogo, opacity, size, rotation, positionMode, presetPos, customPos, tileGap, tileRotation])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Handlers
  const handleProductUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = img.width
          canvas.height = img.height
        }
        productImgRef.current = img
        setHasImage(true)
        setImageName(file.name)
        setImageSize(formatFileSize(file.size))
        toast.success('Tải ảnh thành công')
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        logoImgRef.current = img
        setHasLogo(true)
        setLogoName(file.name)
        setLogoSize(formatFileSize(file.size))
        toast.success('Tải logo thành công')
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasImage) return

    try {
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
      link.download = `Moc_Dau_Decor_${timestamp}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setDownloadCount((prev) => prev + 1)
      toast.success('Tải ảnh thành công')
    } catch (err) {
      toast.error('Lỗi khi tải ảnh')
    }
  }

  const handleReset = () => {
    setHasImage(false)
    setHasLogo(false)
    productImgRef.current = null
    logoImgRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (logoInputRef.current) logoInputRef.current.value = ''
    
    // Reset settings
    setOpacity(30)
    setSize(18)
    setRotation(0)
    setPositionMode('preset')
    setPresetPos({ x: 90, y: 10 })
    setCustomPos({ x: 80, y: 20 })
    setTileGap(40)
    setTileRotation(-30)
    
    toast.info('Đã làm mới toàn bộ')
  }

  const removeProduct = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHasImage(false)
    productImgRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHasLogo(false)
    logoImgRef.current = null
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Canvas Panel */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <Card className="overflow-hidden border-forest/10 shadow-md">
          <div className="bg-forest/5 px-4 py-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-forest-dark font-medium">
              <ImageIcon className="w-4 h-4 text-forest" />
              {hasImage ? (
                <span>{canvasRef.current?.width} x {canvasRef.current?.height}px</span>
              ) : (
                <span>Chưa có ảnh</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Maximize className="w-3 h-3" /> Vừa khung
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 hover:text-red-600" onClick={handleReset}>
                <RotateCcw className="w-3 h-3" /> Làm mới
              </Button>
            </div>
          </div>
          <div className="relative bg-[#e8e0d8] bg-[repeating-conic-gradient(#f0e8e0_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] min-h-[400px] flex items-center justify-center p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[70vh] shadow-2xl rounded transition-all duration-500 ${hasImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            />
            {!hasImage && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files[0]) handleProductUpload(e.dataTransfer.files[0])
                }}
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-forest/30 flex items-center justify-center mb-4 group-hover:border-forest group-hover:scale-110 transition-all duration-300">
                  <CloudUpload className="w-8 h-8 text-forest/40 group-hover:text-forest" />
                </div>
                <p className="text-forest/60 text-sm font-medium">Kéo thả ảnh sản phẩm vào đây</p>
                <p className="text-forest/30 text-[10px] mt-1">Hoặc click để chọn file</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Step 1: Image */}
        <Card className="border-forest/10 shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 bg-forest/5 border-b flex flex-row items-center gap-3 space-y-0">
            <div className="w-6 h-6 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">1</div>
            <CardTitle className="text-sm font-semibold">Ảnh sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${hasImage ? 'border-forest/40 bg-forest/5' : 'border-gray-200 hover:border-forest/40'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleProductUpload(e.target.files[0])}
              />
              {hasImage ? (
                <div className="flex items-center gap-3 text-left">
                  <img src={URL.createObjectURL(new Blob())} alt="" className="w-12 h-12 rounded object-cover border" ref={(el) => {
                    if (el && productImgRef.current) el.src = productImgRef.current.src
                  }} />
                  <div className="flex-1 min-width-0">
                    <p className="text-xs font-bold truncate text-forest-dark">{imageName}</p>
                    <p className="text-[10px] text-muted-foreground">{imageSize}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={removeProduct}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="py-2">
                  <ImageIcon className="w-6 h-6 text-forest/40 mx-auto mb-2" />
                  <p className="text-xs font-medium">Chọn hoặc kéo thả ảnh</p>
                  <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Logo */}
        <Card className="border-forest/10 shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 bg-forest/5 border-b flex flex-row items-center gap-3 space-y-0">
            <div className="w-6 h-6 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">2</div>
            <CardTitle className="text-sm font-semibold">Logo Watermark</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${hasLogo ? 'border-forest/40 bg-forest/5' : 'border-gray-200 hover:border-forest/40'}`}
              onClick={() => logoInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={logoInputRef} 
                className="hidden" 
                accept="image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              />
              {hasLogo ? (
                <div className="flex items-center gap-3 text-left">
                  <img src="" alt="" className="w-12 h-12 rounded object-cover border bg-gray-100" ref={(el) => {
                    if (el && logoImgRef.current) el.src = logoImgRef.current.src
                  }} />
                  <div className="flex-1 min-width-0">
                    <p className="text-xs font-bold truncate text-forest-dark">{logoName}</p>
                    <p className="text-[10px] text-muted-foreground">{logoSize}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={removeLogo}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="py-2">
                  <Stamp className="w-6 h-6 text-forest/40 mx-auto mb-2" />
                  <p className="text-xs font-medium">Chọn logo (PNG tách nền)</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, WebP</p>
                </div>
              )}
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-md p-2 flex items-start gap-2">
              <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-800 leading-tight">Dùng logo PNG đã tách nền để có kết quả đẹp nhất.</p>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Settings */}
        <Card className="border-forest/10 shadow-sm overflow-hidden flex-1">
          <CardHeader className="py-3 px-4 bg-forest/5 border-b flex flex-row items-center gap-3 space-y-0">
            <div className="w-6 h-6 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center">3</div>
            <CardTitle className="text-sm font-semibold">Tùy chỉnh</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            {/* Position Mode */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold flex items-center gap-2">
                <Grip className="w-3 h-3" /> Chế độ vị trí
              </Label>
              <div className="grid grid-cols-3 gap-1">
                <Button 
                  variant={positionMode === 'preset' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`h-9 px-1 flex-col gap-0.5 text-[10px] ${positionMode === 'preset' ? 'bg-forest' : ''}`}
                  onClick={() => setPositionMode('preset')}
                >
                  <Grip className="w-3 h-3" /> Nhanh
                </Button>
                <Button 
                  variant={positionMode === 'custom' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`h-9 px-1 flex-col gap-0.5 text-[10px] ${positionMode === 'custom' ? 'bg-forest' : ''}`}
                  onClick={() => setPositionMode('custom')}
                >
                  <Sliders className="w-3 h-3" /> Thủ công
                </Button>
                <Button 
                  variant={positionMode === 'tile' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`h-9 px-1 flex-col gap-0.5 text-[10px] ${positionMode === 'tile' ? 'bg-forest' : ''}`}
                  onClick={() => setPositionMode('tile')}
                >
                  <TableCellsSplit className="w-3 h-3" /> Lặp
                </Button>
              </div>
            </div>

            {/* Preset Grid */}
            {positionMode === 'preset' && (
              <div className="grid grid-cols-3 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                {[
                  { pos: { x: 10, y: 10 }, label: 'Trái trên' },
                  { pos: { x: 50, y: 10 }, label: 'Giữa trên' },
                  { pos: { x: 90, y: 10 }, label: 'Phải trên' },
                  { pos: { x: 10, y: 50 }, label: 'Trái giữa' },
                  { pos: { x: 50, y: 50 }, label: 'Chính giữa' },
                  { pos: { x: 90, y: 50 }, label: 'Phải giữa' },
                  { pos: { x: 10, y: 90 }, label: 'Trái dưới' },
                  { pos: { x: 50, y: 90 }, label: 'Giữa dưới' },
                  { pos: { x: 90, y: 90 }, label: 'Phải dưới' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className={`aspect-[1.6/1] border rounded-md flex items-center justify-center transition-all ${
                      presetPos.x === item.pos.x && presetPos.y === item.pos.y 
                      ? 'border-forest bg-forest/10 ring-1 ring-forest' 
                      : 'border-gray-100 bg-gray-50 hover:bg-forest/5 hover:border-forest/30'
                    }`}
                    onClick={() => setPresetPos(item.pos)}
                    title={item.label}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                      presetPos.x === item.pos.x && presetPos.y === item.pos.y ? 'bg-forest scale-150 shadow-[0_0_8px_rgba(5,150,105,0.5)]' : 'bg-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
            )}

            {/* Custom Sliders */}
            {positionMode === 'custom' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] flex items-center gap-2"><Maximize className="w-3 h-3 text-forest rotate-90" /> Vị trí ngang</Label>
                    <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{customPos.x}%</span>
                  </div>
                  <Slider value={[customPos.x]} min={0} max={100} step={1} onValueChange={([v]) => setCustomPos(prev => ({ ...prev, x: v }))} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] flex items-center gap-2"><Maximize className="w-3 h-3 text-forest" /> Vị trí dọc</Label>
                    <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{customPos.y}%</span>
                  </div>
                  <Slider value={[customPos.y]} min={0} max={100} step={1} onValueChange={([v]) => setCustomPos(prev => ({ ...prev, y: v }))} />
                </div>
              </div>
            )}

            {/* Tile Sliders */}
            {positionMode === 'tile' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] flex items-center gap-2"><Grip className="w-3 h-3 text-forest" /> Khoảng cách</Label>
                    <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{tileGap}%</span>
                  </div>
                  <Slider value={[tileGap]} min={20} max={80} step={1} onValueChange={([v]) => setTileGap(v)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[11px] flex items-center gap-2"><RotateCw className="w-3 h-3 text-forest" /> Xoay lặp</Label>
                    <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{tileRotation}°</span>
                  </div>
                  <Slider value={[tileRotation]} min={-90} max={0} step={1} onValueChange={([v]) => setTileRotation(v)} />
                </div>
              </div>
            )}

            {/* Common Sliders */}
            <div className="pt-4 border-t space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] flex items-center gap-2"><Eye className="w-3 h-3 text-forest" /> Độ mờ</Label>
                  <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{opacity}%</span>
                </div>
                <Slider value={[opacity]} min={5} max={100} step={1} onValueChange={([v]) => setOpacity(v)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] flex items-center gap-2"><Expand className="w-3 h-3 text-forest" /> Kích thước</Label>
                  <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{size}%</span>
                </div>
                <Slider value={[size]} min={3} max={60} step={1} onValueChange={([v]) => setSize(v)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] flex items-center gap-2"><RotateCw className="w-3 h-3 text-forest" /> Xoay</Label>
                  <span className="text-[10px] font-bold text-forest bg-forest/10 px-2 rounded-full">{rotation}°</span>
                </div>
                <Slider value={[rotation]} min={-180} max={180} step={1} onValueChange={([v]) => setRotation(v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Button */}
        <div className="space-y-3">
          <Button 
            className="w-full h-12 bg-forest hover:bg-forest-dark text-white font-bold shadow-lg shadow-forest/20 gap-2"
            disabled={!hasImage}
            onClick={handleDownload}
          >
            <Download className="w-5 h-5" /> Tải ảnh về máy
          </Button>
          <div className="bg-white border rounded-lg p-2 text-center text-[10px] text-muted-foreground">
            Đã xử lý <strong className="text-forest font-bold">{downloadCount}</strong> ảnh trong phiên này
          </div>
        </div>
      </div>
    </div>
  )
}
