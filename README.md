# 👑 ChemiCrown CDMS (Chemical Distribution Management System)

![ChemiCrown Banner](chemicrown.png)

## 📖 Overview
**ChemiCrown CDMS** is a full-fledged, enterprise-grade ERP/B2B eCommerce platform tailored for chemical distribution. Built from the ground up to solve complex supply chain, HR, finance, and customer-management workflows, it provides an intuitive, high-performance web interface to manage end-to-end business operations.

From **inventory tracking** to **HR payroll processing**, from **B2B customer orders** to **multi-role RBAC authorization**, ChemiCrown acts as the central nervous system for modern chemical enterprises.

---

## 🚀 Key Features

### 1. 👥 Multi-Role RBAC System
- **Super Admin & Owner**: Full platform visibility, financial overrides, user management, and refund handling.
- **Managers & Sales**: Process orders, configure payroll, view real-time inventory, and track sales performance.
- **HR & Operations**: Manage employee records, track attendance, approve leaves, and generate dynamic payroll slips.
- **Customers**: B2B customer portal with unified cart, wishlist, order history, invoice downloads, and Razorpay/UPI/COD payment support.

### 2. 🛒 B2B Order & Inventory Management
- Centralized Product Catalog with complex variants, chemical specifications, and data sheets.
- Automated stock deduction on payment success.
- End-to-end order tracking (Requested ➔ Pending ➔ Processing ➔ Dispatched ➔ Delivered).
- Advanced order state transitions with idempotency to prevent double charges.

### 3. 💳 Payments & Finance
- Full Razorpay integration for fast, secure checkouts.
- Direct UPI integration with UTR tracking for zero-fee transactions.
- Automated ledger entry generation for sales, expenses, and payroll.
- Refund lifecycle tracking (including cancellation fees and API refunds).

### 4. 👔 Complete HRMS
- **Attendance**: Real-time tracking (Present/Absent/Half-Day/Leave) dynamically syncing with payroll.
- **Payroll**: Automated calculation of base pay, overtime, incentives, absent deductions, PF, and TDS.
- **Employee Portal**: Dedicated "Customer Mode" for internal staff ordering, along with employee self-service to view attendance and download payslips.

---

## 🛠️ Tech Stack

### Frontend (Client Application)
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS + Lucide Icons
- **State Management & Data Fetching**: Context API, React Query (for complex data)
- **UI Components**: Recharts (Analytics), Framer Motion (Animations), react-hot-toast (Notifications)
- **Build Tool**: Vite

### Backend (API & Business Logic)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Database**: PostgreSQL (hosted on Supabase)
- **Authentication**: JSON Web Tokens (JWT) + Bcrypt
- **Security**: Helmet, CORS, Express Rate Limit
- **Payment Gateway**: Razorpay SDK

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Supabase)
- Razorpay Sandbox Account

### 1. Clone the repository
```bash
git clone https://github.com/vatsal3030/ChemiCrown-cdms.git
cd ChemiCrown-cdms
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/chemicrown"
DIRECT_URL="postgresql://user:password@localhost:5432/chemicrown"

# JWT Auth
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Run database migrations and seed the database:
```bash
npx prisma db push
node src/seeds/runAllSeeds.js
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxx
```

Start the frontend development server:
```bash
npm run dev
```

---

## 🏗️ Architecture & Concepts

1. **Monolithic API with Contextual Routes**: The Express API serves distinct routing namespaces (`/api/auth`, `/api/hr`, `/api/orders`, `/api/finance`) ensuring separation of concerns.
2. **Tab-Isolated Shopping Cart**: Built entirely on `sessionStorage`, ensuring different accounts can securely log in across different browser tabs without data collision.
3. **Idempotency**: Critical checkout and payment endpoints employ idempotency keys to completely eliminate race conditions and ghost deductions.
4. **Soft Deletes**: Entities like Employees, Products, and Users use `deletedAt` timestamps to ensure historical referential integrity (e.g., viewing past orders for a deleted product).
5. **Real-Time Synchronisation**: Global states like 'Customer Mode' and 'Authentication' utilize cross-tab synchronization through `window.addEventListener('storage')`.

---

## 📝 License
This project is proprietary and confidential.

Developed specifically for **ChemiCrown**. All rights reserved.
