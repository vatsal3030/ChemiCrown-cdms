# Software Requirements Specification (SRS)

## 1. Introduction
This document defines the software requirements for the ChemiCrown CDMS.

## 2. User Classes (Roles)
- **Super Admin:** Full system access.
- **Manager:** Inventory, supplier, and order management.
- **Sales:** Customer interaction, quotation generation.
- **Customer:** Browsing products, placing inquiries/orders.

## 3. Functional Requirements
### 3.1 Authentication & Authorization
- Users must authenticate via Email/Password.
- System must enforce RBAC on API routes and UI views.

### 3.2 Inventory Management
- Managers can add, update, and soft-delete products.
- System must track `safetyNotes`, `storageInstructions`, and `datasheetUrl`.
- Inventory transactions must be logged automatically.

### 3.3 Sales & Order Management
- Customers can submit public inquiries or authenticated quotation requests.
- Sales team can convert quotations to orders.
- Orders must track status history (Pending -> Processing -> Dispatched -> Delivered).

## 4. Non-Functional Requirements
- **Security:** Input validation via Zod, CSP headers, RLS in database.
- **Performance:** Next.js Server Components for fast public page loads.
- **Auditability:** `createdBy`, `updatedBy` fields on key tables.
