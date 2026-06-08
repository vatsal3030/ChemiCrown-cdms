# Phase 2 Bug Report & Fix Documentation

This document outlines the second batch of bugs discovered during the manual testing phase of the ChemiCrown CDMS application. Please provide this to the AI so it can implement the fixes.

---

### Bug 1: Application Crash on Payslip/Payroll Screen (`/dashboard/my-payroll`)
- **Description:** When navigating to the `my-payroll` or payslip screen, the application completely crashes and displays the ErrorBoundary fallback UI ("Oops! Something went wrong.").
- **Expected Behavior:** The payroll page should load the user's payslips or salary details without crashing. If no data exists, it should show an empty state.
- **Technical Context for Fix:** 
  1. This is an unhandled runtime exception in React. Inspect the component rendering the `/dashboard/my-payroll` route.
  2. The crash is likely caused by attempting to access properties on `undefined` or `null` objects (e.g., `user.salary.amount` when `salary` is null) or mapping over an undefined array (e.g., `payslips.map(...)`). 
  3. Add optional chaining (`?.`) and fallback values/empty states in the JSX. Check the API response to ensure it's returning the expected data structure.

### Bug 2: Attendance Highlights Still Not Working
- **Description:** The previous issue regarding past attendance records (Present, Absent, Half-day) not being visually highlighted remains unresolved. 
- **Expected Behavior:** The UI should color-code the attendance states (e.g., Green for Present, Red for Absent).
- **Technical Context for Fix:** In the attendance component, ensure the conditional rendering for CSS classes exactly matches the string values returned by the backend API (e.g., checking for exactly `'PRESENT'` instead of `'Present'`, matching case-sensitivity).

### Bug 3: Deleted Items Still Appear in Low Stock Alerts
- **Description:** An item was deleted from the inventory, but it still shows up in the Dashboard's "Low Stock Alert" widget.
- **Expected Behavior:** Deleted items (items in the Recycle Bin) should be completely excluded from stock calculations and low stock alerts.
- **Technical Context for Fix:** In the backend `analytics.routes.js` or the controller that fetches low stock alerts, the database query is missing a filter. If the system uses soft deletes, add a condition like `where: { isDeleted: false }` (or `deletedAt: null`) to the Prisma query for low stock products.

### Bug 4: Total Revenue Does Not Update After High-Value Orders
- **Description:** An order for 2.5 Lakh was placed and successfully delivered, but the Total Revenue metric on the Dashboard remained unchanged.
- **Expected Behavior:** The Revenue metric should dynamically sum the `totalAmount` of all completed/delivered orders.
- **Technical Context for Fix:** 
  1. Check the backend analytics controller that calculates Revenue. 
  2. Verify the `WHERE` clause in the Prisma query. It might be looking for a status of `'PAID'` while the order was marked `'DELIVERED'`, or vice versa. 
  3. Ensure the data types are correct (e.g., if the sum exceeds standard integer limits or if decimal calculations are failing).

### Bug 5: Managers Can Self-Grant Attendance (RBAC Flaw)
- **Description:** A user with the Manager role is able to manually grant/mark their own attendance as "Present" from the administrative side.
- **Expected Behavior:** The authority to officially grant, modify, or approve attendance should be restricted strictly to the `SUPER_ADMIN`. Managers should not be able to override their own attendance records.
- **Technical Context for Fix:** 
  1. In the backend HR/Attendance routes, wrap the attendance update endpoint with a role check that ensures `req.user.role === 'SUPER_ADMIN'`.
  2. On the frontend, hide or disable the manual attendance override buttons for anyone who is not a `SUPER_ADMIN`.

### Bug 6: Payroll Actions (Warnings, Overtime, Incentives) Lack Role Restrictions
- **Description:** Features to issue payroll warnings, approve overtime, and grant incentives are currently accessible by non-admin roles (like Managers).
- **Expected Behavior:** Only the `SUPER_ADMIN` should have the authority to manage payroll warnings, overtime, and financial incentives.
- **Technical Context for Fix:** 
  1. **Backend:** Add strict role validation middleware to the routes handling `/overtime`, `/incentives`, and `/payroll-warnings` ensuring only `SUPER_ADMIN` can execute POST/PUT/DELETE requests.
  2. **Frontend:** Wrap the UI components (buttons, forms, and tabs) for Overtime, Incentives, and Warnings in a conditional render: `if (user.role === 'SUPER_ADMIN') { render component }`.
