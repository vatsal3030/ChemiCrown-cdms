# Software Requirements Specification (SRS)

## 1. Introduction
This Software Requirements Specification (SRS) outlines the functional, non-functional, security, and interface requirements for the **ChemiCrown CDMS**. It provides a comprehensive specification of features built and optimized during the development lifecycle.

---

## 2. User Roles & Permission Boundaries (RBAC)
The system supports a hierarchical, multi-role access structure. The roles are defined as follows:

| Role | Permitted Actions & Boundaries |
| :--- | :--- |
| **Super Admin / Owner** | Full system visibility; delete inventory; override financial ledgers; configure platform settings; approve/reject customer registrations; verify payroll disbursements. |
| **Manager** | CRUD on products, categories, and batches; manage employee profiles and wages; update attendance; calculate and disburse payroll (cannot disburse their own salary). |
| **Inventory Manager** | Access to inventory screens; log stock intakes; create batch lots; view safety checklists (MSDS/SDS). |
| **Sales & Marketing** | Review customer inquiries; create custom price quotations; verify customer payments (UPI UTRs); advance order pipeline states. |
| **Employee (Self-Service)** | View personal attendance calendar; download monthly payslips. Can activate "Customer Mode" to place internal orders. |
| **Customer** | Browse chemical catalog; self-register; manage shopping carts and wishlists; checkout via UPI/Razorpay; download tax invoices. |

---

## 3. Functional Requirements

### 3.1 Authentication & Multi-Account Session Management
* **Multi-Account Switcher**: The frontend must support caching multiple logged-in accounts simultaneously. Switcher options in the sidebar allow switching profiles instantly.
* **Storage Sync**: Active JWT session tokens are tracked in `localStorage` (`chemicrown_active_token`). Cross-tab storage listeners sync login, switcher, and logout actions across all open browser tabs in real-time.
* **Redirection Override**: When a user selects "Add Account" from the switcher, the URL is appended with `?add-account=true` to bypass automatic dashboard redirects, enabling authentication screens (`/login`, `/register`) to load for new credentials.

### 3.2 Inventory & Chemical Batch Tracking
* **Lot & Batch Management**: System tracks supplier details, intake dates, packaging parameters, and GHS hazard class ratings for each chemical lot.
* **Automatic Stock Deduction**: Product stock counts must dynamically decrement upon order dispatch (`DISPATCHED` status) and log an `OUT` transaction in the audit trail.
* **Safety compliance sheets**: Inventory records must support links to Safety Data Sheets (SDS) and generate print-ready GHS labels and Certificate of Analysis (CoA) documents.

### 3.3 B2B Orders & Financial Ledgers
* **Idempotency Safeguard**: Order requests must utilize unique idempotency keys on checkout to prevent duplicate charges or double database creations.
* **Direct UPI QR Generator**: The checkout flow generates a dynamic UPI payment QR with UTR number tracking, facilitating zero-commission transactions.
* **Double-Entry Ledgers**: Financial entries (`CREDIT` or `DEBIT`) are automatically posted to the `FinanceLedger` when:
  1. An order status shifts to `DELIVERED`.
  2. Employee payroll is disbursed.
  3. Operational expenses are manually logged.

### 3.4 HRMS, Attendance, and Positive Payroll
* **Attendance joining restriction**: The system blocks recording or editing attendance for dates prior to an employee's official joining date. Cells preceding this date appear grayed-out and disabled.
* **Positive Payroll Calculation**: Monthly payroll must be calculated via positive accumulation:
  $$\text{Salary} = \left(\frac{\text{Base Salary}}{N} \times (\text{Days Present} + \text{Paid Leaves} + \text{Holidays} + (\text{Sundays} \times 1.5))\right) + \text{Overtime Pay} + \text{Incentives} - \text{PF} - \text{TDS} - \text{Absent Penalties}$$
  *(where $N$ is the total working days of the month).*
* **CTC & Base Salary Integrity Check**: The system validates that annual CTC is greater than or equal to 12 times the monthly Base Salary (`CTC >= Base Salary * 12`). PF contribution rates must be bounded between `0%` and `30%`.
* **Disbursal Statements**: Completed payroll slips generate a printable salary disbursement slip featuring the company letterhead.

---

## 4. Non-Functional & Security Requirements
* **Input Sanitization & Validation**: Backend controllers enforce input schema structures using Zod.
* **Security Headers**: Express backend implements `helmet()` middleware to prevent clickjacking, MIME sniffing, and cross-site scripting (XSS).
* **Reverse Proxy Trust**: The application sets `trust proxy = 1` to correctly parse client IPs from `X-Forwarded-For` headers behind the Render load balancer, ensuring correct rate-limiting.
* **Universal Custom Modals**: Blocking native dialogues (`alert`, `confirm`, `prompt`) are replaced with custom promise-based cards (`DialogProvider`) to maintain branding and prevent blocking UI threads.
* **Real-time Synchronization**: Websocket endpoints (Socket.io) handle real-time chat messages and system alerts.
* **Vercel Web Analytics**: Frontend tracks performance metrics and user actions using `@vercel/analytics`.
