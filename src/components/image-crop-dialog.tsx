'use client'

import { useState, useCallback, useRef } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Crop, ZoomIn, RotateCw, Upload } from 'lucide-react'

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageReady: (imageDataUrl: string) => void
}

type AspectOption = 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16'

function getAspectValue(aspect: AspectOption): number | undefined {
  if (aspect === 'free') return undefined
  const [w, h] = aspect.split(':').map(Number)
  return w / h
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export default function ImageCropDialog({ open, onOpenChange, onImageReady }: ImageCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [aspect, setAspect] = useState<AspectOption>('free')
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }, [])

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCrop = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const image = await createImage(imageSrc)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const maxSize = 1200
      const { width, height } = croppedAreaPixels

      // Calculate output size (limit to maxSize for performance)
      let outputWidth = width
      let outputHeight = height
      if (outputWidth > maxSize || outputHeight > maxSize) {
        const ratio = Math.min(maxSize / outputWidth, maxSize / outputHeight)
        outputWidth = Math.round(outputWidth * ratio)
        outputHeight = Math.round(outputHeight * ratio)
      }

      canvas.width = outputWidth
      canvas.height = outputHeight

      if (!ctx) return

      ctx.save()
      ctx.translate(outputWidth / 2, outputHeight / 2)
      ctx.rotate((rotation * Math.PI) / 180)

      const scale = outputWidth / width
      ctx.scale(scale, scale)
      ctx.translate(-width / 2, -height / 2)
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )
      ctx.restore()

      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
      onImageReady(croppedImageUrl)
      onOpenChange(false)
      setImageSrc(null)
    } catch (error) {
      console.error('Crop failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, croppedAreaPixels, rotation, onImageReady, onOpenChange])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setFileName('')
    }
    onOpenChange(newOpen)
  }, [onOpenChange])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="flex items-center gap-2 text-forest">
              <Crop className="w-5 h-5" />
              Chỉnh sửa ảnh
            </DialogTitle>
          </DialogHeader>

          {!imageSrc ? (
            /* Upload area */
            <div className="px-6 pb-6">
              <div
                onClick={handleFileSelect}
                className="border-2 border-dashed border-forest/20 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-forest/40 hover:bg-forest/5 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-forest/50" />
                </div>
                <p className="text-sm font-medium text-forest/70 mb-1">
                  Nhấn để chọn ảnh
                </p>
                <p className="text-xs text-forest/40">
                  Hỗ trợ JPG, PNG, WebP
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Crop area */}
              <div className="relative w-full h-[350px] sm:h-[400px] bg-black/90">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={getAspectValue(aspect)}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              {/* Controls */}
              <div className="px-6 py-4 space-y-4 bg-forest/[0.02] border-t border-forest/10">
                {/* File name & aspect ratio */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-forest/50 truncate max-w-[150px]" title={fileName}>
                    📷 {fileName}
                  </span>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-forest/60 whitespace-nowrap">Tỷ lệ:</Label>
                    <Select value={aspect} onValueChange={(v) => setAspect(v as AspectOption)}>
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Tự do</SelectItem>
                        <SelectItem value="1:1">1:1</SelectItem>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="3:4">3:4</SelectItem>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="9:16">9:16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Zoom slider */}
                <div className="flex items-center gap-3">
                  <ZoomIn className="w-4 h-4 text-forest/40 shrink-0" />
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    min={1}
                    max={3}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-xs text-forest/40 w-10 text-right">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Rotation */}
                <div className="flex items-center gap-3">
                  <RotateCw className="w-4 h-4 text-forest/40 shrink-0" />
                  <Slider
                    value={[rotation]}
                    onValueChange={([v]) => setRotation(v)}
                    min={0}
                    max={360}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-forest/40 w-10 text-right">{rotation}°</span>
                </div>
              </div>

              {/* Actions */}
              <DialogFooter className="px-6 py-4 border-t border-forest/10 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileSelect}
                  className="text-forest/60"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Đổi ảnh
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="bg-forest hover:bg-forest/90 text-white"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Cắt & Chèn'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
