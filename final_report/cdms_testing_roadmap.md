# ChemiCrown CDMS — Comprehensive Manual Testing Roadmap (Granular Click-by-Click Guide)

This document provides a highly detailed, step-by-step testing blueprint for the **ChemiCrown Chemical Distribution Management System (CDMS)**. It lists every page, button, form field, and interactive Call-To-Action (CTA), accompanied by realistic mock data and expected system responses.

---

## 🛠️ Baseline Setup

Before testing, make sure your database has been reset and seeded using the following backend scripts:

1. In the `backend` folder, run:
   ```bash
   npx prisma db push --force-reset
   npx prisma db seed
   node seed-holidays.js
   ```
2. The seed script creates the following default testing credentials:
   - **Super Admin**: `admin@chemicrown.com` / Password: `password123` (or the default set in seed.js)
   - **Seeded Products**: _Potassium Hydroxide Pellets_, _Acetone_, _MTO_, _GP Thinner_, _Red Oxide Primer_.

---

## 📂 Module 1: Public B2B Portal & Storefront

**Objective**: Verify the public marketing pages, catalog navigation, and document printing triggers.
**Access URL**: `http://localhost:5173/`

### 1.1 Header & Footer Navigation

- [x] **CTA: Logo Brand** (Top Left Header)
  - _Action_: Click the ChemiCrown logo.
  - _Expected_: Instantly returns you to the home page (`/`).
- [x] **CTA: Public Navbar Links** (Catalog, About Us, Contact)
  - _Action_: Click each link in the navbar.
  - _Expected_: Smooth route transitions without page flashes. The navbar should display loader skeletons while verifying active sessions, then show the "Login" button if unauthenticated.
- [x] **CTA: Public Footer Links** (Privacy Policy, Terms of Service)
  - _Action_: Scroll to bottom, click links.
  - _Expected_: Renders the correct policy page layouts.

### 1.2 Interactive Chemical Catalog (Public View)

- [x] **URL Path**: `/catalog`
- [x] **Search Input** (Filter Chemicals)
  - _Action_: Type `"Thinner"` into the search box.
  - _Expected_: The list should filter in real-time, showing _GP Thinner_ and _Nitrocellulose (NC) Thinner_.
- [x] **Category Filters** (Sidebar)
  - _Action_: Click on the "Solvents" category.
  - _Expected_: The catalog lists only solvent items (e.g. Toluene, Acetone).
- [x] **CTA: View Details Button**
  - _Action_: Click "View Details" on the _Acetone (Propanone)_ card.
  - _Expected_: Opens `/product/:id`. Shows CAS Number (`67-64-1`), UN Number (`1090`), GHS Hazard Class ratings (Class 3 Flammable Liquid), Safety Data Sheet (SDS) button, and base pricing details.

### 1.3 GHS & CoA Admin Print Tools (Admin/Operations Access)

- [x] **GHS Label Printing**:
  - _Access Route_: Log in as Admin (`admin@chemicrown.com`) and navigate to **[Inventory Panel](http://localhost:5173/dashboard/inventory)**.
  - _Action_: Find a hazardous chemical (e.g. _2-Propanol (EMPLURA®) 25L_) in the table, scroll to the **Actions** column, and click the golden **GHS** button.
  - _Expected_: A modal dialog displays the warning pictograms, danger text, and precaution statements.
  - _Action_: Click the blue **Print** button in the top-right corner of the modal.
  - _Expected_: Opens the native browser print layout, rendering the complete GHS sticker.
- [x] **Generate CoA (Certificate of Analysis)**:
  - _Access Route_: Log in as Admin and navigate to **[Lots & Batches Management](http://localhost:5173/dashboard/inventory/lots)**.
  - _Action_: Locate an active lot (e.g. _B-TOL-04_) in the table, scroll to the **CoA** column, and click the blue **Generate CoA** link/button.
  - _Expected_: A custom form overlay opens, pre-populating chemical parameters.
  - _Action_: Fill out the fields with mock metrics:
    - **Batch Number**: `CH-2PRP-2026`
    - **Mfg Date**: `2026-07-01`
    - **Purity**: `99.9%`
    - **Specific Gravity**: `0.785`
  - _Action_: Click **Print CoA** at the bottom of the modal.
  - _Expected_: Native print preview generates immediately, rendering a formatted Certificate of Analysis with the official ChemiCrown letterhead header.

---

## 📂 Module 2: Authentication & Switcher Workflows

**Objective**: Verify registrations, login parameters, and concurrent multi-session switching.

### 2.1 Customer Registration (Verification Lockout)

- [x] **URL Path**: `/register`
- [x] **Form Inputs**: Fill out the following mock registration details:
  - **First Name**: `Vikram`
  - **Last Name**: `Patel`
  - **Company Name**: `Patel Industries Ltd.`
  - **Phone**: `+91 98980 12345`
  - **Email**: `patel.ind@gmail.com`
  - **GST Number**: `24ABCDE1234F1Z5` (Must match valid 15-character Indian GSTIN format)
  - **Password**: `securepass123`
  - **Confirm Password**: `securepass123`
- [x] **Usability Check**: Verify that typing in any field does **not** cause the input to lose focus. You should be able to type your first name, company, and phone continuously without re-clicking.
- [x] **Validation Test (Error Case)**: Modify the GST number to `12345` (invalid format) and click "Create Account".
  - _Expected_: An inline validation error toast appears: _"Invalid GSTIN format"_.
- [x] **Successful Submission**: Correct the GST number to `24ABCDE1234F1Z5` and submit.
  - _Expected_: The registration succeeds and displays the _"Account Pending Verification"_ template.
- [x] **Login Lockout Check**: Go to `/login`. Try logging in with `patel.ind@gmail.com` / `securepass123`.
  - _Expected_: Blocks login and displays an error toast: _"Your account is pending admin verification. You will receive access once an administrator approves your account."_

### 2.2 Profile Switching Context

- [x] **Super Admin Login**: Log in as `admin@chemicrown.com` / `password123`. Verify redirection to `/dashboard`.
- [x] **CTA: "Add Account" Button**
  - _Action_: Open the profile dropdown switcher at the bottom-left sidebar. Click **Add Account**.
  - _Expected_: The app navigates to `/login?add-account=true`. You should **not** be auto-redirected back to `/dashboard` even though the Admin session is currently active.
- [x] **Switch Account Login**: Sign in with another admin credential, or try to register a new employee. Once authenticated, open the switcher again.
  - _Expected_: Both profiles are listed. Clicking either switches active tokens in `localStorage` (`chemicrown_active_token`) and reloads layouts instantly.
- [x] **Session Sync**: Open a second browser tab on `http://localhost:5173/dashboard`. In Tab 1, log out of the active account.
  - _Expected_: Tab 2 detects the storage shift and automatically redirects to the public home page, preventing active session leaks.

---

## 📂 Module 3: Customer Verification & Admin Directory

**Objective**: Approve clients and manage system users.

### 3.1 Verify Registered Customers

- [x] **URL Path**: `/dashboard/verify` (Access as Admin)
- [x] **Pending List**: Locate `Patel Industries Ltd.` in the pending list.
- [x] **CTA: Approve Button** (Checkmark Icon)
  - _Action_: Click the verify checkmark.
  - _Expected_: Custom Confirm Modal displays: _"Are you sure you want to approve this customer?"_
  - _Action_: Click **Confirm**.
  - _Expected_: Customer status changes. An email is dispatched to `patel.ind@gmail.com` confirming account approval.
- [x] **CTA: Reject/Remove Button** (Trash Icon)
  - _Action_: Register a mock account `fake.buyer@gmail.com` and click Reject.
  - _Expected_: Removes the pending listing and soft-deactivates the user record.

---

## 📂 Module 4: Product & Inventory Admin Controls

**Objective**: Test product creation, lot allocations, and automated transaction logging.

### 4.1 Create Product Form

- [x] **URL Path**: `/dashboard/inventory/product/new` (Access as Admin/Manager)
- [x] **Form Inputs**: Enter the following mock product specifications:
  - **Product Name**: `Toluene (Methylbenzene) pure`
  - **Category**: Solvents (Select from dropdown)
  - **SKU**: `TOL-SOL-026`
  - **Packaging Unit**: `Drum`
  - **Package Size**: `200`
  - **Base Unit**: `Litre`
  - **Price**: `₹18,500`
  - **Hazard Classes**: Check "Class 3 Flammable Liquid"
  - **UN Number**: `1294`
- [x] **CTA: Save Product**
  - _Action_: Click Save.
  - _Expected_: Redirects to Inventory list. A green success toast appears.

### 4.2 Lot & Batch Stock Intake (Admin QC Setup)

> [!NOTE]
> **What is a Lot/Batch?** In chemical distribution, stock is received in unique manufactured batches ("lots"). Each lot has its own manufacturing/expiry dates and quality inspection record.
>
> **What is a CoA (Certificate of Analysis)?** It is a laboratory certificate that proves a chemical lot matches industry purity standards (e.g. 99.9% purity). B2B clients require a printed CoA before accepting any chemical delivery.

- [x] **URL Path**: **[Create New Lot](http://localhost:5173/dashboard/inventory/lots/new)**
- [x] **Form Inputs**: Fill in these parameters to register a fresh batch of _2-Propanol (EMPLURA®) 25L_:
  - **Lot Number**: `B-2PRP-2026-A` (A unique batch name)
  - **Product**: Select `2-Propanol (EMPLURA®) 25L` from the dropdown list.
  - **Manufacturing Date**: Choose a recent date (e.g., `01-07-2026`).
  - **Expiry Date**: Choose a future date (e.g., `01-07-2028`).
  - **Initial QC Status**: Change from _QUARANTINED_ to **APPROVED (QC Passed)**. (This makes the batch active and saleable).
  - **Upload Certificate of Analysis**: Leave this blank (we will generate it dynamically using our print tool).
  - **Notes & Comments**: Type: `"High purity test lot for client demo."`
- [x] **CTA: Create Lot**
  - _Action_: Click the blue **Create Lot** button.
  - _Expected_: Redirects to the **[Lot & Batch Tracking List](http://localhost:5173/dashboard/inventory/lots)**. The new lot `B-2PRP-2026-A` is now visible.
- [x] **CTA: Detailed View Redirection**:
  - _Action_: Click on the lot number link `B-2PRP-2026-A` or click the **View** link under the Actions column.
  - _Expected_: Redirects you to the dedicated **Lot Details Page** (`/dashboard/inventory/lots/:id`). You should see all specifications, dates, stock balances, and an empty Certificate of Analysis template pre-rendered inline.
- [x] **Test CoA PDF Upload (Cloudinary Fix)**:
  - _Action_: On the Lot Details page, click **Manage Lot / CoA**. Select a PDF file (e.g. `ghs.pdf` or any file) under _Upload CoA (PDF/Image)_ and click **Update Lot**.
  - _Expected_: The update completes successfully without showing any "Something went wrong" errors. The Lot Details page reloads showing a **"CoA File Attached"** card and an option to **"View CoA Document (PDF)"**.
- [x] **Test CoA File Removal**:
  - _Action_: Click **Manage Lot / CoA** again. Click the red **Remove** button next to the "View Current CoA" link. Click **Update Lot**.
  - _Expected_: The attachment is deleted, and the screen switches back to the dynamic inline CoA analyzer template.

---

## 📂 Module 5: B2B Shopping Cart & Checkout Pipelines

**Objective**: Place orders and process payments.
**Access Role**: Customer (`patel.ind@gmail.com`)

### 5.1 Shopping Cart Actions

- [x] **URL Path**: `/catalog`
- [x] **CTA: Add to Cart**
  - _Action_: Add `2` drums of _Toluene_ (Total base value: ₹37,000) and `1` bottle of _Potassium Hydroxide Pellets_ (₹6,500) to the cart.
- [x] **Cart Page**: Navigate to `/cart`.
  - _Expected_: Displays items, quantities, and prices.
  - _Action_: Change quantity of Toluene from `2` to `3`.
  - _Expected_: The totals recalculate instantly. Click checkout.

### 5.2 Checkout & Shipping Calculations

- [x] **URL Path**: `/checkout`
- [x] **Shipping Inputs**:
  - **Address**: `Vartej Crossing Road, Bhavnagar`
  - **Distance Km**: Enter `15`
  - **Payment Method**: Select **UPI_QR**
- [x] **Calculated Costs Verification**:
  - Base Cost: `₹62,000` (for 3 drums Toluene + 1 bottle KOH)
  - Tax (CGST + SGST @ 18%): `₹11,160`
  - Shipping Cost (Base + Distance + Weight): `₹252` (₹50 Base + 15km × ₹10/km + 26 packages × ₹2/unit)
  - Hazard Material Handling Surcharge: `₹150`
  - **Total Payable**: `₹73,562`
- [x] **CTA: Place Order (UPIQR)**
  - _Action_: Click "Place Order".
  - _Expected_: Generates a transaction QR code mapped to `vatsalvadgama04@oksbi`. Displays an input field labeled **"Enter 12-digit UPI UTR / Ref Number"**.
  - _Action_: Enter mock reference number `123456789012` and click **Submit Payment**.
  - _Expected_: Redirects to confirmation screen. Order transitions to `PENDING` status. Check Resend logs to confirm order confirmation email has been dispatched.

---

## 📂 Module 6: Operations & Order Status Transitions

**Objective**: Test order status changes, stock deductions, and ledger generation.
**Access Role**: Admin/Sales

### 6.1 Order Advance Pipeline

- [x] **URL Path**: `/dashboard/orders`
- [x] **Active Orders**: Select the order placed by `Patel Industries Ltd.` (UTID matches checkout).
- [x] **CTA: "Advance Status" Button**
  - _Action 1_: Click **Advance Order** (transitions from `PENDING` ➔ `CONFIRMED`).
  - _Expected_: Status transitions. History log updates.
  - _Action 2_: Click **Advance Order** (transitions from `CONFIRMED` ➔ `PROCESSING`).
  - _Action 3_: Click **Advance Order** (transitions from `PROCESSING` ➔ `READY`).
  - _Expected_: The order transitions to `READY` / `DISPATCHED`.
- [x] **Auto-Stock Deduction Verification**: Go to **Inventory**. Select _Toluene_.
  - _Expected_: Stock count should have decremented from `15` to `12` drums.
  - _Action_: Go to **Inventory Transactions** log.
  - _Expected_: An `OUT` transaction should be logged: _"Type: OUT | Quantity: 3 | Remarks: Order #... dispatched"_.
- [x] **Ledger Entry Verification**: Click **Advance Order** to transition to `DELIVERED`.
  - _Action_: Go to **Finance** -> **Ledgers**.
  - _Expected_: A `CREDIT` entry should be logged: _"Category: REVENUE | Amount: ₹75,810 | Description: Order #... delivered — UPI"_.

---

## 📂 Module 7: HRMS & Payroll Management

**Objective**: Test employee configurations, joining blocks, positive payroll math, and letterhead receipt print triggers.
**Access Role**: Admin/HR

### 7.1 Employee Wages Bounds Checks

- [x] **URL Path**: `/dashboard/hr/add-employee`
- [x] **Form Inputs (Wages Validation)**:
  - **First Name**: `Rajesh`
  - **Last Name**: `Sharma`
  - **Role**: `MANAGER`
  - **Base Salary (Monthly)**: `₹25,000`
  - **Annual CTC**: Try entering `₹2,500` (invalid case: must be >= Base \* 12)
  - **PF Rate**: Try entering `35.0` (invalid case: must be between 0% and 30%)
- [x] **Validation Test**: Click Save.
  - _Expected_: Blocks submission and triggers warnings: _"Annual CTC must be at least 12x the monthly base salary"_ and _"PF Rate must be between 0% and 30%"_.
- [x] **Correct Submission**: Change CTC to `₹3,00,000` and PF Rate to `12.0`. Submit.
  - _Expected_: Employee profile is created successfully.

### 7.2 Attendance Pre-Joining Date Block

- [x] **URL Path**: `/dashboard/hr/attendance`
- [x] **Calendar Selection**: Open the attendance calendar for `Rajesh Sharma` (joining date: today).
- [x] **Cell Checks**: Look at dates prior to today.
  - _Expected_: Cells preceding the joining date should render as grayed out with a `-` placeholder.
  - _Action_: Click on one of the disabled cells.
  - _Expected_: Blocks action and shows warning toast: _"Cannot edit attendance before employee's joining date."_

### 7.3 Positive Payroll Calculation

- [x] **Calendar Attendance Logging**:
  - Mark Rajesh present for `22` days.
  - Log `2` days as Paid Leave.
  - Log `4` days as Absent.
  - Log `8` hours of Overtime.
- [x] **Wages Math Verification**: Run the payroll generation for the current month.
  - _Calculated Pay_: Salary should be calculated based on positive days worked (`22` present + `2` leaves + public holidays), adding overtime pay, and subtracting PF/TDS deductions. Verify that no negative subtraction errors occur.

### 7.4 Disbursal Receipt Printing

- [x] **Disbursal Action**: Go to the active payroll slip, select **UPI** as payment preference, and click **Disburse Salary**.
  - _Expected_: Redirection to `/dashboard/payroll/pay/:id` showing a payment confirmation receipt.
- [x] **CTA: Print Receipt Button**
  - _Action_: Click **Print Receipt**.
  - _Expected_: The browser print dialogue triggers, displaying a formal salary statement featuring the ChemiCrown company letterhead.
