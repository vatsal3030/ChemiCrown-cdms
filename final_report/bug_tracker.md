# ChemiCrown CDMS — Final Testing Roadmap & Bug Tracker

This document provides a comprehensive, step-by-step roadmap to test the entire ChemiCrown Chemical Distribution Management System (CDMS) before client delivery. It includes database seeding steps, role-based workflows, interface micro-interaction checks, and a structured registry to log bugs discovered during testing.

---

## 🛠️ Step 1: Database Seeding & Clean Boot

Before beginning functional tests, ensure your database contains fresh, realistic baseline chemical products, default suppliers, and initial administrative roles.

1. **Purge & Reset database** (Warning: This wipes existing runtime logs):
   ```bash
   cd backend
   npx prisma db push --force-reset
   ```
2. **Execute core database seeds**:
   ```bash
   # Seed default categories, suppliers, and products
   npx prisma db seed
   
   # Seed regional public holidays
   node seed-holidays.js
   ```
3. **Start local development servers**:
   * **Backend**: `npm run dev` (Runs on http://localhost:5000)
   * **Frontend**: `npm run dev` (Runs on http://localhost:5173)

---

## 🗺️ Step 2: System-Wide Testing Roadmap

Follow this structured roadmap to verify that all functional paths, UI components, and integrations operate cleanly.

### Phase 1: Public Storefront & Interactive Cursor (Unauthenticated)
* [ ] **Public Navigation**: Visit `http://localhost:5173/`. Navigate through Home, About, Catalog, and Contact views. Confirm the showcase header and footer render consistently on every page.
* [ ] **Interactive Cursor (ChemiCursor)**: Move the pointer over non-clickable elements. The Erlenmeyer flask cursor should tilt dynamically based on velocity.
* [ ] **Target Dot & Hover States**: Hover over clickable cards or links. The cursor should pivot to a $15^\circ$ angle, bubbles should speed up, and a precise neon-red target dot should align with the true mouse coordinates.
* [ ] **Agitated Shake Eruption**: Shake the mouse rapidly. The flask cursor should scale up gradually to 4x. Once the threshold is crossed, verify:
  * A neon green outline flash occurs.
  * A colorful droplet/spark particle burst sprays in a 360-degree radius.
  * A full-screen shockwave expands, popping all background bubbles inside its radius.
  * The flask cursor elastically snaps back to its base 1x scale.
* [ ] **Cursor Visibility Fallback**:
  * Move the mouse outside the browser viewport. Confirm that the default system cursor returns instantly.
  * *On hybrid/touch laptops*: Verify that touching the screen uses standard finger touch pointers, while moving the trackpad/mouse displays the custom cursor. No cursors should remain invisible.

### Phase 2: Customer Registration, Switcher, & Verification
* [ ] **Account Registration**: Click "Register" (Create Account). Complete the registration form. Type values in First Name, Last Name, and Company. Verify the input fields **do not** lose focus after typing a single character.
* [ ] **Verification Safeguard**: Click Submit. Verify the account is created, but you **cannot** log in immediately (returns pending verification message).
* [ ] **Admin Login**: Log in as `admin@chemicrown.com`. Confirm you are routed to the Admin Dashboard.
* [ ] **Customer Verification**: Go to **User Management** -> **Pending Customers**. Click "Verify" next to your newly registered customer account. Check console or Resend logs to verify that a verification confirmation email was sent.
* [ ] **Multi-Account Switcher (Add Account)**:
  * In the admin dashboard sidebar, open the profile switcher and click **Add Account**.
  * Verify the application redirects to `/login?add-account=true` and does **not** auto-redirect back to the dashboard.
  * Sign in with your newly verified customer account. 
  * Open the switcher again. Confirm that both the Admin and Customer accounts are cached, and you can switch between them instantly.

### Phase 3: Product Catalog & GHS/CoA Prints
* [ ] **Chemical Specifications**: Access the product catalog. Open any product detail view (e.g. Potassium Hydroxide Pellets).
* [ ] **GHS Printing**: Click **Print GHS Label**. Click **Print** in the modal. Verify the browser's native print window triggers immediately with proper margins.
* [ ] **CoA Document**: Click **Generate Certificate of Analysis (CoA)**. Fill in the batch/lot fields, click Print, and verify it generates a clean printable document.

### Phase 4: Order Placement & Checkout Flows
* [ ] **Purchase Cart**: Switch to the Customer profile. Add products to the cart and wishlist. Adjust quantities.
* [ ] **Checkout Validation**: Proceed to checkout. Enter address and choose payment method:
  * **Razorpay**: Verify it triggers the Razorpay popup gateway.
  * **UPI QR**: Verify it displays the UPI QR code and requests a UTR verification number.
* [ ] **Check Invoices**: Complete the order. Check the Order History view. Confirm that a detailed confirmation invoice has been sent to the client's email inbox.

### Phase 5: Operations & Status Transitions
* [ ] **Quotations & Approvals**: Switch back to the Admin/Sales profile. Go to the active orders database.
* [ ] **Pipeline Progress**: Advance the order status through steps (`REQUESTED` ➔ `PENDING` ➔ `PROCESSING` ➔ `READY` ➔ `SHIPPED` ➔ `DELIVERED`).
* [ ] **Stock Deduction**: Upon status advancing to `DISPATCHED` (or `READY`), check the Inventory database. Confirm that product quantities have decremented correctly and an `OUT` transaction was logged in the audit trails.
* [ ] **Bookkeeping ledgers**: Advance the order to `DELIVERED`. Go to **Finance** -> **Ledgers**. Confirm that a `CREDIT` entry of the exact order value was posted under the `REVENUE` category.

### Phase 6: HRMS, Wages, & Attendance Blocks
* [ ] **Wage Bounds Checks**: Navigate to **HR Management** -> **Directory**. Add a new employee. Try entering an annual CTC that is less than 12 times the monthly base salary, or a PF rate above 30%. Verify the form blocks submission with a toast warning.
* [ ] **Pre-joining Date Block**: Open the employee's attendance calendar. Check dates preceding their official joining date. Verify they are grayed out, show a `-` symbol, and clicking them blocks modifications with a warning toast.
* [ ] **Positive Payroll calculation**: Log attendance for the month (present days, half days, paid leaves). Trigger payroll generation. Verify that the salary matches the positive days worked accumulation.
* [ ] **Letterhead Receipt printing**: Disburse the salary slip. Confirm you are shown a detailed Salary Disbursal Receipt on-screen. Click **Print Receipt** and check the letterhead layout.

---

## 💡 How to Update Checkboxes
To mark a test step as completed in Markdown:
1. Open the `.md` file in your editor (e.g. Visual Studio Code).
2. Find the checkbox line: `- [ ] **Task name**`
3. Replace the empty space with an `x`: `- [x] **Task name**`
4. Save the file. The UI or preview will render it as a checked box.

---

## 📝 Bug Tracker Registry

Please use the table below to document any visual defects, broken links, or logical errors found during your testing. Copy your raw insights here, and I will rewrite them into clear, actionable, and structured bug entries.

| Bug ID | Component / Page | Description of Issue (Raw or Technical) | Expected Behavior | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **B01** | UI / Custom Cursor | Double cursor visible; system default pointer remains visible alongside the custom flask cursor. | Hide system pointer entirely when custom cursor renders; show default only on fallback. | *High* | **Resolved (Fixed)** |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
