# Project Charter: ChemiCrown CDMS

## 1. Project Information
- **Project Name:** ChemiCrown Distribution Management System (CDMS)
- **Client:** ChemiCrown (Bhavnagar, Gujarat)
- **Sector:** Industrial Chemical Wholesale & Distribution
- **Project Type:** B2B eCommerce & Enterprise Resource Planning (ERP) Platform
- **Duration:** 6 Weeks
- **Core Engineering Team:** 3 Software Engineering Interns

## 2. Business Case & Executive Summary
ChemiCrown is a leading regional distributor of industrial solvents, thinners, and chemical solutions (GP Thinner, Mineral Turpentine Oil, Toluene, Acetone, etc.). Historically, their processes—including inventory ledger tracking, client safety sheet distribution, client orders, credit ledger management, employee attendance records, and monthly payroll calculations—were managed using disconnected spreadsheets and manual files.

The **ChemiCrown CDMS** project was commissioned to digitalize these operations into a single secure, role-based, real-time web application. The platform provides:
1. A public-facing B2B storefront for browsing catalog items, handling client inquiries, and placing orders.
2. A unified internal dashboard for order routing, automated financial double-entry bookkeeping, and real-time inventory safety compliance logs.
3. An advanced Human Resources Management System (HRMS) handling attendance tracking and payroll processing based on a positive work-accumulation algorithm.

---

## 3. Project Objectives
- **Centralized Catalog:** Maintain a single source of truth for products, specifications, packaging, storage safety guidelines, and SDS datasheets.
- **Client Portal:** Enable B2B clients to self-register, manage active carts/wishlists, check out via Razorpay or zero-fee UPI QR codes, track order status transitions, and download invoices and delivery challans.
- **Operations & Logistics Dashboard:** Equip staff to manage supplier inventory intakes, assign physical lots/batches, advance order statuses, track stock logs, and process refunds.
- **Automated HR & Payroll:** Modernize payroll with positive daily attendance accumulation, automatic PF and TDS deductions, overtime, and incentive calculations.
- **Enterprise-Grade Security:** Enforce strict Multi-Role Role-Based Access Control (RBAC) across multiple company roles (Super Admin, Owner, Manager, Sales, Marketing, Inventory Manager, Employee, and Customer).

---

## 4. Scope of Implementation

### In-Scope (Successfully Delivered)
- **Public & Auth Screens:** Home, About, Product Catalog, Contact page, registration with image uploads, login with persistent switcher, and OTP-based password recovery.
- **Multi-Account Sidebar Switcher:** Seamless user profile switcher supporting simultaneous active sessions stored locally.
- **Interactive UI Physics Engine:** Wobbly flask-shaped mouse cursor (ChemiCursor) with kinetic recoil, neon visual glows, particle spray, and pop animations for background bubbles.
- **Custom dialog modals (`DialogProvider`):** Custom promise-based replacement for system alerts, prompts, and confirmations.
- **Product & Inventory Engine:** Full CRUD for categories and products, lot management, low-stock notifications, and automatic stock deductions upon delivery/dispatch.
- **Checkout & Payment Integrations:** Integrated Razorpay SDK and custom UPI QR generation with UTR verification.
- **Double-Entry Ledger Bookkeeping:** Automated bookkeeping in `FinanceLedger` for sales revenue, payroll expenditures, and custom operational expense logs.
- **Complete HR & Payroll Modules:** Dynamic calendar attendance inputs, positive payroll calculation routines, profile wage parameters validation, and printable disbursement receipts.
- **WebSocket Services:** Live real-time chat dashboard and notifications.
- **Data Safety:** Soft deletes, audit logs, and an administrative Recycle Bin.

### Out-of-Scope (Future Phases)
- Integrated barcode/QR scanning hardware for warehouse dispatch checks.
- Direct GPS-based fleet dispatch tracking API integration.
- Mobile native application wrappers (iOS & Android).

---

## 5. Team Roles & Responsibilities
- **Intern 1 (Project Lead & System Architect):** Database modeling, JWT Auth Context, real-time Socket.io connections, email notifications service, transaction logic, and deployment.
- **Intern 2 (Frontend Developer):** Public pages, product catalog visual layouts, shopping cart, wishlist, and interactive UI animations.
- **Intern 3 (Fullstack Developer):** HRMS management dashboards, attendance calendar logic, payroll disbursal routing, financial ledger integrations, and PDF invoice printing.
