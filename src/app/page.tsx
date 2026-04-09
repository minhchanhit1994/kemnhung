'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, LogIn, Loader2, X } from 'lucide-react'
import AdminPanel from '@/components/admin-panel'
import ShopHomepage from '@/components/shop-homepage'

type View = 'shop' | 'admin'

export default function Home() {
  const [view, setView] = useState<View>('shop')
  const [username, setUsername] = useState('')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Hydration-safe: read localStorage only on mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('kn_admin')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.username && data.token) {
          startTransition(() => {
            setUsername(data.username)
          })
        }
      } catch {
        localStorage.removeItem('kn_admin')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUsername || !loginPassword) return

    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem('kn_admin', JSON.stringify({
          username: data.admin.username,
          token: data.token,
        }))
        startTransition(() => {
          setUsername(data.admin.username)
          setView('admin')
          setShowLoginDialog(false)
          setLoginUsername('')
          setLoginPassword('')
          setLoginError('')
        })
      } else {
        setLoginError(data.error || 'Đăng nhập thất bại')
      }
    } catch {
      setLoginError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('kn_admin')
    startTransition(() => {
      setUsername('')
      setView('shop')
    })
  }, [])

  const handleBackToShop = useCallback(() => {
    setView('shop')
  }, [])

  const handleChangePassword = useCallback(async () => {
    const newPassword = prompt('Nhập mật khẩu mới:')
    if (!newPassword) return
    try {
      const saved = localStorage.getItem('kn_admin')
      const data = saved ? JSON.parse(saved) : {}
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          oldPassword: prompt('Nhập mật khẩu cũ:'),
          newPassword,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        alert('Đổi mật khẩu thành công!')
      } else {
        alert(result.error || 'Đổi mật khẩu thất bại')
      }
    } catch {
      alert('Lỗi đổi mật khẩu')
    }
  }, [])

  const openLoginDialog = () => {
    setLoginUsername('')
    setLoginPassword('')
    setLoginError('')
    setShowLoginDialog(true)
  }

  // Loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Show admin panel
  if (view === 'admin' && username) {
    return (
      <AdminPanel
        username={username}
        onLogout={handleLogout}
        onBack={handleBackToShop}
        onChangePassword={handleChangePassword}
      />
    )
  }

  // Public shop view
  return (
    <>
      <ShopHomepage onAdminClick={openLoginDialog} />

      {/* === Admin Login Dialog === */}
      {showLoginDialog && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLoginDialog(false)}
        >
          <Card
            className="w-full max-w-sm shadow-2xl border-0"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="text-center relative pb-2">
              <button
                onClick={() => setShowLoginDialog(false)}
                className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">Quản trị</CardTitle>
              <CardDescription>Đăng nhập để quản lý cửa hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Tên đăng nhập</Label>
                  <Input
                    id="login-username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder=""
                    disabled={loginLoading}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    disabled={loginLoading}
                    autoComplete="current-password"
                  />
                </div>
                {loginError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loginLoading || !loginUsername || !loginPassword}
                >
                  {loginLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  Đăng nhập
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
