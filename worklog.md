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
