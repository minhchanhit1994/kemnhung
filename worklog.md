---
Task ID: 1
Agent: main
Task: Add Đơn hàng (Orders) tab, video upload for products, and reserved stock display

Work Log:
- Added `video_url` column to `products` table via Supabase Management API
- Updated `src/lib/types.ts` - added `videoUrl: string | null` to Product interface
- Updated `src/app/api/upload/route.ts` - added video support (MP4/WebM/MOV, 50MB limit, skip sharp for videos)
- Created `src/app/api/orders/route.ts` - GET all orders with items, POST create order
- Created `src/app/api/orders/[id]/route.ts` - GET/PUT/DELETE single order
- Rewrote `src/components/admin-panel.tsx` with 4 tabs:
  1. Tổng Quan - Dashboard with financial charts (doanh thu, vốn, lời/lỗ)
  2. Nguyên liệu - Raw materials management with import history and source tracking
  3. Thành phẩm - Products with video upload (30s max), bill-of-materials cost calculator, reserved stock display
  4. Đơn hàng - Order management with customer info, product selection, status flow (pending → completed/cancelled)
- Restored `src/app/page.tsx` with hydration-safe auth flow to render AdminPanel
- Reserved stock: computed from pending orders, displayed as `available (reserved)` in product list
- Video: client-side 30s duration check before upload, video preview in product dialog

Stage Summary:
- 4-tab admin panel fully functional: Tổng Quan, Nguyên liệu, Thành phẩm, Đơn hàng
- Order lifecycle: Create → Chờ xác nhận hoàn thành → Hoàn thành / Hủy
- Reserved stock automatically calculated from pending orders
- Video upload with 30-second client-side validation
- All lint checks pass with zero errors

---
Task ID: 2
Agent: main
Task: Build Custom Product Tracking System (Analytics)

Work Log:
- Verified and confirmed all existing analytics infrastructure was already in place:
  - `src/lib/analytics.ts` - Helper library with readAnalytics, writeAnalytics, getDailyStats, getProductRanking, getSearchTerms, buildStatsResponse
  - `src/app/api/analytics/pageview/route.ts` - POST endpoint for page view tracking
  - `src/app/api/analytics/product-view/route.ts` - POST endpoint for product view tracking
  - `src/app/api/analytics/search/route.ts` - POST endpoint for search query tracking
  - `src/app/api/analytics/stats/route.ts` - GET endpoint with `force-dynamic` for comprehensive stats
  - `data/analytics.json` - File-based JSON storage with initial empty structure
  - `src/components/shop-homepage.tsx` - Already has page view, product view, and debounced search tracking
  - `src/components/admin-panel.tsx` - Already has analytics interfaces, state management, fetch logic, and full TabsContent UI
- Fixed missing `getTimeAgo` helper function in admin-panel.tsx (was referenced but not defined)
- Moved analytics TabTrigger to correct position: after "Tổng quan", before "Nguyên liệu"
- Removed duplicate analytics TabTrigger that was between "Hao hụt" and "Cài đặt"
- Updated chart bar colors to match spec: pageViews `#A7DFC1`, productViews `#1A6B4F`
- All lint checks pass with zero errors

Stage Summary:
- Complete analytics system with file-based JSON storage (no database dependency)
- Shop homepage tracks: page views, product views (with deduplication), debounced search queries
- Admin panel "Thống kê" tab with:
  - 4 overview cards (total visits, today visits, top product, product views)
  - Period selector (7/30/90 days)
  - Daily traffic bar chart (Recharts)
  - Visitor stats grid
  - Top products table (rank, name, views, trend indicator)
  - Search terms table (rank, keyword, count, results)
  - Recent activity feed with icons and time-ago formatting
- Analytics data auto-loads when admin switches to the Thống kê tab
