import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Eye,
  TrendingUp,
  Star,
  Package,
  SearchCode,
  ArrowUp,
  ArrowDown,
  Clock,
  ChartSpline,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { AnalyticsData } from './types'
import { formatPrice, formatDateShort, getTimeAgo } from './utils'

interface AnalyticsTabProps {
  analyticsData: AnalyticsData | null
  analyticsLoading: boolean
  analyticsPeriod: number
  setAnalyticsPeriod: (period: number) => void
  dbSetupStatus: string
  dbSetupSql: string
  dbSetupDashboardUrl: string
  setupRunning: boolean
  runAutoSetup: () => void
  checkDbSetup: () => void
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  analyticsData,
  analyticsLoading,
  analyticsPeriod,
  setAnalyticsPeriod,
  dbSetupStatus,
  dbSetupSql,
  dbSetupDashboardUrl,
  setupRunning,
  runAutoSetup,
  checkDbSetup,
}) => {
  const [activityPage, setActivityPage] = useState(1)
  const [activityFilter, setActivityFilter] = useState('all') // all, today, month, year
  const itemsPerPage = 10

  const filteredActivities = useMemo(() => {
    if (!analyticsData) return []
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const thisMonthStr = todayStr.substring(0, 7) // YYYY-MM
    const thisYearStr = todayStr.substring(0, 4) // YYYY

    return analyticsData.recentActivity.filter(activity => {
      if (activityFilter === 'all') return true
      
      const activityDate = new Date(activity.time).toISOString().split('T')[0]
      if (activityFilter === 'today') return activityDate === todayStr
      if (activityFilter === 'month') return activityDate.startsWith(thisMonthStr)
      if (activityFilter === 'year') return activityDate.startsWith(thisYearStr)
      return true
    })
  }, [analyticsData, activityFilter])

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * itemsPerPage
    return filteredActivities.slice(start, start + itemsPerPage)
  }, [filteredActivities, activityPage])

  // Reset page when filter changes
  useMemo(() => {
    setActivityPage(1)
  }, [activityFilter])

  return (
    <div className="space-y-6">
      {/* Database Connection Status */}
      <Card className={`rounded-xl shadow-sm border ${dbSetupStatus === 'connected' ? 'border-green-300 bg-green-50/50' : dbSetupStatus === 'needs_setup' ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 bg-white'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span className="font-semibold text-sm">Kết nối database</span>
            </div>
            <div className="flex items-center gap-2">
              {dbSetupStatus === 'connected' && (
                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Đã kết nối Supabase
                </Badge>
              )}
              {dbSetupStatus === 'needs_setup' && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                  Cần cài đặt
                </Badge>
              )}
              {dbSetupStatus === 'not_configured' && (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
                  Chưa cấu hình
                </Badge>
              )}
              {dbSetupStatus === 'loading' && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={checkDbSetup} title="Kiểm tra lại">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {dbSetupStatus === 'connected' && (
            <p className="text-xs text-green-600">
              Dữ liệu thống kê đang được lưu trữ trên Supabase cloud an toàn.
            </p>
          )}

          {(dbSetupStatus === 'needs_setup' || dbSetupStatus === 'not_configured') && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {dbSetupStatus === 'not_configured'
                  ? 'Chưa cấu hình Supabase. Hệ thống đang dùng file lưu trữ tạm thời.'
                  : 'Supabase đã cấu hình nhưng chưa tạo bảng analytics. Hệ thống đang dùng file lưu trữ tạm thời.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {dbSetupStatus === 'needs_setup' && (
                  <Button
                    size="sm"
                    onClick={runAutoSetup}
                    disabled={setupRunning}
                    className="bg-forest hover:bg-forest-dark text-white"
                  >
                    {setupRunning ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Đang cài đặt...</>
                    ) : (
                      <><Database className="w-3.5 h-3.5 mr-1" />Tự động cài đặt</>
                    )}
                  </Button>
                )}
                {dbSetupDashboardUrl && (
                  <a href={dbSetupDashboardUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-forest/30 text-forest hover:bg-forest/5">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Mở Supabase SQL Editor
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-forest bg-white rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tổng truy cập</p>
                <p className="text-xl font-bold text-forest-dark">{analyticsData?.overview.totalPageViews ?? 0}</p>
              </div>
              <Eye className="w-8 h-8 text-forest-light" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-forest bg-white rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Truy cập hôm nay</p>
                <p className="text-xl font-bold text-forest-dark">{analyticsData?.overview.todayPageViews ?? 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-forest-light" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-forest bg-white rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Top sản phẩm</p>
                <p className="text-sm font-bold text-forest-dark line-clamp-2">{analyticsData?.topProducts?.[0]?.productName || '—'}</p>
              </div>
              <Star className="w-8 h-8 text-forest-light" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-forest bg-white rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Lượt xem SP</p>
                <p className="text-xl font-bold text-forest-dark">{analyticsData?.overview.totalProductViews ?? 0}</p>
              </div>
              <Package className="w-8 h-8 text-forest-light" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Khoảng thời gian:</span>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setAnalyticsPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                analyticsPeriod === d
                  ? 'bg-forest text-white'
                  : 'bg-mint-light text-forest hover:bg-mint-dark/20'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {analyticsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-forest" />
          <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
        </div>
      )}

      {!analyticsLoading && analyticsData && (
        <>
          {/* Daily Traffic Chart */}
          {analyticsData.dailyTraffic.length > 0 && (
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-forest-light" />
                  Lưu lượng truy cập hàng ngày
                </CardTitle>
                <CardDescription>Truy cập trang và xem sản phẩm theo ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.dailyTraffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v)
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(v: string) => {
                        const d = new Date(v)
                        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="pageViews" name="Truy cập trang" fill="#A7DFC1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="productViews" name="Xem sản phẩm" fill="#1A6B4F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Visitor Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-mint-light rounded-xl p-4 border border-mint-dark/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-forest-light" />
                <span className="text-xs text-muted-foreground">Khách truy cập ({analyticsPeriod}d)</span>
              </div>
              <p className="text-lg font-bold text-forest-dark">{analyticsData.overview.uniqueVisitors}</p>
            </div>
            <div className="bg-mint-light rounded-xl p-4 border border-mint-dark/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-forest-light" />
                <span className="text-xs text-muted-foreground">Hôm nay</span>
              </div>
              <p className="text-lg font-bold text-forest-dark">{analyticsData.overview.todayVisitors}</p>
            </div>
            <div className="bg-mint-light rounded-xl p-4 border border-mint-dark/20">
              <div className="flex items-center gap-2 mb-1">
                <SearchCode className="w-4 h-4 text-forest-light" />
                <span className="text-xs text-muted-foreground">Tìm kiếm</span>
              </div>
              <p className="text-lg font-bold text-forest-dark">{analyticsData.overview.totalSearches}</p>
            </div>
            <div className="bg-mint-light rounded-xl p-4 border border-mint-dark/20">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-forest-light" />
                <span className="text-xs text-muted-foreground">Xem SP hôm nay</span>
              </div>
              <p className="text-lg font-bold text-forest-dark">{analyticsData.overview.todayProductViews}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Table */}
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-forest-light" />
                  Sản phẩm xem nhiều nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.topProducts.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead className="text-right">Lượt xem</TableHead>
                          <TableHead className="text-right w-20">Xu hướng</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData.topProducts.slice(0, 10).map((product, idx) => {
                          const isTrendingUp = idx < 3
                          return (
                            <TableRow key={product.productId}>
                              <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-forest-dark max-w-[180px] truncate">{product.productName}</TableCell>
                              <TableCell className="text-right font-semibold">{product.views}</TableCell>
                              <TableCell className="text-right">
                                {isTrendingUp ? (
                                  <ArrowUp className="w-4 h-4 text-forest inline" />
                                ) : (
                                  <ArrowDown className="w-4 h-4 text-gray-400 inline" />
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu xem sản phẩm</p>
                )}
              </CardContent>
            </Card>

            {/* Search Terms Table */}
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <SearchCode className="w-4 h-4 text-forest-light" />
                  Từ khóa tìm kiếm
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.searchTerms.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Từ khóa</TableHead>
                          <TableHead className="text-right">Số lần tìm</TableHead>
                          <TableHead className="text-right w-20">Kết quả</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData.searchTerms.slice(0, 10).map((term, idx) => (
                          <TableRow key={term.query}>
                            <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-forest-dark">{term.query}</TableCell>
                            <TableCell className="text-right font-semibold">{term.count}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{term.resultsCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu tìm kiếm</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-light" />
                Hoạt động gần đây
              </CardTitle>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder="Lọc theo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thời gian</SelectItem>
                    <SelectItem value="today">Hôm nay</SelectItem>
                    <SelectItem value="month">Tháng này</SelectItem>
                    <SelectItem value="year">Năm nay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedActivities.length > 0 ? (
                <>
                  <div className="space-y-1 min-h-[400px]">
                    {paginatedActivities.map((activity, idx) => {
                      const timeAgo = getTimeAgo(activity.time)
                      const icon = activity.type === 'pageview' ? (
                        <Eye className="w-4 h-4 text-blue-500" />
                      ) : activity.type === 'productview' ? (
                        <Package className="w-4 h-4 text-forest" />
                      ) : (
                        <SearchCode className="w-4 h-4 text-amber-500" />
                      )
                      return (
                        <div
                          key={`${activity.type}-${idx}-${activity.time}`}
                          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-mint-light/50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="flex-shrink-0">{icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-forest-dark truncate">{activity.detail}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(activity.time).toLocaleString('vi-VN')}</p>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">{timeAgo}</span>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Pagination UI */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground">
                        Hiển thị {((activityPage - 1) * itemsPerPage) + 1} - {Math.min(activityPage * itemsPerPage, filteredActivities.length)} trong số {filteredActivities.length} hoạt động
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={activityPage === 1}
                          onClick={() => setActivityPage(prev => prev - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center px-3 text-xs font-medium">
                          Trang {activityPage} / {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={activityPage === totalPages}
                          onClick={() => setActivityPage(prev => prev + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-muted-foreground">Không tìm thấy hoạt động nào trong khoảng thời gian này</p>
                  {activityFilter !== 'all' && (
                    <Button variant="link" size="sm" onClick={() => setActivityFilter('all')} className="mt-2 text-forest">
                      Xem tất cả hoạt động
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!analyticsLoading && !analyticsData && (
        <div className="text-center py-16">
          <ChartSpline className="w-16 h-16 text-forest/10 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Chưa có dữ liệu thống kê</p>
          <p className="text-sm text-muted-foreground mt-1">Dữ liệu sẽ được thu thập khi khách hàng truy cập trang chủ</p>
        </div>
      )}
    </div>
  )
}

export default AnalyticsTab
