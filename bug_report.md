# ChemiCrown CDMS - Bug Report & Analysis

This document provides a detailed explanation of the 10 identified bugs and issues in the ChemiCrown CDMS project. It is intended to be shared with other developers or AI assistants to facilitate fixing these issues.

---

### 1. Low Stock Alerts Missing Out-of-Stock Products
**Issue:** The super admin dashboard's "Low Stock Alerts" shows products below the threshold but fails to display products that are entirely out of stock (quantity = 0).
**Root Cause & Explanation:**
The backend query for fetching low stock products likely uses a condition such as `0 < quantity <= minThreshold` or explicitly filters out zero-quantity items, assuming they might be handled by a separate "Out of Stock" query. 
**To Fix:** Review the `inventory.controller.js` and the corresponding Prisma queries. Ensure the condition for low stock is `quantity <= minThreshold` and explicitly includes items where `quantity === 0`.

### 2. "Place Order" Button Not Working
**Issue:** Clicking the "Place Order" button does not do anything (no loading state, no success message, no error message) regardless of the user role.
**Root Cause & Explanation:**
This is a frontend issue in the `Checkout.jsx` component. The button's `onClick` handler or form submission might be failing silently due to:
- Missing required fields throwing a validation error that isn't connected to the UI toast notifications.
- A network error or unhandled Promise rejection in the API call.
- The `toast.error()` might be triggered but the Toast container is not mounted in the DOM.
**To Fix:** Inspect the `handlePlaceOrder` (or similar) function in the frontend. Add `console.log` statements or proper try-catch blocks to ensure that validation and network errors are caught and displayed via the UI toast system.

### 3. Delivered "Pay on Delivery" Orders Show Payment as "Pending"
**Issue:** If an order has the payment method "Pay on Delivery" and its status is updated to "Delivered", the payment status remains "Pending".
**Root Cause & Explanation:**
The business logic for updating an order's status and updating its payment status are currently decoupled. When a delivery driver or admin marks an order as "Delivered", the system does not automatically check the payment method to update the payment status.
**To Fix:** Add a hook or update the logic in the order status update controller. If `newStatus === 'DELIVERED'` and `paymentMethod === 'PAY_ON_DELIVERY'`, the system should either automatically update `paymentStatus = 'PAID'` or prompt the user/admin to confirm the payment was received.

### 4. Overtime Hours Accept Negative Values
**Issue:** The overtime entry form allows users to input negative hours.
**Root Cause & Explanation:**
The frontend `<input>` field lacks standard HTML5 validation constraints, and the backend lacks logical validation.
**To Fix:**
- **Frontend:** Add `min="0"` to the overtime `<input type="number">` field.
- **Backend:** Add validation (e.g., using Joi, Zod, or manual checks) in the controller handling overtime submissions to reject any value `< 0`.

### 5. Work Assignment Fails for Owner and Admin to Manager
**Issue:** When logged in as an Owner or Admin, trying to assign work to a Manager results in a "Failed to assign work" error.
**Root Cause & Explanation:**
This indicates a flaw in the Role-Based Access Control (RBAC) middleware or the task assignment controller. The backend is likely checking for an exact role match (e.g., only allowing `SUPER_ADMIN` to assign to `MANAGER`) rather than utilizing a proper hierarchy scale where `OWNER` > `SUPER_ADMIN` > `ADMIN` > `MANAGER`.
**To Fix:** Review the permissions matrix in the backend. Ensure that roles with higher privileges (Owner, Admin) are authorized to assign tasks to roles beneath them in the hierarchy.

### 6. Add Employee Form Text Overlap
**Issue:** In the "Add Employee" modal, the placeholder text or background text overlaps with the text entered by the user.
**Root Cause & Explanation:**
This is a UI styling issue, typically occurring when custom floating labels or absolute-positioned placeholder text is used without properly tying visibility to the input's state. When the user types, the placeholder doesn't disappear.
**To Fix:** In `EmployeeModal.jsx` (and related form components), either switch to standard HTML placeholder attributes or update the CSS/state logic to hide the overlapping background text when `inputValue.length > 0`.

### 7. Performance Score Defaults to 85/100
**Issue:** Newly added employees automatically show a performance score of 85/100 without any real data backing it.
**Root Cause & Explanation:**
The performance metric calculation is likely using a hardcoded default fallback (e.g., `score || 85`) when an employee has no history of tasks, sales, or attendance.
**To Fix:** Establish a standard. If an employee is new and lacks sufficient data points to calculate a score, the backend should return `null` or a specific flag, and the frontend should display "N/A" (Not Applicable) or "New Joiner" instead of an arbitrary 85.

### 8. Finance Dashboard Shows Positive Profit Number for a Loss (-284.5% Margin)
**Issue:** The finance dashboard displays a Net Profit of "11.9L" but a margin of "-284.5%". Total Revenue (4.2L) is lower than Total Expenses (16.1L), meaning it should show a loss.
**Root Cause & Explanation:**
- **The Math Issue:** 4.2L (Revenue) - 1.9L (COGS) - 14.2L (Payroll) = -11.9L. The system is taking the absolute value of the profit (`Math.abs(profit)`) for the display number without indicating it's negative, but correctly calculating the margin percentage.
- **Differentiation Request:** The user also requested separating "revenue by product" and "salary". Currently, they might be bundled in overarching analytics.
**To Fix:** 
- **Frontend:** Ensure the UI formats negative numbers correctly (e.g., `-₹11.9L` or in red text) rather than just `11.9L`.
- **Backend:** Update the `analytics.controller.js` to separate "Revenue by Product" and "Salary/Payroll" into distinct data streams so the frontend can plot them on separate charts.

### 9. Contact Us "Full Name" Missing Placeholder
**Issue:** The "Full Name" input in the Contact Section lacks the placeholder text `Your Full Name`.
**Root Cause & Explanation:**
A simple omission in the frontend React component.
**To Fix:** Locate the contact form component and add the attribute `placeholder="Your Full Name"` to the Full Name input field.

### 10. Empty Privacy Policy & Terms of Service
**Issue:** The Privacy Policy and Terms of Service pages do not contain any content (e.g., replacement policy).
**Root Cause & Explanation:**
These pages are currently acting as placeholders without the actual static legal and policy text.
**To Fix:** Locate the Privacy Policy and Terms of Service components in the frontend and populate them with the standard operational policies, including data usage, terms of service, and the replacement/return policy.
