'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Sun,
  Contrast,
  Palette,
  Droplets,
  Wind,
  Compare,
  Split,
  Layers,
  History,
  Zap,
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

  // Compare mode
  const [showCompare, setShowCompare] = useState(false)
  const [compareValue, setCompareValue] = useState(50)

  // Watermark Settings
  const [positionMode, setPositionMode] = useState<PositionMode>('preset')
  const [presetPos, setPresetPos] = useState({ x: 90, y: 10 })
  const [customPos, setCustomPos] = useState({ x: 80, y: 20 })
  const [opacity, setOpacity] = useState(30)
  const [size, setSize] = useState(18)
  const [rotation, setRotation] = useState(0)
  const [tileGap, setTileGap] = useState(40)
  const [tileRotation, setTileRotation] = useState(-30)

  // Color Adjustments
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [hueRotate, setHueRotate] = useState(0)
  const [blur, setBlur] = useState(0)
  const [sepia, setSepia] = useState(0)
  const [grayscale, setGrayscale] = useState(0)

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
      if (showCompare) {
        // DRAW COMPARE MODE
        const splitPos = (canvas.width * compareValue) / 100

        // Right side (Modified)
        ctx.save()
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%)`
        ctx.drawImage(productImgRef.current, 0, 0, canvas.width, canvas.height)
        ctx.restore()

        // Draw Watermark on Modified Side (Clamped to split)
        drawWatermark(ctx, canvas, true)

        // Left side (Original) - Overlayed
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, splitPos, canvas.height)
        ctx.clip()
        ctx.filter = 'none'
        ctx.drawImage(productImgRef.current, 0, 0, canvas.width, canvas.height)
        ctx.restore()

        // Draw Split Line
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(splitPos, 0)
        ctx.lineTo(splitPos, canvas.height)
        ctx.stroke()
        
        // Label Original
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(10, 10, 80, 30)
        ctx.fillStyle = 'white'
        ctx.font = '14px sans-serif'
        ctx.fillText('ẢNH GỐC', 20, 30)
        
        // Label Modified
        ctx.fillStyle = 'rgba(5,150,105,0.7)'
        ctx.fillRect(canvas.width - 110, 10, 100, 30)
        ctx.fillStyle = 'white'
        ctx.fillText('ĐÃ CHỈNH', canvas.width - 100, 30)

      } else {
        // NORMAL DRAW
        ctx.save()
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%)`
        ctx.drawImage(productImgRef.current, 0, 0, canvas.width, canvas.height)
        ctx.restore()

        // 2. Draw Watermark
        drawWatermark(ctx, canvas)
      }
    }
  }, [
    hasImage, hasLogo, opacity, size, rotation, positionMode, presetPos, customPos, tileGap, tileRotation,
    brightness, contrast, saturation, hueRotate, blur, sepia, grayscale, showCompare, compareValue
  ])

  const drawWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, isClipped = false) => {
    if (!logoImgRef.current || !hasLogo) return

    const alpha = opacity / 100
    const sizePercent = size / 100
    const rotateRad = (rotation * Math.PI) / 180

    let logoW = canvas.width * sizePercent
    let logoH = logoImgRef.current.height * (logoW / Math.max(1, logoImgRef.current.width))

    ctx.save()
    if (isClipped) {
      const splitPos = (canvas.width * compareValue) / 100
      ctx.beginPath()
      ctx.rect(splitPos, 0, canvas.width - splitPos, canvas.height)
      ctx.clip()
    }
    
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
    ctx.restore()
  }

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

    // Ensure we download the modified full version even if in compare mode
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = canvas.width
    finalCanvas.height = canvas.height
    const fctx = finalCanvas.getContext('2d')
    if (fctx && productImgRef.current) {
      fctx.save()
      fctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%)`
      fctx.drawImage(productImgRef.current, 0, 0, finalCanvas.width, finalCanvas.height)
      fctx.restore()
      
      // Draw watermark without clipping
      if (hasLogo && logoImgRef.current) {
        const alpha = opacity / 100
        const sizePercent = size / 100
        const rotateRad = (rotation * Math.PI) / 180
        let logoW = finalCanvas.width * sizePercent
        let logoH = logoImgRef.current.height * (logoW / Math.max(1, logoImgRef.current.width))
        
        fctx.globalAlpha = alpha
        if (positionMode === 'tile') {
           // Reuse tile logic...
           const gapPercent = tileGap / 100
           const tRotateRad = (tileRotation * Math.PI) / 180
           const stepX = logoW + (logoW * (gapPercent / 0.2))
           const stepY = logoH + (logoH * (gapPercent / 0.2))
           const diagonal = Math.sqrt(finalCanvas.width ** 2 + finalCanvas.height ** 2)
           fctx.save()
           fctx.translate(finalCanvas.width/2, finalCanvas.height/2)
           fctx.rotate(tRotateRad)
           fctx.translate(-finalCanvas.width/2, -finalCanvas.height/2)
           for(let y = -diagonal/2; y < finalCanvas.height + diagonal/2; y+=stepY) {
             for(let x = -diagonal/2; x < finalCanvas.width + diagonal/2; x+=stepX) {
               fctx.drawImage(logoImgRef.current, x, y, logoW, logoH)
             }
           }
           fctx.restore()
        } else {
          let px = positionMode === 'preset' ? presetPos.x : customPos.x
          let py = positionMode === 'preset' ? presetPos.y : customPos.y
          const x = (finalCanvas.width * px) / 100 - logoW / 2
          const y = (finalCanvas.height * py) / 100 - logoH / 2
          fctx.save()
          fctx.translate(x + logoW / 2, y + logoH / 2)
          fctx.rotate(rotateRad)
          fctx.drawImage(logoImgRef.current, -logoW / 2, -logoH / 2, logoW, logoH)
          fctx.restore()
        }
      }
    }

    try {
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
      link.download = `Moc_Dau_Pro_${timestamp}.png`
      link.href = finalCanvas.toDataURL('image/png')
      link.click()
      setDownloadCount((prev) => prev + 1)
      toast.success('Tải ảnh Pro thành công')
    } catch (err) {
      toast.error('Lỗi khi tải ảnh')
    }
  }

  const handleReset = () => {
    // Reset image/logo
    setHasImage(false)
    setHasLogo(false)
    productImgRef.current = null
    logoImgRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (logoInputRef.current) logoInputRef.current.value = ''
    
    // Reset all settings
    setOpacity(30)
    setSize(18)
    setRotation(0)
    setPositionMode('preset')
    setPresetPos({ x: 90, y: 10 })
    setCustomPos({ x: 80, y: 20 })
    setTileGap(40)
    setTileRotation(-30)
    
    // Reset colors
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setHueRotate(0)
    setBlur(0)
    setSepia(0)
    setGrayscale(0)
    setShowCompare(false)
    
    toast.info('Đã khôi phục mặc định')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Canvas Panel */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <Card className="overflow-hidden border-forest/10 shadow-lg bg-white">
          <div className="bg-forest/5 px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-forest-dark font-medium">
                <ImageIcon className="w-4 h-4 text-forest" />
                {hasImage ? (
                  <Badge variant="outline" className="text-[10px] py-0 h-5 border-forest/20">{canvasRef.current?.width} x {canvasRef.current?.height}px</Badge>
                ) : (
                  <span>Sẵn sàng xử lý ảnh</span>
                )}
              </div>
              {hasImage && (
                <div className="flex items-center gap-1">
                  <Button 
                    variant={showCompare ? "default" : "outline"} 
                    size="sm" 
                    className={`h-7 text-[10px] gap-1.5 ${showCompare ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => setShowCompare(!showCompare)}
                  >
                    <Split className="w-3 h-3" /> {showCompare ? 'Đang so sánh' : 'So sánh Trước/Sau'}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 hover:bg-forest/5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Maximize className="w-3 h-3" /> Vừa khung
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 hover:text-red-600" onClick={handleReset}>
                <RotateCcw className="w-3 h-3" /> Làm mới
              </Button>
            </div>
          </div>
          
          <div className="relative bg-[#f8f5f2] bg-[repeating-conic-gradient(#f0e8e0_0%_25%,transparent_0%_50%)] bg-[length:30px_30px] min-h-[500px] flex items-center justify-center p-6 overflow-hidden">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[75vh] shadow-2xl rounded-sm transition-all duration-300 ${hasImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            />
            
            {showCompare && hasImage && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 bg-white/90 backdrop-blur shadow-xl border rounded-full p-2 flex items-center gap-3 px-4 animate-in slide-in-from-bottom-4">
                <Label className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Kéo để so sánh</Label>
                <Slider value={[compareValue]} min={0} max={100} step={1} onValueChange={([v]) => setCompareValue(v)} className="flex-1" />
              </div>
            )}

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
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-forest/20 flex items-center justify-center mb-6 group-hover:border-forest group-hover:bg-forest/5 group-hover:scale-110 transition-all duration-500">
                  <CloudUpload className="w-10 h-10 text-forest/30 group-hover:text-forest" />
                </div>
                <p className="text-forest-dark text-lg font-bold">Kéo thả ảnh sản phẩm</p>
                <p className="text-forest/40 text-sm mt-2 font-medium italic">Hỗ trợ JPG, PNG, WebP chất lượng cao</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg border border-forest/10 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Zap className="w-4 h-4" /></div>
            <div className="text-[11px]"><p className="font-bold">Xử lý nhanh</p><p className="text-muted-foreground">Tối ưu cho việc đăng bài bán hàng.</p></div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-forest/10 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"><History className="w-4 h-4" /></div>
            <div className="text-[11px]"><p className="font-bold">An toàn</p><p className="text-muted-foreground">Toàn bộ xử lý diễn ra trên trình duyệt.</p></div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-forest/10 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Layers className="w-4 h-4" /></div>
            <div className="text-[11px]"><p className="font-bold">Chuyên nghiệp</p><p className="text-muted-foreground">Tùy chỉnh màu sắc & đóng dấu Pro.</p></div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Step 1: Image & Logo Inputs (Simplified) */}
        <Card className="border-forest/10 shadow-sm overflow-hidden">
          <CardContent className="p-3 space-y-3">
             <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-16 flex-col gap-1 border-dashed text-[10px]" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleProductUpload(e.target.files[0])} />
                  {hasImage ? <><div className="font-bold text-forest truncate w-full px-2">{imageName}</div><div className="text-[8px]">{imageSize}</div></> : <><CloudUpload className="w-5 h-5 text-forest" /> Ảnh sản phẩm</>}
                </Button>
                <Button variant="outline" className="flex-1 h-16 flex-col gap-1 border-dashed text-[10px]" onClick={() => logoInputRef.current?.click()}>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                  {hasLogo ? <><div className="font-bold text-orange-600 truncate w-full px-2">{logoName}</div><div className="text-[8px]">{logoSize}</div></> : <><Stamp className="w-5 h-5 text-orange-600" /> Logo Watermark</>}
                </Button>
             </div>
          </CardContent>
        </Card>

        {/* Main Controls Tabs */}
        <Card className="border-forest/10 shadow-md overflow-hidden flex-1">
          <Tabs defaultValue="watermark" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-2 rounded-none bg-forest/5 border-b h-12">
              <TabsTrigger value="watermark" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-forest gap-2">
                <Stamp className="w-4 h-4" /> Đóng dấu
              </TabsTrigger>
              <TabsTrigger value="filters" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-forest gap-2">
                <Palette className="w-4 h-4" /> Chỉnh màu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="watermark" className="p-4 flex-1 space-y-5 animate-in fade-in">
              {/* Position Mode */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                  <Grip className="w-3 h-3" /> Vị trí logo
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button 
                    variant={positionMode === 'preset' ? 'default' : 'outline'} 
                    size="sm" 
                    className={`h-10 flex-col gap-0.5 text-[10px] ${positionMode === 'preset' ? 'bg-forest' : ''}`}
                    onClick={() => setPositionMode('preset')}
                  >
                    <Grip className="w-4 h-4" /> Nhanh
                  </Button>
                  <Button 
                    variant={positionMode === 'custom' ? 'default' : 'outline'} 
                    size="sm" 
                    className={`h-10 flex-col gap-0.5 text-[10px] ${positionMode === 'custom' ? 'bg-forest' : ''}`}
                    onClick={() => setPositionMode('custom')}
                  >
                    <Sliders className="w-4 h-4" /> Thủ công
                  </Button>
                  <Button 
                    variant={positionMode === 'tile' ? 'default' : 'outline'} 
                    size="sm" 
                    className={`h-10 flex-col gap-0.5 text-[10px] ${positionMode === 'tile' ? 'bg-forest' : ''}`}
                    onClick={() => setPositionMode('tile')}
                  >
                    <TableCellsSplit className="w-4 h-4" /> Lặp
                  </Button>
                </div>
              </div>

              {/* Position Specific Controls */}
              <div className="min-h-[140px] bg-gray-50/50 rounded-xl p-3 border border-dashed border-gray-200">
                {positionMode === 'preset' && (
                  <div className="grid grid-cols-3 gap-1.5 animate-in zoom-in-95 duration-200">
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
                        className={`aspect-[1.5/1] border rounded-lg flex items-center justify-center transition-all ${
                          presetPos.x === item.pos.x && presetPos.y === item.pos.y 
                          ? 'border-forest bg-forest/20 ring-1 ring-forest' 
                          : 'border-white bg-white shadow-sm hover:border-forest/30'
                        }`}
                        onClick={() => setPresetPos(item.pos)}
                      >
                        <div className={`w-2 h-2 rounded-full transition-all ${
                          presetPos.x === item.pos.x && presetPos.y === item.pos.y ? 'bg-forest scale-125 shadow-[0_0_8px_rgba(5,150,105,0.4)]' : 'bg-gray-200'
                        }`} />
                      </button>
                    ))}
                  </div>
                )}

                {positionMode === 'custom' && (
                  <div className="space-y-5 py-2 animate-in slide-in-from-right-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1"><Label className="text-[11px] font-bold text-muted-foreground">Ngang</Label><span className="text-[10px] font-bold text-forest">{customPos.x}%</span></div>
                      <Slider value={[customPos.x]} min={0} max={100} onValueChange={([v]) => setCustomPos(prev => ({ ...prev, x: v }))} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1"><Label className="text-[11px] font-bold text-muted-foreground">Dọc</Label><span className="text-[10px] font-bold text-forest">{customPos.y}%</span></div>
                      <Slider value={[customPos.y]} min={0} max={100} onValueChange={([v]) => setCustomPos(prev => ({ ...prev, y: v }))} />
                    </div>
                  </div>
                )}

                {positionMode === 'tile' && (
                  <div className="space-y-5 py-2 animate-in slide-in-from-right-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1"><Label className="text-[11px] font-bold text-muted-foreground">Khoảng cách</Label><span className="text-[10px] font-bold text-forest">{tileGap}%</span></div>
                      <Slider value={[tileGap]} min={20} max={80} onValueChange={([v]) => setTileGap(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1"><Label className="text-[11px] font-bold text-muted-foreground">Xoay nghiêng</Label><span className="text-[10px] font-bold text-forest">{tileRotation}°</span></div>
                      <Slider value={[tileRotation]} min={-90} max={0} onValueChange={([v]) => setTileRotation(v)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Logo Look */}
              <div className="pt-2 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Eye className="w-3 h-3 text-forest" /> Độ mờ logo</Label><span className="text-[10px] font-bold text-forest">{opacity}%</span></div>
                  <Slider value={[opacity]} min={5} max={100} onValueChange={([v]) => setOpacity(v)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Expand className="w-3 h-3 text-forest" /> Kích thước logo</Label><span className="text-[10px] font-bold text-forest">{size}%</span></div>
                  <Slider value={[size]} min={3} max={60} onValueChange={([v]) => setSize(v)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><RotateCw className="w-3 h-3 text-forest" /> Xoay logo</Label><span className="text-[10px] font-bold text-forest">{rotation}°</span></div>
                  <Slider value={[rotation]} min={-180} max={180} onValueChange={([v]) => setRotation(v)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="p-4 flex-1 space-y-6 animate-in fade-in">
               <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-3">
                  <Sun className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-orange-800 leading-normal">
                    <p className="font-bold mb-1">Hiệu ứng chuyên nghiệp</p>
                    Điều chỉnh ánh sáng và màu sắc giúp sản phẩm trông nổi bật hơn trên website.
                  </div>
               </div>

               <div className="space-y-5 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {/* Basic */}
                  <div className="space-y-4 pb-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Sun className="w-3 h-3 text-forest" /> Độ sáng</Label><span className="text-[10px] font-bold text-forest">{brightness}%</span></div>
                      <Slider value={[brightness]} min={50} max={200} step={1} onValueChange={([v]) => setBrightness(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Contrast className="w-3 h-3 text-forest" /> Tương phản</Label><span className="text-[10px] font-bold text-forest">{contrast}%</span></div>
                      <Slider value={[contrast]} min={50} max={200} step={1} onValueChange={([v]) => setContrast(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Droplets className="w-3 h-3 text-forest" /> Bão hòa</Label><span className="text-[10px] font-bold text-forest">{saturation}%</span></div>
                      <Slider value={[saturation]} min={0} max={200} step={1} onValueChange={([v]) => setSaturation(v)} />
                    </div>
                  </div>

                  {/* Advanced */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Wind className="w-3 h-3 text-forest" /> Làm mờ (Blur)</Label><span className="text-[10px] font-bold text-forest">{blur}px</span></div>
                      <Slider value={[blur]} min={0} max={10} step={0.1} onValueChange={([v]) => setBlur(v)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label className="text-[11px] font-bold flex items-center gap-2"><Palette className="w-3 h-3 text-forest" /> Sắc độ (Hue)</Label><span className="text-[10px] font-bold text-forest">{hueRotate}°</span></div>
                      <Slider value={[hueRotate]} min={0} max={360} step={1} onValueChange={([v]) => setHueRotate(v)} />
                    </div>
                  </div>

                  {/* Effects */}
                  <div className="pt-4 border-t grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground">Hoài cổ (Sepia)</Label>
                      <Slider value={[sepia]} min={0} max={100} onValueChange={([v]) => setSepia(v)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground">Ảnh xám (Gray)</Label>
                      <Slider value={[grayscale]} min={0} max={100} onValueChange={([v]) => setGrayscale(v)} />
                    </div>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            className="w-full h-14 bg-forest hover:bg-forest-dark text-white font-bold shadow-xl shadow-forest/10 gap-3 group relative overflow-hidden"
            disabled={!hasImage}
            onClick={handleDownload}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Download className="w-6 h-6" /> 
            <div className="text-left">
              <div className="text-sm">Xuất ảnh Pro</div>
              <div className="text-[9px] font-normal opacity-70">Xử lý toàn bộ màu & đóng dấu</div>
            </div>
          </Button>
          <div className="flex justify-between items-center px-4 py-2 bg-white border rounded-xl shadow-sm">
            <span className="text-[10px] text-muted-foreground font-medium">Đã tải: <strong className="text-forest">{downloadCount}</strong> ảnh</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-forest/60 animate-pulse delay-75"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-forest/30 animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(5, 150, 105, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(5, 150, 105, 0.3);
        }
      `}</style>
    </div>
  )
}
