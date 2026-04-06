---
## Task ID: 2-a - backend-rewrite-supabase
### Work Task
Rewrite the entire backend of the Next.js project at `/home/z/kemnhung-repo` to use Supabase instead of Prisma (SQLite). The project is deployed on Vercel where local file system DB doesn't work. All 11 API route files, the Supabase client lib, the types, and a new case-converter utility were created/modified.

### Work Summary

#### Problem
The project used Prisma with SQLite (`file:../db/custom.db`) which doesn't work on Vercel's serverless environment (no local file system). All API routes imported from `@/lib/db` (Prisma client) and were broken on deployment.

#### Solution
Complete migration from Prisma/SQLite to Supabase (PostgreSQL). All Supabase tables already existed with snake_case column names, but the frontend expected camelCase responses.

#### Files Modified

1. **`.env.local`** (created) - Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with provided credentials.

2. **`src/lib/supabase.ts`** (rewritten) - Removed dependency on `SUPABASE_SERVICE_ROLE_KEY` and `supabaseAdmin` export. Now exports a single `supabase` client using only the anon key.

3. **`src/lib/convert.ts`** (created) - New utility with two functions:
   - `toCamelCase<T>(obj)` - Recursively converts snake_case object keys to camelCase (for Supabase responses → frontend)
   - `toSnakeCase<T>(obj)` - Recursively converts camelCase object keys to snake_case (for frontend requests → Supabase inserts/updates)
   - Both handle nested objects and arrays.

4. **`src/lib/types.ts`** (updated) - Changed all interface properties from snake_case to camelCase to match frontend expectations (e.g., `import_price` → `importPrice`, `stock_quantity` → `stockQuantity`, `order_items` → `orderItems`). The Prisma schema used camelCase model fields, so frontend was already coded for camelCase.

5. **`src/app/api/auth/login/route.ts`** (rewritten) - Uses `supabase.from('admin').select().eq('username', ...)` instead of `db.admin.findUnique()`. SHA256 password hashing preserved.

6. **`src/app/api/auth/seed/route.ts`** (rewritten) - Uses Supabase insert with conflict handling (race condition safe). Also seeds default `shop_info` row.

7. **`src/app/api/auth/check/route.ts`** (rewritten) - Uses `supabase.from('admin').select('*', { count: 'exact', head: true })` for admin count check.

8. **`src/app/api/auth/change-password/route.ts`** (rewritten) - Uses Supabase select + update for password change.

9. **`src/app/api/shop-info/route.ts`** (rewritten) - GET fetches first row or creates default. PUT uses partial field updates (only sends fields present in request body to avoid wiping data).

10. **`src/app/api/products/route.ts`** (rewritten) - GET with `ilike` for search, `eq` for active filter. POST converts camelCase body to snake_case for insert.

11. **`src/app/api/products/[id]/route.ts`** (rewritten) - GET/PUT/DELETE using Supabase `.eq('id', id)` pattern.

12. **`src/app/api/orders/route.ts`** (rewritten) - GET fetches orders then batch-fetches all `order_items` using `.in('order_id', orderIds)` for efficiency. POST creates order then inserts items in batch, with stock decrement fallback (RPC → manual fetch+update).

13. **`src/app/api/orders/[id]/route.ts`** (rewritten) - GET fetches single order with items. PUT uses partial field updates. DELETE removes order items first (fallback in case no cascade), then order.

14. **`src/app/api/dashboard/route.ts`** (rewritten) - Replaces Prisma's aggregated queries with multiple Supabase count/select queries: total products, active products, total/pending/completed orders, total revenue sum, low stock products (filtered query), out-of-stock count, recent orders with items.

15. **`src/app/api/upload/route.ts`** (rewritten) - Uploads to Supabase Storage bucket `product-images` instead of local filesystem. Uses `supabase.storage.from('product-images').upload()`. Falls back to original image if sharp is unavailable. Graceful error if bucket doesn't exist.

#### Key Design Decisions
- **Partial updates for PUT**: PUT handlers only update fields present in the request body (using `!== undefined` checks), preventing data loss when frontend sends partial updates (e.g., `updateOrderStatus` sends only `{ status }`).
- **Batch item fetching**: Orders list endpoint fetches all items in a single query using `.in('order_id', ids)` instead of N+1 queries.
- **Stock decrement fallback**: Order creation tries Supabase RPC for atomic decrement, falls back to manual fetch-and-update.
- **No frontend changes**: All API response shapes match exactly what frontend components expect (camelCase keys, same structure).

#### Verification
- ESLint passes with zero errors.
- No remaining Prisma/`@/lib/db` imports in any source file (only `src/lib/db.ts` remains as unused file).

---
## Task ID: 3 - backend-api-routes
### Work Task
Create all new backend API routes for a handmade products business that separates raw materials from finished products. 8 new route files created + 1 updated (dashboard).

### Work Summary

#### Files Created

1. **`src/app/api/raw-materials/route.ts`** - GET lists all raw materials with optional `?search=` filter, includes suppliers via `material_suppliers` join (batch fetches supplier names). POST creates raw material with auto-set `currentStock=0`.

2. **`src/app/api/raw-materials/[id]/route.ts`** - GET single material with suppliers (full supplier details). PUT with partial field updates. DELETE (cascade handles related records).

3. **`src/app/api/suppliers/route.ts`** - GET lists all suppliers ordered by created_at desc. POST creates supplier.

4. **`src/app/api/suppliers/[id]/route.ts`** - GET/PUT/DELETE single supplier. PUT uses partial field updates.

5. **`src/app/api/material-transactions/route.ts`** - GET with optional `?material_id=` and `?type=` filters, includes material name and supplier name via batch joins. POST creates transaction and **updates raw_materials.current_stock**: ADD for import, SUBTRACT for export/adjustment (with validation that stock won't go negative). Updates `updated_at` on the material.

6. **`src/app/api/product-materials/route.ts`** - GET with optional `?product_id=` filter, includes material details. POST creates product-material mapping. DELETE by query param `?id=xxx`.

7. **`src/app/api/production-orders/route.ts`** - GET with optional `?status=` filter, includes product name. POST with **critical production logic**: validates product has a recipe, checks all materials have sufficient stock (`current_stock >= recipe.quantity * production.quantity`), returns 400 with details of insufficient materials if any, otherwise: subtracts materials from stock, adds to `products.stock_quantity`, creates production_order with status='completed'.

8. **`src/app/api/production-orders/[id]/route.ts`** - GET single order with product details. PUT updates status and/or notes.

#### Files Modified

9. **`src/app/api/dashboard/route.ts`** - Added 5 new stats to existing dashboard endpoint:
   - `totalRawMaterials`: count of raw_materials
   - `lowStockMaterials`: raw_materials where `current_stock <= min_stock AND min_stock > 0`
   - `totalSuppliers`: count of suppliers
   - `totalProductionOrders`: count of production_orders
   - `recentProductionOrders`: last 5 production orders with product name included

#### Key Design Patterns
- All routes follow the exact same patterns as existing routes: `supabase` import, `toCamelCase`/`toSnakeCase` for case conversion, `try/catch` error handling
- Partial updates for PUT handlers using spread operator with `!== undefined` checks
- Batch fetching for related data (suppliers, materials, products) to avoid N+1 queries
- Vietnamese error messages where business logic is involved (e.g., insufficient stock warnings)
- All Supabase column names use snake_case, all API responses use camelCase

#### Verification
- ESLint passes with zero errors.
- Dev server compiles successfully with no route errors.

---
## Task ID: 4 - frontend-admin-panel-restructure
### Work Task
Restructure the admin panel (`src/components/admin-panel.tsx`) to add 4 new tabs (Nguyên liệu, Nhà cung cấp, Quản lý kho, Sản xuất), modify the Products tab to use costPrice instead of importPrice/supplier and add recipe management, and update the Dashboard with new stats. Keep all existing functionality (orders, settings, login) intact.

### Work Summary

#### Changes Made to `src/components/admin-panel.tsx` (complete rewrite from ~1009 lines to ~1300 lines)

**Imports Updated:**
- Added new Lucide icons: `FlaskConical`, `Truck`, `Warehouse`, `Hammer`, `Minus`, `PackagePlus`
- Added new type imports: `RawMaterial`, `Supplier`, `MaterialTransaction`, `ProductMaterial`, `ProductionOrder`

**New State Variables:**
- `rawMaterials`, `suppliers`, `materialTransactions`, `productionOrders`, `productMaterials` - data from new API endpoints
- `materialSearch`, `supplierSearch` - search filters for new tabs
- `materialDialogOpen`/`materialForm`/`editingMaterial` - Material CRUD dialog state
- `supplierDialogOpen`/`supplierForm`/`editingSupplier` - Supplier CRUD dialog state
- `importDialogOpen`/`importForm` - Inventory import dialog state
- `productionDialogOpen`/`productionForm` - Production order dialog state
- `recipeMaterials`/`newRecipeMaterial` - Recipe management within product form

**`fetchAll` Updated:**
- Now fetches from 8 endpoints in parallel: products, orders, shop-info, dashboard, raw-materials, suppliers, material-transactions, production-orders

**New Helper Functions:**
- `productionStatusColors`/`productionStatusLabels` - badge styling for production order statuses
- `transactionTypeLabels`/`transactionTypeColors` - badge styling for material transaction types
- `materialUnits` - predefined unit options ('cái', 'kg', 'm', 'l', 'cuộn', 'tấm', 'bộ', 'hộp')
- `lowStockMaterials`/`outOfStockMaterials` - computed arrays for filtering
- `checkProductionStock` - validates if enough materials exist for production quantity
- `addRecipeMaterial`/`removeRecipeMaterial` - recipe management helpers

**Tabs Added (after Products, before Orders):**
1. **Nguyên liệu (Materials)** - Full CRUD table with: name, unit, current_stock (color-coded badge: green/amber/red), min_stock, status badge, supplier info column, search, add/edit/delete dialogs
2. **Nhà cung cấp (Suppliers)** - Full CRUD table with: name, phone, address, notes, search, add/edit/delete dialogs
3. **Quản lý kho (Inventory)** - Two sections (raw materials + finished products stock), low stock alerts at top, "Nhập kho" button with import dialog, recent transactions list with type badges
4. **Sản xuất (Production)** - "Tạo phiếu sản xuất" button with dialog that checks material stock before confirming, table with product name/quantity/status/notes, status management buttons (complete/cancel)

**Products Tab Modified:**
- Removed "Giá nhập" and "Nhà cung cấp" columns from the table
- Added "Giá vốn" (cost price) column instead
- Product form dialog: removed importPrice/supplier fields, added costPrice field
- Added "Công thức" (recipe) section in product form: shows existing materials with quantities, allows adding new materials via dropdown, allows removing materials, fetches existing recipe when editing

**Dashboard Tab Updated:**
- Added new stat cards row: "Nguyên liệu" (total + out of stock count), "Nhà cung cấp" (total), "Phiếu SX" (total + pending count), "NL sắp hết" (low stock count)
- Added "Nguyên liệu sắp hết" section with color-coded badges
- Added "Sản xuất gần đây" section showing recent production orders

**New Dialogs Added:**
1. Material Form Dialog - name, unit (select), minStock, description
2. Supplier Form Dialog - name, phone, address, notes
3. Inventory Import Dialog - material select (shows current stock), quantity, unit price, supplier select, notes
4. Production Order Dialog - product select (shows stock), quantity, recipe stock check with sufficiency warnings, notes

**Order Detail Dialog Fixed:**
- Changed `selectedOrder.items` to `selectedOrder.orderItems` to match the type interface

**Tab Triggers Responsive:**
- Tab labels hidden on small screens with `hidden sm:inline`, only icons shown on mobile

#### Verification
- ESLint passes with zero errors.
- Dev server compiles successfully with no errors.
- All existing functionality (orders, settings, login) preserved intact.
- Vietnamese language used for all labels and UI text.
- Emerald/green color scheme maintained throughout.
- Mobile responsive with `overflow-x-auto` for all tables.

---
## Task ID: 2 - backend-api-routes-rewrite
### Work Task
Rewrite all backend API route files and types to match the new business model: Vietnamese handmade products shop with raw materials → production → finished products workflow. Remove Order/OrderItem/Supplier/MaterialSupplier interfaces and orders API routes. Add unit_price tracking with weighted average calculation, auto costPrice from recipe, and totalCost on production orders.

### Work Summary

#### Files Rewritten (9 files)

1. **`src/lib/types.ts`** - Complete rewrite:
   - `RawMaterial`: added `unitPrice` field (average unit price), removed `suppliers` relation
   - `MaterialTransaction`: changed `material` join to `{ name: string; unit: string }` (lightweight), removed `supplier` join
   - `ProductMaterial`: kept same structure
   - `Product`: removed `importPrice` and `supplier` fields, `productMaterials` now typed as `ProductMaterial[]` (recipe)
   - `ProductionOrder`: added `totalCost` field, `product` join changed to `{ id: string; name: string }` (lightweight)
   - `ShopInfo`: kept as-is
   - **Removed entirely**: `Order`, `OrderItem`, `Supplier`, `MaterialSupplier` interfaces

2. **`src/app/api/raw-materials/route.ts`** - Simplified:
   - GET: list with optional `?search=` filter, no longer fetches suppliers
   - POST: create with `{name, unit, description, minStock}`, auto-sets `currentStock=0, unitPrice=0`, uses `crypto.randomUUID()`

3. **`src/app/api/raw-materials/[id]/route.ts`** - Simplified:
   - GET: single material without supplier data
   - PUT: partial field updates including `unitPrice`
   - DELETE: cascade handles related records

4. **`src/app/api/material-transactions/route.ts`** - Major business logic rewrite:
   - GET: list with optional `?material_id=` filter, includes `material: { name, unit }` join (no more supplier/type filters)
   - POST (import only): **Critical weighted average unit price logic**:
     1. Calculate `importUnitPrice = totalPrice / quantity`
     2. Fetch current `currentStock` and `unitPrice` from raw_materials
     3. Calculate `newAvgUnitPrice = ((oldStock × oldUnitPrice) + totalPrice) / (oldStock + quantity)`
     4. Update raw_materials: `currentStock += quantity`, `unitPrice = newAvgUnitPrice`
     5. Create transaction with `type='import'`

5. **`src/app/api/products/route.ts`** - Recipe management added:
   - GET: list with optional `?active=1` and `?search=` filters, includes full recipe (`product_materials` with material details)
   - POST: create product, if body includes `materials: [{materialId, quantity}]` array:
     - Insert `product_materials` entries
     - Calculate `costPrice = Σ(material.quantity × material.unitPrice)`
     - Update product's `cost_price`

6. **`src/app/api/products/[id]/route.ts`** - Recipe management added:
   - GET: product with full recipe (material name, unit, unitPrice)
   - PUT: if body has `materials` array → delete all existing `product_materials`, insert new ones, recalculate `costPrice`
   - DELETE: cascade handles recipe cleanup

7. **`src/app/api/product-materials/route.ts`** - Cost calculation added:
   - GET (`?product_id=xxx`): returns `{ materials: [...], totalCost: number }` - calculates total cost from recipe
   - POST: add material to recipe, then **recalculate product costPrice** via helper function
   - DELETE (`?id=xxx`): delete entry, then **recalculate product costPrice** via helper function
   - Helper `recalculateProductCost()`: fetches all recipe materials, calculates `Σ(quantity × unitPrice)`, updates product

8. **`src/app/api/production-orders/route.ts`** - Total cost calculation added:
   - GET: list with optional `?status=` filter, includes `product: { id, name }` (lightweight)
   - POST: **Critical production logic**:
     1. Get product recipe with material details (name, currentStock, unitPrice)
     2. Check each material: `currentStock >= recipe.quantity × production.quantity`
     3. If insufficient: return 400 with Vietnamese error `"Nguyên liệu {name} không đủ. Cần {needed}, hiện có {available}"`
     4. If sufficient: deduct stock, calculate `totalCost = Σ(recipe.quantity × unitPrice × production.quantity)`, add to product stock, create order with `status='completed'`

9. **`src/app/api/production-orders/[id]/route.ts`** - Simplified:
   - GET: single order with `product: { id, name }` (not full product)
   - PUT: partial status/notes updates

10. **`src/app/api/dashboard/route.ts`** - Completely rewritten for new business model:
    - Returns: `{ totalMaterials, lowStockMaterials, totalProducts, totalProductStock, totalProductionOrders, recentProductionOrders }`
    - Removed all order-related stats (totalOrders, pendingOrders, completedOrders, totalRevenue, recentOrders, lowStockProducts, outOfStockProducts, activeProducts, totalSuppliers)
    - `totalProductStock`: sum of all products' stock_quantity

#### Files Deleted
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/route.ts`

#### Files NOT Modified (kept as-is per requirements)
- `src/app/api/shop-info/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/seed/route.ts`
- `src/app/api/auth/check/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/upload/route.ts`

#### Key Business Logic
- **Weighted average unit price**: When importing materials, the unit price is recalculated as a weighted average based on existing stock and new purchase
- **Auto cost calculation**: Product cost is always auto-calculated from recipe materials × their unit prices
- **Production stock validation**: Before production, checks all material stock levels and returns specific Vietnamese error messages for insufficient materials
- **`is_active` as INTEGER**: All code treats `is_active` as 0/1 integer, not boolean

#### Verification
- ESLint passes with zero errors.
- Dev server compiles successfully.
- `crypto.randomUUID()` used for all ID generation.

---
## Task ID: 2 - types-dashboard-update
### Work Task
Update `src/lib/types.ts` and `src/app/api/dashboard/route.ts` to match the simplified 3-tab admin workflow (Tổng quan, Nguyên liệu, Sản phẩm & Sản xuất). Types must match exact DB columns. Dashboard must return stats relevant to the simplified workflow with order data for storefront integration.

### Work Summary

#### Files Modified

1. **`src/lib/types.ts`** - Updated all interfaces to match actual database columns:
   - `RawMaterial`: added `totalCost: number` field (maps to `total_cost` column). `unitPrice` was already present.
   - `Product`: added `unit: string` field (maps to `unit` column). Also restored `importPrice: number` and `supplier: string` fields that exist in DB (`import_price`, `supplier` columns) but were previously removed by Task ID 2.
   - `MaterialTransaction`: `totalPrice` was already present. No changes needed.
   - `ProductionOrder`: `totalCost` was already present. No changes needed.
   - `Order`: **Re-added** (was previously removed by Task ID 2). Maps to `orders` table with `orderItems?: OrderItem[]` joined field. Needed for storefront functionality.
   - `OrderItem`: **Re-added** (was previously removed by Task ID 2). Maps to `order_items` table with camelCase fields: `orderId`, `productId`, `productName`, `unitPrice`.
   - `ShopInfo`: Kept as-is, already matches DB.
   - `ProductMaterial`: Kept as-is, already matches DB.
   - `Supplier` and `MaterialSupplier`: Not re-added (already removed by prior task, not part of simplified workflow — suppliers are just text fields on material imports).

2. **`src/app/api/dashboard/route.ts`** - Completely rewritten to return stats for the 3-tab workflow:
   - `totalRawMaterials`: count of raw_materials (renamed from `totalMaterials` to match frontend `DashboardStats` interface)
   - `totalProducts`: count of all products
   - `activeProducts`: count of products where `is_active = 1`
   - `lowStockMaterials`: array of `{id, name, currentStock, minStock, unit}` where `current_stock <= min_stock AND min_stock > 0`
   - `outOfStockProducts`: count of active products where `stock_quantity <= 0`
   - `totalProductionOrders`: count of production_orders
   - `recentProductionOrders`: last 5 production orders with `product: {id, name}` join
   - `totalRevenue`: sum of `total_amount` from completed orders
   - `recentOrders`: last 5 orders with batch-fetched `orderItems`

   Removed fields: `totalProductStock`, `totalSuppliers`, `totalOrders`, `pendingOrders`, `completedOrders`, `lowStockProducts`.

   Key patterns: uses `.eq('is_active', 1)` for integer boolean, batch-fetches order items with `.in('order_id', ids)`, all responses in camelCase via `toCamelCase`.

#### Key Design Decisions
- **Matched exact DB columns**: Every TypeScript field maps 1:1 to a database column (camelCase ↔ snake_case via convert utility)
- **Restored Order/OrderItem**: Previous agent removed these but they're needed for storefront; orders table still exists in DB
- **Restored importPrice/supplier on Product**: These DB columns exist and may be used by storefront or future features
- **Dashboard key rename**: `totalMaterials` → `totalRawMaterials` to match existing frontend `DashboardStats` interface
- **No frontend files modified**: All changes are backend-only (types + API route)

#### Verification
- ESLint passes with zero errors.
- Dev server compiles successfully with no route errors.
- All 7 interfaces in types.ts cover all 8 DB tables (orders, order_items, products, raw_materials, material_transactions, product_materials, production_orders, shop_info).

---
## Task ID: 3 - admin-panel-rewrite
### Work Task
Completely rewrite `src/components/admin-panel.tsx` for a simplified 3-tab workflow matching the exact handmade products business flow: Tổng quan (Dashboard), Nguyên liệu (Raw Materials Management), and Sản phẩm & Sản xuất (Products & Production).

### Work Summary

#### Problem
The existing `src/components/admin-panel.tsx` was 1551 lines with 4 tabs, a broken `MaterialTx` type reference, and didn't match the user's actual workflow. It needed a complete rewrite to a clean 3-tab structure.

#### File Modified

**`src/components/admin-panel.tsx`** - Complete rewrite (~830 lines, down from ~1551):

**3-Tab Structure:**

1. **Tab 1: Tổng quan (Dashboard)**
   - 5 stat cards: Nguyên liệu, Thành phẩm (with active count), Phiếu SX, Doanh thu (totalRevenue from completed orders), NL sắp hết
   - Low stock materials alert card with color-coded badges (red for out of stock, amber for low)
   - Two-column grid: "SX gần đây" (last 5 production orders) and "Đơn hàng gần đây" (last 5 orders)
   - Order status badges with appropriate colors (completed=green, pending=yellow, cancelled=red)

2. **Tab 2: Nguyên liệu (Raw Materials Management)**
   - **Section A: Danh sách nguyên liệu** - Table with: Tên, Đơn vị, Tồn kho (green/amber/red badges), Đơn giá, Tổng vốn, Thao tác (edit/delete). Search input and "Thêm NL" button.
   - **Section B: Nhập kho & Lịch sử** - "Nhập kho" button opens dialog: select material (shows current stock), quantity, totalPrice, notes. POST to `/api/material-transactions` with auto-calculated unit price preview. Transaction history table with columns: Ngày, Nguyên liệu, Loại (import=green/export=red/adjustment=blue badges), SL, Đơn giá, Tổng tiền, Ghi chú.

3. **Tab 3: Sản phẩm & Sản xuất (Products & Production)**
   - **Section A: Danh sách thành phẩm** - Table with: Ảnh, Tên, Giá vốn, Giá bán, Tồn kho, Trạng thái (Đang bán/Ẩn), Thao tác. "Thêm SP" button opens dialog with:
     - Basic info: Tên, Đơn vị (select: cái/chiếc/bộ/hộp), Mô tả, Giá bán, Đang bán (checkbox)
     - Image upload via FormData POST to `/api/upload`
     - **CÔNG THỨC section**: Shows existing recipe materials with name, qty × unit price = cost per line. "Thêm NL vào công thức" with material select + quantity input. Delete individual recipe lines. **TỔNG GIÁ VỐN** displayed prominently in emerald bold.
     - Recipe loads from `/api/product-materials?product_id=xxx` when editing, synced via DELETE + POST on save
   - **Section B: Sản xuất** - "Sản xuất" button opens dialog: select product, enter quantity. Auto-shows recipe materials with stock check (green text if sufficient, red text if not). Warning if product has no recipe. POST to `/api/production-orders`. Production history table: Ngày, Sản phẩm, SL, Giá vốn SX, Trạng thái, Ghi chú.

**Key Fixes from Previous Version:**
- Removed broken `MaterialTx` type reference → uses proper `MaterialTransaction` from `@/lib/types`
- Removed unused `Gift` import, added required icons (`Package`, `ArrowDownToLine`, `History`, `Calculator`, `Shield`)
- Removed unused state variables (`productSearch`, `recipeOpen`, `importMode`, `newMaterialName`, `newMaterialUnit`)
- Simplified import dialog (removed "create new material" mode — just select existing)
- Production stock check uses `product.productMaterials` from products API (already fetched with recipe data) instead of separate product-materials fetch
- All error handling with `alert()` for user-facing errors + `try/catch` with console.error for logging

**DashboardStats Interface:**
Updated to match actual API response: added `totalRevenue: number` and `recentOrders: Order[]` fields.

**Props Interface:** Kept identical — `AdminPanelProps { onBack, onLogout, username, onChangePassword }`.

**Design:**
- Emerald/green color scheme with `data-[state=active]:bg-emerald-100` on tab triggers
- Vietnamese text throughout
- Mobile responsive: tab labels hidden on small screens, `overflow-x-auto` on all tables, `max-h-96 overflow-y-auto` on long tables
- Sticky header with Shield icon + admin badge
- shadcn/ui components only (Card, Table, Dialog, Select, Badge, Checkbox, Tabs, Skeleton)
- Lucide icons: BarChart3, FlaskConical, Package, Plus, Pencil, Trash2, Upload, ImageIcon, Save, ArrowLeft, LogOut, KeyRound, Shield, Search, AlertTriangle, Hammer, ArrowDownToLine, Calculator

#### Verification
- ESLint passes with zero errors.
- Dev server compiles successfully with no route errors.
- All 200 status codes on GET / requests.
- `fetchAll` fetches 5 endpoints in parallel: raw-materials, material-transactions, products, production-orders, dashboard.
