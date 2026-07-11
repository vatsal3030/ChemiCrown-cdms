# Meeting Notes & Key Decisions

## Week 1 - Project Kickoff & Initialization
**Date:** 2026-06-04
**Attendees:** Intern 1 (Lead), Intern 2, Intern 3
**Topics Discussed:**
- Analyzed ChemiCrown's industrial chemical wholesale distribution workflows.
- Map out catalog items (GP Thinner, Mineral Turpentine Oil, Acetone, etc.).
- Approved React + Vite frontend and Node.js + Express backend tech stack.
- Designed database schema (Categories, Products, Lots, Users, Employees, Customers, Orders, Payments, Ledgers, Notifications).
- Established a "docs-first" development strategy.

**Action Items:**
- Intern 1: Initialize Git repository, configure Node/Express boilerplate, and push Prisma PostgreSQL database schema.
- Intern 2: Build public website wireframes and layout structures.
- Intern 3: Map out inventory transaction tracking and batch lot logging requirements.

---

## Week 2 - Sprint: ERP Layout Spacing, Positive Wage Calculations & Profile Editing
**Date:** 2026-06-19
**Attendees:** Intern 1 (Lead), Intern 2, Intern 3
**Topics Discussed:**
- **Positive Payroll Calculations**: Shifted working days calculations from negative subtraction of absent days to positive accumulation of actual days marked present, half days, paid leaves, holidays, and Sundays.
- **Widescreen Layouts**: Standardized details pages (`EmployeeDetails.jsx`, `PayrollDetails.jsx`, `OrderDetails.jsx`) to `max-w-[1200px] px-4 md:px-8` to eliminate side space wastage on large screens.
- **Self-Service & Admin Edit Profile**: Integrated user profile editing options for name, phone, role, department, job title, and payroll variables in `EmployeeDetails.jsx`.
- **Dark Mode Synchronization**: Unified dark mode settings across internal dashboards and the public landing page layout.

**Action Items:**
- Core Team: Refactored payroll calculations, implemented the profile editing UI, and fixed initial Vite build compilation warnings.

---

## Week 3 - Sprint: Custom Dialog Modals & Interactive Cursor Physics
**Date:** 2026-06-26
**Attendees:** Intern 1 (Lead), Intern 2
**Topics Discussed:**
- **Custom Promise-Based DialogProvider**: Agreed to completely replace blocking native browser dialogues (`alert()`, `confirm()`, `prompt()`) with a custom React Context modal interface supporting dark mode styling and inline async resolutions (`await confirm(...)`).
- **Interactive Cursor Physics (ChemiCursor)**: Implemented physical laboratory flask mouse effects. Programmed mouse-shake scaling triggers that scale the flask cursor up to 4x, releasing colorful particle sprays and full-screen shockwaves upon eruption.
- **Background Pop Animations**: Configured floating background bubbles to pop dynamically with a springy CSS animation when clicked or hit by the flask's shockwave.

**Action Items:**
- Intern 1: Authored the `DialogContext` wrapper and integrated it across 18 pages.
- Intern 2: Coded the Canvas-based cursor recoil physics and SVG particle spray effects.

---

## Week 4 - Sprint: Settings Persistence, Table Standardization & Printing Modals
**Date:** 2026-07-03
**Attendees:** Intern 1 (Lead), Intern 3
**Topics Discussed:**
- **Notifications Persistence**: Saved user notification preferences to `localStorage` (scoped by user ID) and synchronized settings changes directly to the database.
- **Table Headers Standardization**: Cleaned up inconsistent column padding and font sizes across Orders and HR Management sub-tables, standardizing them to `px-6 py-3 bg-muted text-xs font-bold uppercase tracking-wider`.
- **Modals Printing Fix**: Updated Print GHS Label and CoA Generator modals to use standard `react-to-print` v3 hook options (`contentRef` instead of `content`), restoring printing capabilities.

**Action Items:**
- Intern 1: Standardized the CSS table headers and fixed print triggers.
- Intern 3: Configured Settings Context state persistence.

---

## Week 5 - Sprint: Salary Constraints Validation & Attendance Blocker
**Date:** 2026-07-06
**Attendees:** Intern 2, Intern 3
**Topics Discussed:**
- **Salary Constraints Validation**: Enforced annual CTC checks (`CTC >= Base Salary * 12`) and bounded PF rates between `0%` and `30%` on both client input forms and Express router middleware.
- **Before-Joining Attendance Lock**: Blocked administrators from registering attendance prior to an employee's official join date. Pre-joining cells dynamically render as grayed out and disabled.
- **Printable Disbursement Receipts**: Designed a printable company letterhead statement displayed upon individual payroll disbursals.

**Action Items:**
- Intern 2: Coded calendar cell disabled templates and joining date checks.
- Intern 3: Wrote backend CTC check middleware and designed receipt templates.

---

## Week 6 - Sprint: Custom Domain Mailing, Proxy Trust & Analytics
**Date:** 2026-07-10
**Attendees:** Core Team
**Topics Discussed:**
- **Custom Domain Mailing**: Migrated Resend configuration from sandbox sending to the verified corporate domain (`noreply@chemicrown.site`).
- **Transactional Notifications**: Enabled automated customer order invoice emails, status alerts, password reset confirmations, and employee login security alerts.
- **Redirection Fix for Multi-Account Switcher**: Configured URL parameter routing (`?add-account=true`) to bypass automatic dashboard redirects on authentication pages, permitting concurrent session additions.
- **Vercel Web Analytics**: Installed Vercel Analytics SDK to track client traffic and page views.
- **Express Proxy Trust Setting**: Fixed Render.com rate limiter crashes by configuring `app.set('trust proxy', 1)`.

**Action Items:**
- Core Team: Deployed backend and frontend updates to Render and Vercel, verifying compile integrity.
