# CRM Rodrig — Claude Instructions

## Project Overview

Sales pipeline CRM for AWT/RodRig, built with React 18 + TypeScript + Supabase. Deployed on Vercel.

## Tech Stack

- **Frontend:** React 18.2, TypeScript 5.8, Vite 5, React Router v6
- **State/Data:** TanStack React Query v5 (server state), React hooks (local state)
- **UI:** shadcn/ui (Radix UI primitives) + Tailwind CSS 3
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel (SPA + serverless functions in `api/`)
- **Package manager:** Bun (use `bun` instead of `npm`)

## Key File Locations

| What | Where |
|---|---|
| React entry | `src/main.tsx` |
| Root component + routing | `src/App.tsx` |
| Pages | `src/pages/` |
| Reusable components | `src/components/` |
| shadcn/ui primitives | `src/components/ui/` |
| Custom hooks (data + auth) | `src/hooks/` |
| Supabase client | `src/integrations/supabase/client.ts` |
| Auto-generated DB types | `src/integrations/supabase/types.ts` |
| Entity type definitions | `src/types/` |
| Serverless API routes | `api/` |
| DB migrations | `supabase/migrations/` |

## Architecture

### Authentication
- Magic link (OTP) only — no passwords
- `useAuth()` hook wraps Supabase auth state
- `useRole()` returns `admin` or `viewer`
- Token hash parsed in `main.tsx` for email confirmation

### Routing & Access Control
- React Router v6 with protected routes
- Admins: Dashboard, Companies, Call Mode, Forecast, Board Report
- Viewers: Dashboard and Board Report only
- Auth handled via `AuthCallback.tsx` at `/auth/callback`

### Data Fetching Pattern
- All server state via React Query with custom hooks
- Query keys: `['companies']`, `['companies', id]`, `['activities']`, `['activities', companyId]`
- Mutations invalidate relevant query keys on success
- Never fetch directly in components — use or create a hook in `src/hooks/`

### Database Schema (key tables)
- **profiles** — user info + role (admin/viewer)
- **companies** — pipeline stage, status, type, vessel info
- **activities** — call/email/meeting logs per company
- **prospects** — lightweight prospect tracking
- **board_snapshots** — cached KPI snapshots for board reports
- **contacts** — company contacts
- **user_preferences** — onboarding state per user

## Pipeline Stages
`New → Identified → Contacted → In Dialogue → Presented → Proposal → Won / Rejected`

## Dev Commands

```bash
bun dev          # Dev server on :8080
bun run build    # Production build
bun run lint     # ESLint
bun test         # Run tests (Vitest)
```

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
INVITE_SECRET
```

## Conventions

- Functional components + hooks only (no class components)
- Colocate logic in custom hooks, not pages
- All DB interactions go through Supabase client in `src/integrations/supabase/client.ts`
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind classes
- Toast notifications via Sonner (`import { toast } from 'sonner'`)
- Forms: React Hook Form + Zod schema validation
- Icons: Lucide React
- Date formatting: date-fns

## Gotchas

- React deduplication is enforced in `vite.config.ts` to prevent React #310 (double instance)
- `bun.lockb` is the canonical lockfile — do not generate `package-lock.json`
- Supabase types in `src/integrations/supabase/types.ts` are auto-generated — do not edit manually; regenerate with `supabase gen types`
- RLS is enabled on all tables — queries respect the authenticated user's role
