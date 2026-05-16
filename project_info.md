# Mộc Đậu Studio - Thông tin dự án

## 📌 Tổng quan
Dự án quản lý cửa hàng Mộc Đậu Studio, bao gồm quản lý kho (nguyên liệu, thành phẩm), đơn hàng và thống kê kinh doanh. Dự án được phát triển bằng Next.js và tích hợp với hệ sinh thái Z-AI.

## 🛠 Công nghệ sử dụng (Tech Stack)
- **Framework:** Next.js 16 (React 19)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Database:** Prisma (PostgreSQL/Supabase & SQLite fallback)
- **State Management:** Zustand, TanStack Query (React Query)
- **Khác:** Framer Motion (hiệu ứng), Recharts (biểu đồ), Lucide React (icon)

## 📁 Cấu trúc thư mục chính
- `src/app`: Chứa các route và API (Next.js App Router)
- `src/components`: Các thành phần giao diện (Admin Panel, Shop Homepage, UI components)
- `src/lib`: Thư viện tiện ích, cấu hình database, analytics
- `prisma`: Schema và migrations cho database
- `.zscripts`: Các script hỗ trợ build và deploy từ Z-AI

## 📝 Nhật ký công việc gần đây (Recent Worklog)
- **Task 1-5:** Tích hợp Watermark Studio Pro, đồng bộ GitHub, quản lý kho & đơn hàng.
- **Task 6:** Kiểm tra hiệu năng (Stress Test) và nâng cấp giao diện chọn nguyên liệu hàng loạt (Bulk Selection).
- **Task 7:** Sửa lỗi ReferenceError do thiếu import icon và cập nhật tài liệu kinh nghiệm dự án.

## 💡 Kinh nghiệm & Lưu ý (Lessons Learned)
### 1. Quản lý UI & Icon
- **Lưu ý Import:** Khi thêm icon mới từ `lucide-react`, luôn phải kiểm tra danh sách import ở đầu file `admin-panel.tsx`. Thiếu khai báo sẽ gây lỗi trắng trang hoàn toàn (Uncaught ReferenceError).
- **Trải nghiệm người dùng:** Đối với các tác vụ chọn nguyên liệu hoặc sản phẩm trong Dialog, ưu tiên dùng chế độ **Bulk Selection** (Checklist + Input số lượng tại chỗ) thay vì chọn từng mục một để tiết kiệm thời gian cho người vận hành.

### 2. Môi trường & Hệ thống
- **Hệ điều hành:** Dự án được phát triển trên Windows. Các script trong `package.json` nếu dùng lệnh Linux (như `cp`, `rm -rf`) cần được chuyển đổi sang lệnh tương đương hoặc dùng thư viện cross-platform.
- **Database:** Sử dụng Supabase làm DB chính. Khi chạy stress test, độ trễ trung bình khoảng 200ms là bình thường do khoảng cách địa lý.
- **Git:** Luôn bật `core.autocrlf true` và `core.filemode false` để tránh việc Git báo hàng trăm file thay đổi do khác biệt hệ điều hành.

## 🔗 Kết nối GitHub
- **Repository:** `https://github.com/minhchanhit1994/kemnhung.git`
- **Trạng thái kết nối:** Đã kiểm tra & Đồng bộ thường xuyên.

---
*File này được cập nhật liên tục để đảm bảo tính ổn định của dự án.*
