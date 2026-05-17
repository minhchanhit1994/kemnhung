import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Store,
  Phone,
  MessageCircle,
  MapPin,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { ShopInfo } from '@/lib/types'
import { formatDate } from './utils'

interface SettingsTabProps {
  shopInfo: ShopInfo | null
  onRefresh: () => void
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  shopInfo,
  onRefresh,
}) => {
  const [settingsForm, setSettingsForm] = useState({
    shopName: 'Mộc Đậu Decor',
    phone: '',
    zalo: '',
    address: '',
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    if (shopInfo) {
      setSettingsForm({
        shopName: shopInfo.shopName || 'Mộc Đậu Decor',
        phone: shopInfo.phone || '',
        zalo: shopInfo.zalo || '',
        address: shopInfo.address || '',
      })
    }
  }, [shopInfo])

  const saveSettings = async () => {
    try {
      setSettingsSaving(true)
      setSettingsSaved(false)
      const res = await fetch('/api/shop-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })
      if (res.ok) {
        setSettingsSaved(true)
        onRefresh()
        setTimeout(() => setSettingsSaved(false), 3000)
      } else {
        const err = await res.json()
        alert(err.error || 'Lỗi lưu cài đặt')
      }
    } catch (error) {
      console.error('Settings error:', error)
      alert('Lỗi lưu cài đặt')
    } finally {
      setSettingsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-forest-light" />
            Thông tin cửa hàng
          </CardTitle>
          <CardDescription>
            Các thông tin này sẽ hiển thị trên trang chủ shop cho khách hàng xem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shop-name" className="flex items-center gap-2">
              <Store className="w-4 h-4 text-gray-400" />
              Tên cửa hàng
            </Label>
            <Input
              id="shop-name"
              value={settingsForm.shopName}
              onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
              disabled={settingsSaving}
            />
            <p className="text-xs text-muted-foreground">
              Hiển thị trên trang chủ, header và footer. VD: Mộc Đậu Decor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              Số điện thoại
            </Label>
            <Input
              id="shop-phone"
              value={settingsForm.phone}
              onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
              disabled={settingsSaving}
            />
            <p className="text-xs text-muted-foreground">
              Hiển thị ở footer. VD: 0912345678
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-zalo" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              Số Zalo
            </Label>
            <Input
              id="shop-zalo"
              value={settingsForm.zalo}
              onChange={(e) => setSettingsForm({ ...settingsForm, zalo: e.target.value })}
              disabled={settingsSaving}
            />
            <p className="text-xs text-muted-foreground">
              Khách click &quot;Liên hệ đặt hàng&quot; sẽ mở chat Zalo. VD: 0912345678
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Địa chỉ
            </Label>
            <Input
              id="shop-address"
              value={settingsForm.address}
              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              disabled={settingsSaving}
            />
            <p className="text-xs text-muted-foreground">
              Hiển thị trên trang chủ. VD: Số 1, Đường ABC, Quận X
            </p>
          </div>

          {shopInfo && (
            <div className="bg-gray-50 rounded-xl p-4 border">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Xem trước</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Tên shop:</span> <span className="font-medium">{settingsForm.shopName || 'Mộc Đậu Decor'}</span></p>
                <p><span className="text-muted-foreground">SĐT:</span> {settingsForm.phone || '—'}</p>
                <p><span className="text-muted-foreground">Zalo:</span> {settingsForm.zalo || settingsForm.phone ? (
                  <a href={`https://zalo.me/${(settingsForm.zalo || settingsForm.phone).replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="text-forest hover:underline ml-1">Mở chat Zalo</a>
                ) : <span className="text-amber-600 ml-1">Chưa cấu hình</span>}</p>
                <p><span className="text-muted-foreground">Địa chỉ:</span> {settingsForm.address || '—'}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={saveSettings} disabled={settingsSaving} className="bg-forest hover:bg-forest-dark">
              {settingsSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</>
              )}
            </Button>
            {settingsSaved && (
              <span className="flex items-center gap-1 text-forest text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Đã lưu thành công! Trang chủ sẽ cập nhật ngay.
              </span>
            )}
          </div>

          {shopInfo?.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Cập nhật lần cuối: {formatDate(shopInfo.updatedAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsTab
