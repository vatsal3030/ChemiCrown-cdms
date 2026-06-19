# Meeting Notes & Decisions

## Week 1 - Project Kickoff
**Date:** 2026-06-04
**Attendees:** Intern 1 (Lead), Intern 2, Intern 3
**Topics Discussed:**
- ChemiCrown business model (buying wholesale, distributing locally).
- Review of Product Catalog (GP Thinner, MTO, etc.).
- Approval of Next.js 15 + Supabase tech stack.
- Review of Data Schema (Added Units, Soft Deletes, Audit Trails, Attachments).
- "Docs-First" strategy approved by team.

**Action Items:**
- Intern 1: Initialize Git Repo, Next.js project, and push Prisma schema.
- Intern 2: Begin wireframing Public Website using Tailwind components.
- Intern 3: Map out Dashboard Data Table requirements for Inventory.

---

## Week 2 - Sprint: ERP Layout Spacing, Positive Calculations & Profile Editing
**Date:** 2026-06-19
**Attendees:** Intern 1 (Lead), AI Pair Programming Assistant
**Topics Discussed:**
- **Positive Payroll Calculations**: Shifted working days calculations from negative subtraction of absent days to positive accumulation of actual days marked present, half days, paid leaves, holidays, and Sundays in `payroll.controller.js` and `hr.controller.js`.
- **Widescreen Density Layouts**: Standardized details pages (`EmployeeDetails.jsx`, `PayrollDetails.jsx`, `OrderDetails.jsx`) to `max-w-[1600px] px-4 md:px-8` to eliminate side space wastage.
- **Dynamic Skeletons**: Standardized HR tab skeletons to match column counts and headers dynamically.
- **Self-Service & Admin Edit Profile**: Integrated user profile editing options for name, phone, role, department, job title, and payroll variables in `EmployeeDetails.jsx`.
- **Dark Mode synchronization**: Unified dark mode settings across internal dashboards and the public landing page layout.

**Action Items:**
- Lead & Assistant: Refactored payroll calculations, implemented the profile editing UI, and fixed vite build errors on the frontend.

