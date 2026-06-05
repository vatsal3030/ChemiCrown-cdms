# Risk Register

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| R01 | Scope Creep (adding payments, logistics tracking) | High | High | Stick strictly to the approved MVP phase. Push nice-to-haves to Phase 2. |
| R02 | Team Collaboration Issues (Git conflicts) | Medium | Medium | Strict adherence to feature branches. Intern 1 reviews all PRs before merging to `develop`. |
| R03 | Data Loss / Corrupt Database | Low | High | Utilize Supabase daily automated backups. Use soft deletes (`isActive: false`) instead of hard deletes. |
| R04 | Security Vulnerabilities (XSS, Injection) | Low | High | Enforce Zod validation on all API endpoints. Use Prisma to prevent SQL injection. Next.js handles basic XSS. |
