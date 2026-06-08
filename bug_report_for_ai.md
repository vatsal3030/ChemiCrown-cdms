# Comprehensive Bug Report & Fix Documentation

This document outlines 14 specific bugs found during end-to-end testing of the ChemiCrown CDMS application. It provides technical context, the likely root cause, and instructions on how to fix each issue so they can be processed efficiently.

---

### Bug 1: Add Employee Modal is Cut Off
- **Description:** When clicking "Add Employee", the modal or form box extends beyond the screen. On smaller or standard screens, the bottom is cut off, and there is no scrollbar available.
- **Expected Behavior:** The modal content should scroll internally without requiring the user to zoom out or switch to full screen.
- **Technical Context for Fix:** Locate the `AddEmployeeModal` or employee form component inside `frontend/src/pages/admin/HRManagement.jsx` (or related components). Add Tailwind classes like `max-h-[90vh]` and `overflow-y-auto` to the modal's main container to enable internal scrolling.

### Bug 2: Missing GST Number Validation
- **Description:** There is no code validating the format of the GST Number when registering a business customer or updating profile settings.
- **Expected Behavior:** The system should validate the GSTNO using a standard Indian GST Regex (e.g., `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).
- **Technical Context for Fix:** 
  1. Add Zod validation in `backend/validations/` for the GST field.
  2. Add regex pattern validation on the frontend form inputs where GST is collected.

### Bug 3: Page Scrolls to Bottom on Product Details Navigation
- **Description:** When clicking a product card from the Catalog, the page navigates to the Product Details view but automatically scrolls to the very bottom of the page instead of starting at the top.
- **Expected Behavior:** The page should start at the top `(y=0)` when navigating to a new route.
- **Technical Context for Fix:** In `frontend/src/pages/ProductDetails.jsx`, add a `useEffect` hook that triggers `window.scrollTo(0, 0)` whenever the component mounts or the `id` param changes. (Alternatively, add a global `ScrollToTop` component inside the React Router setup in `App.jsx`).

### Bug 4: Generic Checkout/Order Validation Errors
- **Description:** During checkout, if details are missing or incorrect, the system throws a generic validation error toast but doesn't highlight which specific fields are missing or invalid.
- **Expected Behavior:** Specific inline error messages should appear beneath the invalid form fields (e.g., "Address is required", "Invalid zip code").
- **Technical Context for Fix:** Update the checkout form component to capture the specific field errors from the backend response or frontend Zod/Yup schema. Map these error messages to their respective input fields in the UI state.

### Bug 5: Low Stock Alert Does Not Identify Products
- **Description:** In the Dashboard, the Low Stock widget only shows a generic alert or count but does not list the names of the specific products that have fallen below the threshold.
- **Expected Behavior:** The widget should display a list of the actual product names (and current stock numbers) that are low on stock.
- **Technical Context for Fix:** Update the backend analytics route (`backend/src/routes/analytics.routes.js` or corresponding controller) to return an array of low-stock products (e.g., `[{ id, name, stock }]`) instead of just a count. Map this array in the frontend Dashboard UI.

### Bug 6: Dashboard Revenue Does Not Update After Orders
- **Description:** The Revenue metric on the main Dashboard does not change after new orders are placed and completed.
- **Expected Behavior:** Total Revenue should recalculate dynamically based on the sum of all successful/paid orders.
- **Technical Context for Fix:** The backend analytics controller calculating total revenue needs to be checked. Ensure it is querying the `Orders` table, filtering by appropriate statuses (e.g., "Delivered" or "Paid"), and summing the `totalAmount` accurately.

### Bug 7: "Approved Today" Metric Does Not Update
- **Description:** When an admin approves a newly registered customer, the "Approved Today" stat on the dashboard does not increment.
- **Expected Behavior:** The dashboard should accurately reflect how many customers were approved on the current date.
- **Technical Context for Fix:** The analytics query for this metric is likely looking at `createdAt` instead of an `approvedAt` or `updatedAt` timestamp. Ensure the approval controller updates an `approvedAt` timestamp, and the dashboard query counts records where `approvedAt` is today.

### Bug 8: Out of Stock Products Show Delivery Estimation
- **Description:** Even if a product has 0 stock (Out of Stock), the product details page still displays a message saying "Free delivery tomorrow".
- **Expected Behavior:** If `stock <= 0`, hide the delivery estimation and instead display a clear "Out of Stock" warning.
- **Technical Context for Fix:** In `frontend/src/pages/ProductDetails.jsx`, wrap the delivery text in a conditional render: `{product.stock > 0 && <p>Free delivery tomorrow</p>}`.

### Bug 9: No Permanent Delete Option in Recycle Bin
- **Description:** Products deleted from inventory go to the Recycle Bin (`/dashboard/recycle-bin`), but there is no button to permanently remove them from the system.
- **Expected Behavior:** The Recycle Bin should have a "Permanently Delete" button for each item (or an "Empty Bin" button).
- **Technical Context for Fix:** 
  1. Add a `DELETE` endpoint in `backend/src/routes/trash.routes.js` to physically remove the record from the database.
  2. Add the corresponding "Delete Permanently" button and API call in `frontend/src/pages/admin/RecycleBin.jsx`.

### Bug 10: Unauthorized Roles See "Pay Salary to Self" Option
- **Description:** Managers and other roles can see the option to pay their own salary. This action should be strictly restricted to the `SUPER_ADMIN` (or specifically authorized roles).
- **Expected Behavior:** The "Pay Salary" button for oneself should be hidden or disabled for anyone who is not a Super Admin.
- **Technical Context for Fix:** In the HR or Salary components, wrap the payment button logic with a role check: `if (currentUser.role === 'SUPER_ADMIN') { showButton }`.

### Bug 11: Missing Employee Confirmation for Salary Receipts
- **Description:** When an admin pays a salary, the admin dashboard shows "Awaiting Confirmation". However, the employee's payslip view has no "Confirm" button to acknowledge receipt.
- **Expected Behavior:** Employees should see a "Confirm Receipt" button on their payslip, which updates the status in the admin's view from "Awaiting Confirmation" to "Confirmed".
- **Technical Context for Fix:** 
  1. Add a "Confirm" button in the employee's payslip UI (`frontend/src/pages/employee/MyAttendance.jsx` or similar).
  2. Create a backend endpoint to update the `salaryStatus` to "Confirmed".

### Bug 12: HR Attendance System Does Not Highlight Past Data
- **Description:** In the HR attendance view, past attendance records (Present, Absent, Half-day) are not visually highlighted, making it hard to see a user's history at a glance.
- **Expected Behavior:** Past attendance records should be color-coded (e.g., Green for Present, Red for Absent, Yellow for Half-day).
- **Technical Context for Fix:** In the HR attendance UI component, apply dynamic Tailwind CSS classes based on the attendance status value when rendering historical data rows/calendars.

### Bug 13: Owner Role Missing Payslip Section
- **Description:** If the Super Admin pays the Owner's salary, the Owner has no UI section to view their payslips or confirm salary receipts.
- **Expected Behavior:** The Owner role should have access to a "My Payslips" or "Salary" section just like regular employees.
- **Technical Context for Fix:** In `frontend/src/App.jsx`, ensure the route that renders employee payslips (possibly `/dashboard/me` or a new `/dashboard/payslips`) is accessible to the `OWNER` role in the `ProtectedRoute` configuration.

### Bug 14: Salary Payment Should Be Limited to Once Per Month
- **Description:** Currently, admins can accidentally pay a salary multiple times in the same month.
- **Expected Behavior:** Once a salary is paid to an employee for a specific month and year, the "Pay Salary" button for that employee should be disabled until the next month.
- **Technical Context for Fix:** 
  1. Frontend: Check the latest salary record's date. If it matches the current month/year, disable the payment button.
  2. Backend: Add a validation check in the payment controller to reject the request if a payment record already exists for the `employeeId` for the current `month` and `year`.
