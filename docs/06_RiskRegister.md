# Risk Register

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **R01** | Scope Creep (Logistics APIs, complex integrations) | High | High | Implement strict Phase 1 MVP milestones. Move advanced features to subsequent sprint backlogs. |
| **R02** | Concurrency conflicts in code development | Medium | Medium | Maintain feature branches. Lead developer conducts pull request code reviews before merging. |
| **R03** | Production Database Connection Pool Exhaustion | Medium | High | Configured localhost database routes to bypass transaction poolers. Registered signal handlers (`SIGINT`, `SIGTERM`, `SIGUSR2`) to trigger `prisma.$disconnect()`. |
| **R04** | Security Vulnerabilities (XSS, SQL Injection) | Low | High | Use Zod schemas for input validation. Prisma ORM prevents SQL injection via parameterized queries. React's virtual DOM sanitizes inputs to prevent XSS. |
| **R05** | Production Email Delivery Failures (Sandbox restrictions) | Low | High | Migrated from Resend sandbox address (`onboarding@resend.dev`) to a verified custom domain (`noreply@chemicrown.site`). |
| **R06** | Rate-limiting validation crashes under proxy load | Low | Medium | Configured Express backend with `app.set('trust proxy', 1)` to correctly read `X-Forwarded-For` load balancer headers. |
