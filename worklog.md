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
