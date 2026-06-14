# ChemiCrown CDMS — Full Bug Report

**Report Date:** 12 June 2026
**Analyzed By:** AI Code Auditor
**Project:** ChemiCrown CDMS (Chemical Distribution Management System)
**Stack:** React (Vite) + Express.js + Prisma + PostgreSQL + Razorpay

---

## Summary

After a complete analysis of the frontend and backend codebases, **25 bugs** were identified across 4 severity levels:

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 **Critical** | 5 | Data loss, security vulnerabilities, payment issues |
| 🟠 **High** | 8 | Crashes, broken features, incorrect data |
| 🟡 **Medium** | 7 | Logic errors, UX issues, missing features |
| 🟢 **Low** | 5 | Code quality, inconsistencies, minor UX gaps |

---

## 🔴 Critical Bugs

### BUG-001: Abandoned Orders Deduct Inventory Permanently

> [!CAUTION]
> **Inventory is permanently deducted even when payment is never completed. This causes phantom stock loss.**

- **Files:**
  - [orders.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/orders.controller.js#L48-L110) — `createOrder()`
- **Root Cause:** The `createOrder` function deducts inventory inside a Prisma `$transaction` (lines 66-73) and creates the database order (lines 91-107) **before** the Razorpay payment is initiated (lines 113-119). If the user opens the Razorpay checkout modal and closes it without paying, or if the Razorpay API call fails after the DB transaction commits, the inventory is already gone and the order sits in `REQUESTED` status forever.
- **Impact:** Every abandoned checkout permanently reduces stock. Over time, product availability becomes inaccurate. Admin sees ghost orders they cannot fulfill.
- **Recommended Fix:**
  1. **Do NOT deduct inventory** in `createOrder`. Instead, only create a Razorpay order and return it.
  2. Move inventory deduction into `verifyPayment` — only reduce stock after Razorpay confirms `SUCCESS`.
  3. Or: introduce a `PAYMENT_PENDING` status and a cron job that auto-cancels unpaid orders after 30 minutes, restoring inventory.

---

### BUG-002: Payment Amount Hardcoded to Zero

> [!CAUTION]
> **Successful payments are recorded with `amount: 0`, breaking all revenue analytics.**

- **File:** [orders.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/orders.controller.js#L145-L154) — `verifyPayment()`
- **Root Cause:** At line 151, the payment amount is hardcoded: `amount: 0` with a comment `// In real app, fetch from order total`. This was never fixed.
- **Impact:** The `analytics.controller.js` calculates total revenue by aggregating `payment.amount` (line 6-9). Since all payments have `amount: 0`, the dashboard **always shows ₹0 revenue** regardless of actual sales.
- **Recommended Fix:**
  ```js
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  // Then use: amount: order.total
  ```

---

### BUG-003: Invalid Order Status "PAID" — Enum Mismatch

> [!CAUTION]
> **Setting order status to `'PAID'` will crash because the Prisma `OrderStatus` enum does not contain `PAID`.**

- **File:** [orders.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/orders.controller.js#L157-L160) — `verifyPayment()`
- **Schema:** [schema.prisma](file:///d:/Internship%20project/ChemiCrown-cdms/backend/prisma/schema.prisma#L236-L244)
- **Root Cause:** After payment verification, the code sets `status: 'PAID'` (line 159). But the `OrderStatus` enum only has: `REQUESTED`, `PENDING`, `PROCESSING`, `PACKAGED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`. The value `PAID` does not exist.
- **Impact:** Prisma will throw a validation error, meaning **payment verification always fails** even with a valid Razorpay signature. The order never gets updated.
- **Recommended Fix:** Use `status: 'PENDING'` or `status: 'PROCESSING'`, or add `PAID` to the OrderStatus enum in the Prisma schema and run a migration.

---

### BUG-004: Security — JWT Tokens Stored in Plain Text in localStorage

> [!WARNING]
> **All account tokens (including for multi-account switching) are stored as plain objects in localStorage, making them vulnerable to XSS theft.**

- **File:** [AuthContext.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/context/AuthContext.jsx#L54-L63)
- **Root Cause:** The `login()` function stores the full user object **including the JWT token** into `chemicrown_accounts` in localStorage (line 60). Any XSS vulnerability allows an attacker to extract ALL stored account tokens.
- **Impact:** A single XSS attack compromises every account that has ever logged in from that browser, including admin accounts.
- **Recommended Fix:**
  1. Move tokens to `httpOnly` cookies set by the backend.
  2. If localStorage is required, store only a session reference, not raw tokens.
  3. At minimum, add token expiry validation before using stored tokens.

---

### BUG-005: Security — Hardcoded Fallback JWT Secret

> [!WARNING]
> **The JWT secret defaults to a predictable fallback string, allowing token forgery in production if `JWT_SECRET` env var is not set.**

- **Files:**
  - [auth.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/auth.controller.js#L7) — `const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development'`
  - [auth.middleware.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/middlewares/auth.middleware.js#L4) — Same fallback
- **Impact:** If deployed without `JWT_SECRET` set, anyone can forge valid JWT tokens granting `SUPER_ADMIN` access.
- **Recommended Fix:** Remove the fallback entirely. Throw a startup error if `JWT_SECRET` is not defined:
  ```js
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is required');
  ```

---

## 🟠 High Severity Bugs

### BUG-006: HR Attendance Query Uses `startsWith` on DateTime Field

- **File:** [hr.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/hr.controller.js#L29-L34)
- **Root Cause:** The attendance query uses `date: { startsWith: new Date().toISOString().substring(0, 7) }`. The `date` field in the schema is `DateTime`, not `String`. The `startsWith` operator is a **string-only** filter — it does not work on `DateTime` columns in Prisma/PostgreSQL.
- **Impact:** This query likely fails silently or returns no results, which explains why the **payroll section shows incorrect employee data** and attendance is always empty.
- **Recommended Fix:**
  ```js
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  // Then: date: { gte: startOfMonth, lte: endOfMonth }
  ```

---

### BUG-007: Payroll Only Shows Employees WITH Employee Profiles

- **File:** [hr.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/hr.controller.js#L21-L43) — `getEmployees()`
- **Root Cause:** The query fetches all `User` records where `role != CUSTOMER`, but the payroll tab in the frontend reads data from `emp.employeeProfile?.baseSalary`. If an employee's `User` record exists but no matching `Employee` record was created, they show up in the directory but with **no payroll data** (everything shows ₹0.00).
- **Additionally:** If 3 of 10 employees don't have `Employee` records, the frontend shows them but they functionally have no payroll, attendance, or salary — which is the reported issue of "only 7 employees showing in payroll".
- **Recommended Fix:** Either:
  1. Auto-create `Employee` records when adding employees via the `addEmployee` function (already done), or
  2. Filter the payroll tab to only show users with `employeeProfile !== null`, or
  3. Add a migration script to backfill missing Employee records for all non-CUSTOMER users.

---

### BUG-008: `handlePaySalary` References Undefined `mutate` Function

- **File:** [HRManagement.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/admin/HRManagement.jsx#L100-L120)
- **Root Cause:** At line 113, after paying salary, the code calls `mutate(...)` which is an SWR function — but this component uses `useState` + `fetch`, not SWR. `mutate` is **undefined** and will throw a `ReferenceError`, crashing the component.
- **Impact:** Paying any employee's salary will crash the HR Management page.
- **Recommended Fix:** Replace `mutate(...)` with `fetchEmployees()`:
  ```js
  // Line 113: Replace
  mutate(`${import.meta.env.VITE_API_URL}/api/hr`);
  // With:
  fetchEmployees();
  ```

---

### BUG-009: `updateSalary` Filters Attendance with String `startsWith` on DateTime

- **File:** [hr.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/hr.controller.js#L94)
- **Root Cause:** Line 94: `employee.attendance.filter(a => a.date.startsWith(targetMonth))`. The `a.date` is a JavaScript `Date` object (returned by Prisma), not a string. Calling `.startsWith()` on a Date object throws `TypeError: a.date.startsWith is not a function`.
- **Impact:** Every salary payment attempt crashes with a 500 error.
- **Recommended Fix:**
  ```js
  const monthAttendance = employee.attendance.filter(a =>
    a.date.toISOString().substring(0, 7) === targetMonth
  );
  ```

---

### BUG-010: Orders Route Blocks OWNER and MANAGER Access

- **File:** [orders.routes.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/routes/orders.routes.js#L12)
- **Root Cause:** The route-level RBAC middleware only allows `['CUSTOMER', 'SALES', 'SUPER_ADMIN']`. But the frontend routes in [App.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/App.jsx#L126) allow `OWNER`, `MANAGER`, and `MARKETING` to access orders. These roles will get **403 Forbidden** from the backend.
- **Impact:** Owners and Managers see the Orders page in the sidebar but get empty results or errors when they navigate to it.
- **Recommended Fix:** Update the backend route middleware:
  ```js
  router.use(requireRole(['CUSTOMER', 'SALES', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'MARKETING']));
  ```

---

### BUG-011: Duplicate PrismaClient Instances Cause Connection Exhaustion

- **Files:**
  - [config/prisma.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/config/prisma.js) — Singleton instance
  - [hr.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/hr.controller.js#L1-L2) — `new PrismaClient()` ❌
  - [favorites.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/favorites.controller.js#L1-L2) — `new PrismaClient()` ❌
  - [review.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/review.controller.js#L1-L2) — `new PrismaClient()` ❌
  - [category.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/category.controller.js#L1-L2) — `new PrismaClient()` ❌
- **Root Cause:** A shared singleton Prisma client exists in `config/prisma.js`, but 4 controllers create their OWN `new PrismaClient()` instances. Each instance opens a separate database connection pool.
- **Impact:** Connection pool exhaustion under load. Potential for "Too many connections" PostgreSQL errors in production.
- **Recommended Fix:** In all 4 files, replace:
  ```js
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  ```
  with:
  ```js
  const prisma = require('../config/prisma');
  ```

---

### BUG-012: Customer Delete Button Sends Non-existent DELETE API Endpoint

- **File:** [Orders.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/customer/Orders.jsx#L49-L63)
- **Root Cause:** The `handleDelete` function sends a `DELETE` request to `/api/orders/:id`, but no such route exists in [orders.routes.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/routes/orders.routes.js). The only available routes are `POST /:id/cancel` for cancellation. The DELETE method will return **404 Route Not Found**.
- **Impact:** The delete button on every order row silently fails.
- **Recommended Fix:** Either add a soft-delete endpoint to the backend, or change the frontend to use the cancel endpoint.

---

### BUG-013: Idempotency Key Based on In-Memory Map — Lost on Restart

- **File:** [orders.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/orders.controller.js#L10-L22)
- **Root Cause:** The duplicate order prevention uses an in-memory `Map()` (line 10) with a 5-second TTL. This is lost on every server restart and is not shared across multiple server instances.
- **Impact:** In a multi-instance deployment (e.g., load balancer), duplicate orders can be created. The 5-second window is also too short — a slow network could cause the same user to retry after 5 seconds and create a duplicate.
- **Recommended Fix:** Use a database-level uniqueness constraint or Redis for idempotency tracking with a longer TTL (e.g., 60 seconds).

---

## 🟡 Medium Severity Bugs

### BUG-014: Dashboard Revenue Trend Shows Wrong Month Labels for Cross-Year Data

- **File:** [analytics.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/analytics.controller.js#L59-L75)
- **Root Cause:** The revenue map uses month names (e.g., "Jan") as keys without the year. If a 6-month window spans December→May, "Dec" could collide with December of the current year vs. last year.
- **Impact:** Revenue data could be attributed to the wrong month bucket.
- **Recommended Fix:** Use "YYYY-MM" as keys and format to display names.

---

### BUG-015: Attendance Dashboard Data is Always Hardcoded Zeros

- **File:** [analytics.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/analytics.controller.js#L93-L98)
- **Root Cause:** The attendance data is hardcoded as:
  ```js
  const attendanceData = [
    { name: 'Present', value: 0 },
    { name: 'Absent', value: 0 },
    { name: 'On Leave', value: 0 },
  ];
  ```
- **Impact:** The dashboard Attendance Pie Chart is always empty/zero. The data never comes from the actual database.
- **Recommended Fix:** Query today's attendance records from the database and aggregate by status.

---

### BUG-016: HR Management "Active Today" Stat is Fabricated

- **File:** [HRManagement.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/admin/HRManagement.jsx#L190)
- **Root Cause:** Line 190: `{Math.floor(employees.length * 0.9)}` — this just shows 90% of total employees as "Active Today", regardless of actual attendance.
- **Impact:** Misleading HR dashboard metric. Admins may believe attendance is tracked when it isn't being displayed correctly.
- **Recommended Fix:** Calculate from actual today's attendance records instead of a static multiplier.

---

### BUG-017: No Cart Icon in Public Navbar for Logged-In Customers

- **File:** [PublicLayout.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/layouts/PublicLayout.jsx#L20-L25)
- **Root Cause:** The public navbar only shows: Home, About Us, Catalog, Contact. There is no cart link or icon for customers who are browsing the public catalog.
- **Impact:** Customers who add items to cart from the public catalog page (`/catalog`) have no way to quickly access their cart without going through the dashboard.
- **Recommended Fix:** Add a cart icon with badge count to the public navbar, visible only when the user has items in their cart.

---

### BUG-018: "New Customers This Week" Metric is Same as Total Verified Customers

- **File:** [analytics.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/analytics.controller.js#L32-L38)
- **Root Cause:** The `newCustomersThisWeek` query has the same filters as `verifiedCustomers` — there is no date filter for "this week". The comment says `// Mocking 'this week' logic`.
- **Impact:** The dashboard shows the same number for "Total Customers" and "New This Week", which is misleading.
- **Recommended Fix:** Add a `createdAt: { gte: startOfWeek }` filter.

---

### BUG-019: Checkout Page `handlePayment` Never Opens Razorpay Modal

- **File:** [Checkout.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/customer/Checkout.jsx#L60-L121)
- **Root Cause:** The `handlePayment()` function calls the backend `/api/orders` endpoint which returns a `razorpayOrder` object (line 124 of orders.controller.js). But the frontend **never opens the Razorpay checkout modal** with this order. It directly calls `clearCart()` and navigates to orders on a successful `res.ok`, treating the order creation itself as payment success.
- **Impact:** Orders are placed as `REQUESTED` and payment never actually happens. The `verifyPayment` endpoint is never called. This is the root cause of BUG-001 as well — orders appear as "pending" without any payment.
- **Recommended Fix:** After receiving the `razorpayOrder`, open the Razorpay checkout modal:
  ```js
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: data.razorpayOrder.amount,
    order_id: data.razorpayOrder.id,
    handler: async (response) => {
      await fetch('/api/orders/verify', { body: JSON.stringify({ ...response, orderId: data.orderId }) });
      clearCart();
      navigate('/dashboard/orders');
    }
  };
  new Razorpay(options).open();
  ```

---

### BUG-020: Race Condition — Cart Items Use Stale Inventory Data

- **File:** [CartContext.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/context/CartContext.jsx#L26-L46)
- **Root Cause:** When adding to cart, the inventory check (line 33) uses `product.inventory?.quantity` from the product data fetched at page load time. If another user buys that product before the current user checks out, the cart will show "in stock" but the backend will reject with "Insufficient stock".
- **Impact:** False availability promises to customers, leading to checkout failures.
- **Recommended Fix:** Re-validate inventory on the server side at checkout time (already done in the backend, so this is a UX concern — show a clearer error when server rejects).

---

## 🟢 Low Severity Bugs

### BUG-021: Login Error Handling Swallows Stack Trace

- **File:** [auth.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/auth.controller.js#L142-L144)
- **Root Cause:** The login function catches all errors with `res.status(500).json({ error: 'Login failed' })` instead of calling `next(error)`. This bypasses the centralized error handler and logs nothing.
- **Impact:** Database errors during login are invisible in logs.
- **Recommended Fix:** Replace with `next(error)`.

---

### BUG-022: OTP Not Hashed Before Storage

- **File:** [auth.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/auth.controller.js#L232-L238)
- **Root Cause:** The 6-digit OTP is stored in plaintext in the database (`resetPasswordOtp`). If the database is compromised, all active OTPs are exposed.
- **Impact:** Low risk unless database is breached, but still a security best practice violation.
- **Recommended Fix:** Hash the OTP before storing. Compare hashed values during verification.

---

### BUG-023: Razorpay Signature Verification Uses Fallback Secret

- **File:** [orders.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/orders.controller.js#L137)
- **Root Cause:** The signature verification uses `process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'`. If the env var is missing, the signature verification will use the wrong secret and ALWAYS fail (or worse, be predictable).
- **Impact:** Payment verification may silently fail in production.

---

### BUG-024: `Attendance.date` Type Mismatch Between Schema and Usage

- **File:** [schema.prisma](file:///d:/Internship%20project/ChemiCrown-cdms/backend/prisma/schema.prisma#L287) — `date DateTime @default(now())`
- **Root Cause:** The schema defines `date` as `DateTime`, but multiple code paths treat it as a string (using `startsWith`, `toISOString()` comparisons). This creates fragile, error-prone code throughout the attendance and payroll system.
- **Recommended Fix:** Standardize: either change the field to `String` if you want `YYYY-MM-DD` format, or keep `DateTime` and use proper date range queries everywhere.

---

### BUG-025: Duplicate `@@index` on Product Model

- **File:** [schema.prisma](file:///d:/Internship%20project/ChemiCrown-cdms/backend/prisma/schema.prisma#L124-L137)
- **Root Cause:** Two indexes reference `categoryId`:
  - Line 124: `@@index([categoryId])`
  - Line 137: `@@index([categoryId, isActive])`
  The single-column index is redundant since the composite index already covers `categoryId`-only lookups.
- **Impact:** Slightly increased write overhead and storage. Not a runtime bug.
- **Recommended Fix:** Remove the standalone `@@index([categoryId])`.

---

## Bug Map by File

| File | Bug IDs |
|------|---------|
| [orders.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/orders.controller.js) | BUG-001, BUG-002, BUG-003, BUG-013, BUG-023 |
| [hr.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/hr.controller.js) | BUG-006, BUG-007, BUG-009, BUG-011 |
| [analytics.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/analytics.controller.js) | BUG-014, BUG-015, BUG-018 |
| [auth.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/auth.controller.js) | BUG-005, BUG-021, BUG-022 |
| [favorites.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/favorites.controller.js) | BUG-011 |
| [review.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/review.controller.js) | BUG-011 |
| [category.controller.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/controllers/category.controller.js) | BUG-011 |
| [orders.routes.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/routes/orders.routes.js) | BUG-010 |
| [auth.middleware.js](file:///d:/Internship%20project/ChemiCrown-cdms/backend/src/middlewares/auth.middleware.js) | BUG-005 |
| [schema.prisma](file:///d:/Internship%20project/ChemiCrown-cdms/backend/prisma/schema.prisma) | BUG-024, BUG-025 |
| [HRManagement.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/admin/HRManagement.jsx) | BUG-008, BUG-016 |
| [Checkout.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/customer/Checkout.jsx) | BUG-019 |
| [Orders.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/pages/customer/Orders.jsx) | BUG-012 |
| [AuthContext.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/context/AuthContext.jsx) | BUG-004 |
| [CartContext.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/context/CartContext.jsx) | BUG-020 |
| [PublicLayout.jsx](file:///d:/Internship%20project/ChemiCrown-cdms/frontend/src/layouts/PublicLayout.jsx) | BUG-017 |

---

## Recommended Fix Priority

> [!IMPORTANT]
> Fix these in order. The Critical bugs are actively causing data corruption and security vulnerabilities.

1. **BUG-003** — Fix the `PAID` enum mismatch (breaks all payments)
2. **BUG-002** — Fix payment amount being ₹0 (breaks revenue)
3. **BUG-019** — Implement Razorpay checkout modal on frontend
4. **BUG-001** — Restructure order flow to not deduct inventory before payment
5. **BUG-005** — Remove fallback JWT secret
6. **BUG-009** — Fix `startsWith` on Date object crash in salary
7. **BUG-006** — Fix attendance DateTime query
8. **BUG-008** — Fix undefined `mutate` crash in HR page
9. **BUG-010** — Fix orders RBAC to include Owner/Manager
10. **BUG-011** — Fix duplicate PrismaClient instances
11. **BUG-012** — Fix non-existent delete endpoint for orders
12. Everything else in order of severity

---

*End of Report*
