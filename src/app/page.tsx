'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, LogIn, Loader2 } from 'lucide-react'
import AdminPanel from '@/components/admin-panel'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
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
            setIsLoggedIn(true)
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

    setLoading(true)
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
          setIsLoggedIn(true)
        })
      } else {
        setLoginError(data.error || 'Đăng nhập thất bại')
      }
    } catch {
      setLoginError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('kn_admin')
    startTransition(() => {
      setIsLoggedIn(false)
      setUsername('')
    })
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

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (isPending && isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <AdminPanel
        username={username}
        onLogout={handleLogout}
        onBack={handleLogout}
        onChangePassword={handleChangePassword}
      />
    )
  }

  // Login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-xl">Kẽm Nhung</CardTitle>
          <CardDescription>Đăng nhập để quản lý cửa hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin"
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !loginUsername || !loginPassword}
            >
              {loading ? (
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
  )
}
