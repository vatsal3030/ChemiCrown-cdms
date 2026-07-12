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
   * **Super Admin**: `admin@chemicrown.com` / Password: `password123` (or the default set in seed.js)
   * **Seeded Products**: *Potassium Hydroxide Pellets*, *Acetone*, *MTO*, *GP Thinner*, *Red Oxide Primer*.

---

## 📂 Module 1: Public B2B Portal & Storefront
**Objective**: Verify the public marketing pages, catalog navigation, and document printing triggers.
**Access URL**: `http://localhost:5173/`

### 1.1 Header & Footer Navigation
* [ ] **CTA: Logo Brand** (Top Left Header)
  * *Action*: Click the ChemiCrown logo.
  * *Expected*: Instantly returns you to the home page (`/`).
* [ ] **CTA: Public Navbar Links** (Catalog, About Us, Contact)
  * *Action*: Click each link in the navbar.
  * *Expected*: Smooth route transitions without page flashes. The navbar should display loader skeletons while verifying active sessions, then show the "Login" button if unauthenticated.
* [ ] **CTA: Public Footer Links** (Privacy Policy, Terms of Service)
  * *Action*: Scroll to bottom, click links.
  * *Expected*: Renders the correct policy page layouts.

### 1.2 Interactive Chemical Catalog (Public View)
* [ ] **URL Path**: `/catalog`
* [ ] **Search Input** (Filter Chemicals)
  * *Action*: Type `"Thinner"` into the search box.
  * *Expected*: The list should filter in real-time, showing *GP Thinner* and *Nitrocellulose (NC) Thinner*.
* [ ] **Category Filters** (Sidebar)
  * *Action*: Click on the "Solvents" category.
  * *Expected*: The catalog lists only solvent items (e.g. Toluene, Acetone).
* [ ] **CTA: View Details Button**
  * *Action*: Click "View Details" on the *Acetone (Propanone)* card.
  * *Expected*: Opens `/product/:id`. Shows CAS Number (`67-64-1`), UN Number (`1090`), GHS Hazard Class ratings (Class 3 Flammable Liquid), Safety Data Sheet (SDS) button, and base pricing details.

### 1.3 GHS & CoA Print Modals
* [ ] **CTA: "Print GHS Label" Button**
  * *Action*: Click this button on any product details view.
  * *Expected*: A modal overlay appears showing the GHS pictogram warnings (e.g. Flame, Exclamation mark) and handling warnings.
  * *Action*: Click the green **Print Label** button in the modal.
  * *Expected*: The native browser print prompt opens immediately, rendering the label preview with exact margin borders.
* [ ] **CTA: "Generate CoA" Button**
  * *Action*: Click this button.
  * *Expected*: A form modal slides open.
  * *Action*: Fill out the fields with realistic batch data:
    * **Batch Number**: `CH-ACT-2026-07`
    * **Mfg Date**: `2026-07-01`
    * **Purity**: `99.92%`
    * **Specific Gravity**: `0.791`
  * *Action*: Click **Print CoA** inside the modal.
  * *Expected*: The native print utility triggers, rendering a formal ChemiCrown Certificate of Analysis sheet with the input metrics.

---

## 📂 Module 2: Authentication & Switcher Workflows
**Objective**: Verify registrations, login parameters, and concurrent multi-session switching.

### 2.1 Customer Registration (Verification Lockout)
* [ ] **URL Path**: `/register`
* [ ] **Form Inputs**: Fill out the following mock registration details:
  * **First Name**: `Vikram`
  * **Last Name**: `Patel`
  * **Company Name**: `Patel Industries Ltd.`
  * **Phone**: `+91 98980 12345`
  * **Email**: `patel.ind@gmail.com`
  * **GST Number**: `24ABCDE1234F1Z5` (Must match valid 15-character Indian GSTIN format)
  * **Password**: `securepass123`
  * **Confirm Password**: `securepass123`
* [ ] **Usability Check**: Verify that typing in any field does **not** cause the input to lose focus. You should be able to type your first name, company, and phone continuously without re-clicking.
* [ ] **Validation Test (Error Case)**: Modify the GST number to `12345` (invalid format) and click "Create Account".
  * *Expected*: An inline validation error toast appears: *"Invalid GSTIN format"*.
* [ ] **Successful Submission**: Correct the GST number to `24ABCDE1234F1Z5` and submit.
  * *Expected*: The registration succeeds and displays the *"Account Pending Verification"* template.
* [ ] **Login Lockout Check**: Go to `/login`. Try logging in with `patel.ind@gmail.com` / `securepass123`.
  * *Expected*: Blocks login and displays an error toast: *"Your account is pending admin verification. You will receive access once an administrator approves your account."*

### 2.2 Profile Switching Context
* [ ] **Super Admin Login**: Log in as `admin@chemicrown.com` / `password123`. Verify redirection to `/dashboard`.
* [ ] **CTA: "Add Account" Button**
  * *Action*: Open the profile dropdown switcher at the bottom-left sidebar. Click **Add Account**.
  * *Expected*: The app navigates to `/login?add-account=true`. You should **not** be auto-redirected back to `/dashboard` even though the Admin session is currently active.
* [ ] **Switch Account Login**: Sign in with another admin credential, or try to register a new employee. Once authenticated, open the switcher again.
  * *Expected*: Both profiles are listed. Clicking either switches active tokens in `localStorage` (`chemicrown_active_token`) and reloads layouts instantly.
* [ ] **Session Sync**: Open a second browser tab on `http://localhost:5173/dashboard`. In Tab 1, log out of the active account.
  * *Expected*: Tab 2 detects the storage shift and automatically redirects to the public home page, preventing active session leaks.

---

## 📂 Module 3: Customer Verification & Admin Directory
**Objective**: Approve clients and manage system users.

### 3.1 Verify Registered Customers
* [ ] **URL Path**: `/dashboard/verify` (Access as Admin)
* [ ] **Pending List**: Locate `Patel Industries Ltd.` in the pending list.
* [ ] **CTA: Approve Button** (Checkmark Icon)
  * *Action*: Click the verify checkmark.
  * *Expected*: Custom Confirm Modal displays: *"Are you sure you want to approve this customer?"*
  * *Action*: Click **Confirm**.
  * *Expected*: Customer status changes. An email is dispatched to `patel.ind@gmail.com` confirming account approval.
* [ ] **CTA: Reject/Remove Button** (Trash Icon)
  * *Action*: Register a mock account `fake.buyer@gmail.com` and click Reject.
  * *Expected*: Removes the pending listing and soft-deactivates the user record.

---

## 📂 Module 4: Product & Inventory Admin Controls
**Objective**: Test product creation, lot allocations, and automated transaction logging.

### 4.1 Create Product Form
* [ ] **URL Path**: `/dashboard/inventory/product/new` (Access as Admin/Manager)
* [ ] **Form Inputs**: Enter the following mock product specifications:
  * **Product Name**: `Toluene (Methylbenzene) pure`
  * **Category**: Solvents (Select from dropdown)
  * **SKU**: `TOL-SOL-026`
  * **Packaging Unit**: `Drum`
  * **Package Size**: `200`
  * **Base Unit**: `Litre`
  * **Price**: `₹18,500`
  * **Hazard Classes**: Check "Class 3 Flammable Liquid"
  * **UN Number**: `1294`
* [ ] **CTA: Save Product**
  * *Action*: Click Save.
  * *Expected*: Redirects to Inventory list. A green success toast appears.

### 4.2 Lot & Batch Stock Intake
* [ ] **URL Path**: `/dashboard/inventory/lots/new`
* [ ] **Form Inputs**: Fill in stock intake metrics:
  * **Product**: Toluene (Select from list)
  * **Supplier**: Rankem / Avantor (Select from list)
  * **Lot Number**: `B-TOL-04`
  * **Initial Quantity**: `15` (Drums)
  * **Safety Stock Threshold**: `3` (Drums)
  * **Mfg Date**: `2026-07-01`
  * **Expiry Date**: `2028-07-01`
* [ ] **CTA: Save Lot**
  * *Action*: Click Save.
  * *Expected*: The system creates the batch, initializes the Inventory count to `15`, and creates an `IN` record in `InventoryTransaction`.
* [ ] **Verify Audit Transaction**: Go to **Inventory Transactions** log. Confirm the entry displays: *"Type: IN | Quantity: 15 | Remarks: Initial batch intake lot B-TOL-04"*.

---

## 📂 Module 5: B2B Shopping Cart & Checkout Pipelines
**Objective**: Place orders and process payments.
**Access Role**: Customer (`patel.ind@gmail.com`)

### 5.1 Shopping Cart Actions
* [ ] **URL Path**: `/catalog`
* [ ] **CTA: Add to Cart**
  * *Action*: Add `2` drums of *Toluene* (Total base value: ₹37,000) and `1` bottle of *Potassium Hydroxide Pellets* (₹6,500) to the cart.
* [ ] **Cart Page**: Navigate to `/cart`.
  * *Expected*: Displays items, quantities, and prices.
  * *Action*: Change quantity of Toluene from `2` to `3`.
  * *Expected*: The totals recalculate instantly. Click checkout.

### 5.2 Checkout & Shipping Calculations
* [ ] **URL Path**: `/checkout`
* [ ] **Shipping Inputs**:
  * **Address**: `Vartej Crossing Road, Bhavnagar`
  * **Distance Km**: Enter `15`
  * **Payment Method**: Select **UPI_QR**
* [ ] **Calculated Costs Verification**:
  * Base Cost: `₹62,000` (for 3 drums Toluene + 1 bottle KOH)
  * Tax (CGST + SGST @ 18%): `₹11,160`
  * Shipping (₹10/km): `₹150`
  * Hazard Material Handling Surcharge: `₹2,500`
  * **Total Payable**: `₹75,810`
* [ ] **CTA: Place Order (UPIQR)**
  * *Action*: Click "Place Order".
  * *Expected*: Generates a transaction QR code mapped to `vatsalvadgama04@oksbi`. Displays an input field labeled **"Enter 12-digit UPI UTR / Ref Number"**.
  * *Action*: Enter mock reference number `123456789012` and click **Submit Payment**.
  * *Expected*: Redirects to confirmation screen. Order transitions to `PENDING` status. Check Resend logs to confirm order confirmation email has been dispatched.

---

## 📂 Module 6: Operations & Order Status Transitions
**Objective**: Test order status changes, stock deductions, and ledger generation.
**Access Role**: Admin/Sales

### 6.1 Order Advance Pipeline
* [ ] **URL Path**: `/dashboard/orders`
* [ ] **Active Orders**: Select the order placed by `Patel Industries Ltd.` (UTID matches checkout).
* [ ] **CTA: "Advance Status" Button**
  * *Action 1*: Click **Advance Order** (transitions from `PENDING` ➔ `CONFIRMED`).
  * *Expected*: Status transitions. History log updates.
  * *Action 2*: Click **Advance Order** (transitions from `CONFIRMED` ➔ `PROCESSING`).
  * *Action 3*: Click **Advance Order** (transitions from `PROCESSING` ➔ `READY`).
  * *Expected*: The order transitions to `READY` / `DISPATCHED`.
* [ ] **Auto-Stock Deduction Verification**: Go to **Inventory**. Select *Toluene*.
  * *Expected*: Stock count should have decremented from `15` to `12` drums.
  * *Action*: Go to **Inventory Transactions** log.
  * *Expected*: An `OUT` transaction should be logged: *"Type: OUT | Quantity: 3 | Remarks: Order #... dispatched"*.
* [ ] **Ledger Entry Verification**: Click **Advance Order** to transition to `DELIVERED`.
  * *Action*: Go to **Finance** -> **Ledgers**.
  * *Expected*: A `CREDIT` entry should be logged: *"Category: REVENUE | Amount: ₹75,810 | Description: Order #... delivered — UPI"*.

---

## 📂 Module 7: HRMS & Payroll Management
**Objective**: Test employee configurations, joining blocks, positive payroll math, and letterhead receipt print triggers.
**Access Role**: Admin/HR

### 7.1 Employee Wages Bounds Checks
* [ ] **URL Path**: `/dashboard/hr/add-employee`
* [ ] **Form Inputs (Wages Validation)**:
  * **First Name**: `Rajesh`
  * **Last Name**: `Sharma`
  * **Role**: `MANAGER`
  * **Base Salary (Monthly)**: `₹25,000`
  * **Annual CTC**: Try entering `₹2,500` (invalid case: must be >= Base * 12)
  * **PF Rate**: Try entering `35.0` (invalid case: must be between 0% and 30%)
* [ ] **Validation Test**: Click Save.
  * *Expected*: Blocks submission and triggers warnings: *"Annual CTC must be at least 12x the monthly base salary"* and *"PF Rate must be between 0% and 30%"*.
* [ ] **Correct Submission**: Change CTC to `₹3,00,000` and PF Rate to `12.0`. Submit.
  * *Expected*: Employee profile is created successfully.

### 7.2 Attendance Pre-Joining Date Block
* [ ] **URL Path**: `/dashboard/hr/attendance`
* [ ] **Calendar Selection**: Open the attendance calendar for `Rajesh Sharma` (joining date: today).
* [ ] **Cell Checks**: Look at dates prior to today.
  * *Expected*: Cells preceding the joining date should render as grayed out with a `-` placeholder.
  * *Action*: Click on one of the disabled cells.
  * *Expected*: Blocks action and shows warning toast: *"Cannot edit attendance before employee's joining date."*

### 7.3 Positive Payroll Calculation
* [ ] **Calendar Attendance Logging**:
  * Mark Rajesh present for `22` days.
  * Log `2` days as Paid Leave.
  * Log `4` days as Absent.
  * Log `8` hours of Overtime.
* [ ] **Wages Math Verification**: Run the payroll generation for the current month.
  * *Calculated Pay*: Salary should be calculated based on positive days worked (`22` present + `2` leaves + public holidays), adding overtime pay, and subtracting PF/TDS deductions. Verify that no negative subtraction errors occur.

### 7.4 Disbursal Receipt Printing
* [ ] **Disbursal Action**: Go to the active payroll slip, select **UPI** as payment preference, and click **Disburse Salary**.
  * *Expected*: Redirection to `/dashboard/payroll/pay/:id` showing a payment confirmation receipt.
* [ ] **CTA: Print Receipt Button**
  * *Action*: Click **Print Receipt**.
  * *Expected*: The browser print dialogue triggers, displaying a formal salary statement featuring the ChemiCrown company letterhead.
