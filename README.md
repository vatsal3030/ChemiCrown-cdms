# 👑 ChemiCrown CDMS (Chemical Distribution Management System)

![ChemiCrown Banner](chemicrown.png)

## 📖 Overview
**ChemiCrown CDMS** is an enterprise-grade ERP, Supply Chain, and B2B eCommerce platform designed specifically for the chemical distribution industry. Tailored to solve complex logistics, safety compliance, multi-role operations, human resource payroll, and real-time business workflows, it acts as the centralized system for managing a chemical wholesale enterprise.

Built with a high-performance **React + Vite** single-page application frontend and a robust **Express.js + Node.js** REST API backend integrated with **Prisma ORM** and **PostgreSQL (Supabase)**, ChemiCrown CDMS delivers a premium user experience coupled with secure, scalable, and audit-compliant business logic.

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client [Frontend SPA - React + Vite]
        UI[Tailwind CSS + shadcn/ui]
        State[React Context / SWR Client]
        Sockets[Socket.io Client - Real-Time Chat & Alerts]
        Cursor[Interactive ChemiCursor Physics Engine]
    end

    subgraph Server [Backend REST API - Node.js + Express]
        Router[Express Routers]
        Middleware[RBAC Authorization & Input Validation]
        Controller[Controllers & Service Layer]
        Prisma[Prisma Client ORM]
    end

    subgraph Database [Database & Storage - Supabase]
        Postgres[(PostgreSQL DB)]
        Storage[Supabase Object Storage]
    end

    subgraph Integrations [Third-Party Services]
        Email[Resend Custom Domain Mailer]
        Payment[Razorpay API Gateway]
        Analytics[Vercel Web Analytics]
    end

    UI -->|Router & Contexts| State
    State <-->|HTTP API Calls| Router
    Sockets <-->|Websocket Handshake / JWT| Server
    Router --> Middleware
    Middleware --> Controller
    Controller <--> Prisma
    Prisma <--> Postgres
    Controller -->|Asset Uploads| Storage
    Controller -->|Transactional Emails| Email
    Controller -->|Checkout Sessions| Payment
```

---

## 🚀 Key Modules & Capabilities

### 1. 👥 Multi-Role Role-Based Access Control (RBAC)
The platform enforces strict role-based permission boundaries at both the frontend UI rendering layer and backend router middleware:
* **Super Admin & Owner**: Absolute visibility, ledger overrides, user account controls, and manual verification pipelines.
* **Manager**: Full control over inventory logs, suppliers, employee records, payroll execution, and order processing.
* **Sales / Marketing**: Handle client inquiries, generate custom quotations, verify manual payments, and coordinate delivery status.
* **Inventory Manager**: Control batches, lots, packaging types, and handle low-stock compliance thresholds.
* **Customer**: Self-service B2B portal to view pricing, create wishlists/carts, place orders, make digital payments, and download tax invoices/delivery challans.

### 2. 🛒 B2B Chemical Order & Inventory Engine
* **Dynamic Product Catalog**: Manage complex chemical items (MTO, Toluene, Acetone, etc.) with packaging details, safety datasheets (SDS/MSDS), storage guidelines, and dynamic pricing.
* **Batch & Lot Tracking**: Trace chemical batches from raw supplier supply down to customer delivery, tracking shelf life and GHS hazard class compliance.
* **Interactive Order Pipeline**: Follows orders from `REQUESTED` ➔ `PENDING` ➔ `PROCESSING` ➔ `READY` ➔ `SHIPPED` ➔ `DELIVERED`.
* **Idempotent Checkout**: Multi-step payment validation matching database records with transaction-safe checkouts to prevent race conditions or double charges.

### 3. 💳 Financial Ledger & Payment Integrations
* **Razorpay Gateway**: Integrated Razorpay API for direct credit card, debit card, and net banking checkouts.
* **Zero-Fee UPI QR Engine**: Real-time UPI QR generation with Unique Transaction Reference (UTR) tracking for instant manual verification.
* **Double-Entry Ledgers**: Automated credit/debit records generated inside `FinanceLedger` upon completed orders, employee payroll disbursals, and corporate expense inputs.

### 4. 👔 Complete HRMS & Payroll Automation
* **Attendance System**: Calendar-based attendance logging supporting Present, Absent, Half-Day, and Paid Leaves.
* **Positive Payroll System**: Dynamically calculates salary based on positive working days, overtime hours, holiday multipliers, and active incentives, factoring in PF rates, TDS deductions, and absent penalties.
* **Direct Disbursal & Slips**: Generates professional, print-ready salary disbursement statements.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 19, Vite, React Router DOM (v7)
* **Styling**: Tailwind CSS v4, Lucide Icons
* **Animations**: Framer Motion, GSAP, CSS Keyframes
* **State & Data**: Context API, SWR (State-While-Revalidate)
* **Utilities**: Recharts (Analytics), react-to-print (v3), react-hot-toast

### Backend
* **Runtime**: Node.js, Express.js
* **Database Access**: Prisma ORM
* **Database**: PostgreSQL (Supabase)
* **Real-time**: Socket.io (WebSockets)
* **Email System**: Resend Node SDK
* **Security**: Helmet, CORS, Express Rate Limit, BCrypt, JSON Web Tokens (JWT)

---

## 📈 Internship Deliverables & Contributions
During my 6-week software engineering internship, I took ownership of the platform's core architectural improvements, UI animations, financial security, and third-party integrations. Below are the **18 core deliverables** I successfully built and polished:

### 🎨 Frontend UI/UX & Interactions
1. **Multi-Account Switcher**: Developed a session switcher in the sidebar menu allowing administrators to instantly switch between active profiles (stored securely inside `localStorage`) without logging out.
2. **Interactive Flask Cursor (ChemiCursor)**: Built a custom cursor engine simulating a laboratory flask with wobbly squash-and-stretch recoil physics, hover target selectors, and interactive shake triggers.
3. **Full-Screen Shockwave Ripples**: Integrated screen-wide radial shockwave expansions whenever the flask cursor erupts, reacting dynamically to scroll positions and viewport boundaries.
4. **Click-to-Pop Background Bubbles**: Rendered floating background bubbles that accept click events to trigger CSS keyframe popping animations.
5. **Universal DialogProvider**: Replaced browser-native blocking alerts (`alert`, `confirm`, `prompt`) with a beautiful promise-based, dark-mode supported custom modal system.
6. **Unified Table Header Styling**: Standardized table headers across Orders and HR Management views for consistent font size, uppercase casing, padding, and alignments.
7. **Widescreen density optimization**: Restructured page constraints across 8 main dashboards (`CreateLotPage`, `AssignTask`, `LeaveDetails`, etc.) from restrictive widths to `max-w-[1200px]` to eliminate unused side spacing.

### ⚙️ Backend Security & Infrastructure
8. **Express Reverse Proxy Trust Setup**: Configured `app.set('trust proxy', 1)` to allow the backend to trust Render.com load balancer proxy headers. This fixed the `express-rate-limit` Validation Crash.
9. **Prisma Connection Pooling Optimization**: Resolved local database connection timeouts by routing localhost requests directly to PostgreSQL (`DIRECT_URL`) while keeping production traffic routed to the Supabase Transaction Pooler.
10. **Graceful Connection Handlers**: Configured process event listeners (`SIGINT`, `SIGTERM`, `SIGUSR2`) to cleanly close database connections, eliminating Supabase connection exhaustion.

### 👔 HRMS & Business Logic Validation
11. **Positive Payroll Accumulation**: Refactored payroll logic to calculate salary based on positive working days, overtime, holidays, and Sundays instead of negative deduction logic.
12. **Salary Ratio & PF Boundary Constraints**: Enforced CTC validation limits (`CTC >= Base Salary * 12`) and bounded PF contribution rates between `0%` and `30%` on both client forms and server routes.
13. **Before-Joining Attendance Lock**: Blocked administrators from editing employee attendance prior to their official joining dates.
14. **Custom Disbursal Receipt Printing**: Redesigned individual employee salary disbursement views to remain on-screen after payment, displaying a printable billing receipt with genuine company letterheads.

### 📧 Mailer & Third-Party Integrations
15. **Custom Domain Resend Mailer**: Switched the transaction mailer configuration from the Resend Sandbox (`onboarding@resend.dev`) to a verified corporate domain (`noreply@chemicrown.site`).
16. **Login Security Alerts**: Programmed backend auth hooks to automatically email security alerts to employee/admin accounts upon new session logins.
17. **Client Transaction Emails**: Implemented auto-generated customer emails for order confirmations, itemized shipping checklists, and shipping status updates.
18. **Vercel Web Analytics**: Integrated the Vercel Analytics SDK within the React application provider tree to track traffic, page views, and user demographics.

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/vatsal3030/ChemiCrown-cdms.git
cd ChemiCrown-cdms
```

### 2. Backend Environment Config
Navigate to the `backend/` directory and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/` with the following variables:
```env
PORT=5000
NODE_ENV=development

# Database URLs (Supabase / Local PG)
DATABASE_URL="postgresql://user:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://user:password@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# UPI Details
MERCHANT_UPI_VPA="vatsalvadgama04@oksbi"
MERCHANT_NAME="ChemiCrown CDMS"

# Cloudinary
CLOUDINARY_CLOUD_NAME=dwsi9eqkw
CLOUDINARY_API_KEY=769458461231265
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Resend Mailer Key
RESEND_API_KEY=re_MeA91mM2_xxxxxxxxxxxx
```
Apply the database migrations and seed default records:
```bash
npx prisma db push
node seed-holidays.js
```
Start the development server:
```bash
npm run dev
```

### 3. Frontend Environment Config
Navigate to the `frontend/` directory and install dependencies:
```bash
cd ../frontend
npm install
```
Create a `.env` file inside `frontend/` with:
```env
VITE_API_URL=http://localhost:5000
```
Start the local Vite client:
```bash
npm run dev
```

---

## 📄 License
This project is proprietary and confidential property of **ChemiCrown**. All rights reserved.
