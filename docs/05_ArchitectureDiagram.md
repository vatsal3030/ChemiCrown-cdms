# Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend [React (Vite) SPA]
        UI[Tailwind + shadcn UI]
        Public[(Public Routes)]
        Dashboard[(Dashboard Routes)]
        API_Client[Axios / Fetch Client]
    end

    subgraph Backend [Express.js REST API]
        Router[Express Routers]
        Middleware[Auth & Validation]
        Controllers[Controllers & Services]
        Prisma[Prisma ORM]
    end

    subgraph Database [Supabase]
        Auth[Supabase Auth]
        Postgres[(PostgreSQL DB)]
        RLS[Row Level Security]
        Storage[Supabase Storage]
    end

    subgraph External [External Services]
        Email[Resend / Nodemailer]
    end

    UI --> Public
    UI --> Dashboard
    Public --> API_Client
    Dashboard --> API_Client

    API_Client <-->|HTTP REST| Router
    Router --> Middleware
    Middleware --> Controllers
    Controllers <--> Prisma
    Controllers -->|Uploads| Storage
    Controllers -->|Send Notifications| Email

    Prisma <--> Postgres
    UI -->|Login/Register| Auth
```
