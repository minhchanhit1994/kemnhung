# Mộc Đậu Studio - Thông tin dự án

## 📌 Tổng quan
Dự án quản lý cửa hàng Mộc Đậu Studio, bao gồm quản lý kho (nguyên liệu, thành phẩm), đơn hàng và thống kê kinh doanh. Dự án được phát triển bằng Next.js và tích hợp với hệ sinh thái Z-AI.

## 🛠 Công nghệ sử dụng (Tech Stack)
- **Framework:** Next.js 16 (React 19)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Database:** Prisma (PostgreSQL/Supabase & SQLite fallback)
- **State Management:** Zustand, TanStack Query (React Query)
- **Authentication:** NextAuth.js
- **Analytics:** Custom file-based & Supabase integration
- **Khác:** Framer Motion (hiệu ứng), Recharts (biểu đồ), Lucide React (icon)

## 📁 Cấu trúc thư mục chính
- `src/app`: Chứa các route và API (Next.js App Router)
- `src/components`: Các thành phần giao diện (Admin Panel, Shop Homepage, UI components)
- `src/lib`: Thư viện tiện ích, cấu hình database, analytics
- `prisma`: Schema và migrations cho database
- `data`: Lưu trữ dữ liệu fallback (JSON) và database SQLite local
- `.zscripts`: Các script hỗ trợ build và deploy từ Z-AI

## 📝 Nhật ký công việc gần đây (Recent Worklog)
- **Task 1:** Thêm tab Đơn hàng, hỗ trợ upload video sản phẩm, hiển thị tồn kho giữ chỗ.
- **Task 2:** Xây dựng hệ thống theo dõi sản phẩm và thống kê (Analytics).
- **Task 3:** Di chuyển hệ thống thống kê sang Supabase với giao diện tự động cài đặt.
- **Task 4:** Tích hợp công cụ đóng dấu ảnh (Watermark Studio) vào menu Công cụ của Admin Panel.

## 🔗 Kết nối GitHub
- **Repository:** `https://github.com/minhchanhit1994/kemnhung.git`
- **Trạng thái kết nối:** Đã kiểm tra (git fetch thành công).
- **Cấu hình:** Remote `origin` đã được thiết lập với token truy cập.

---
*File này được tạo tự động để lưu trữ trạng thái hiện tại của dự án.*
