# Software Requirements Specification (SRS)

## 1. Introduction
This document defines the software requirements for the ChemiCrown CDMS.

## 2. User Classes (Roles)
- **Super Admin & Owner:** Full system access.
- **Manager:** Inventory, supplier, HR, and order management.
- **Sales & Marketing:** Customer interaction, quotation generation, pipeline management.
- **Inventory Manager:** Stock control and low inventory alerts.
- **Customer:** Browsing products, placing inquiries/orders via cart and wishlist.

## 3. Functional Requirements
### 3.1 Authentication & Authorization
- Users must authenticate via Email/Password.
- System must enforce Role-Based Access Control (RBAC) on API routes via JWT and Express middleware.
- Frontend must dynamically render sidebar links and protected routes based on the user's role.

### 3.2 Inventory Management
- Managers can add, update, and soft-delete products.
- System must track `safetyNotes`, `storageInstructions`, and `datasheetUrl`.
- Inventory transactions must be logged automatically for auditability.
- Alerts trigger automatically when stock dips below safe thresholds.

### 3.3 Sales & Order Management
- Customers can submit public inquiries or place direct authenticated orders via cart.
- Sales team can convert quotations to orders, verify UPI payments, and advance the order state.
- Orders must track status history (Requested -> Pending -> Processing -> Packaged -> Dispatched -> Delivered).

### 3.4 Human Resources & Task Management
- HR features allow tracking employee attendance, leaves, and overtime.
- System dynamically generates monthly payslips based on base salary, incentives, and attendance deductions.
- Assign and track internal tasks with deadlines among company staff.

## 4. Non-Functional Requirements
- **Security:** Input validation via Zod, Helmet for CSP headers, Rate limiting, custom JWT verification.
- **Performance:** Vite + React SPA for highly responsive UI transitions and local caching.
- **Auditability:** `createdBy`, `updatedBy` fields on key tables, and an internal Recycle Bin for restoring soft-deleted records.
- **Real-time:** Socket.io integration for instant live chat support and cross-user notifications.
