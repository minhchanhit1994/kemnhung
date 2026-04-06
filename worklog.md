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
