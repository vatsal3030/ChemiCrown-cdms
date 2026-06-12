# Project Charter: ChemiCrown CDMS

## 1. Project Information
- **Project Name:** ChemiCrown Distribution Management System (CDMS)
- **Client:** ChemiCrown (Bhavnagar, Gujarat)
- **Duration:** 6 Weeks
- **Team Size:** 3 Interns

## 2. Executive Summary
ChemiCrown is a wholesaler and distributor of industrial chemicals. The CDMS digitizes their operations, moving them from manual tracking to a secure, role-based web platform. The system handles public product inquiries, internal inventory management, supplier tracking, advanced HR features (payroll and attendance), real-time notifications, and end-to-end customer orders with payment gateway integration.

## 3. Project Objectives
- Create a public-facing catalog for products (GP Thinner, MTO, Toluene, Acetone, etc.).
- Implement a Customer Portal for order tracking, wishlist, cart, and checkout.
- Build an Internal Dashboard for Managers to track Inventory KPIs, Orders, and Human Resources.
- Ensure strict Role-Based Access Control (RBAC) across multiple departments (Sales, Marketing, HR, Inventory, Owner).
- Integrate real-time chat, notifications, and an automated verification system.

## 4. Scope
### In-Scope (Implemented)
- Public Website (Home, About, Products, Contact).
- Custom JWT Authentication System with bcrypt.
- Inventory Management (CRUD, Transactions, Stock Alerts).
- Order Management Pipeline with UPI Payment Integration (Razorpay).
- Full HR Module (Attendance tracking, Payroll generation, Employee directory).
- Live Chat & Ticket Support System via WebSockets.
- Dashboard Analytics with Recharts.
- Audit Logging, Soft Deletes, and Recycle Bin management.

### Out-of-Scope (Future Enhancements)
- Advanced 3rd-party Logistics (3PL) Tracking API integration.
- Mobile App wrappers (React Native).

## 5. Roles & Responsibilities
- **Intern 1 (Project Lead):** Architecture, DB Schema, Auth, Real-time WebSockets, DevOps.
- **Intern 2:** Public Website, UI/UX, Product Pages, Shopping Cart, Wishlist.
- **Intern 3:** Internal Dashboard, HR Module, Order Flows, Reports & Analytics.
