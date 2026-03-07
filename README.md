# RodRig CRM

Sales pipeline CRM for AWT/RodRig. Manages companies, prospects, activities, and board reporting.

**Stack:** React 18 + TypeScript + Vite · Supabase (Postgres + Auth) · Tailwind CSS + shadcn/ui · Deployed on Vercel

---

## Local Setup

### Prerequisites

- [Bun](https://bun.sh) — used as the package manager (`curl -fsSL https://bun.sh/install | bash`)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) — for running the DB locally (`brew install supabase/tap/supabase`)
- [Docker](https://www.docker.com/products/docker-desktop/) — required by Supabase CLI to run Postgres locally

### 1. Clone and install

```sh
git clone <repo-url>
cd crm-rodrig-no
bun install
```

### 2. Environment variables

Create a `.env` file in the project root:

```sh
cp .env.example .env   # if it exists, otherwise create manually
```

Add the following variables:

```env
# Supabase (client-side)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Supabase (server-side — used by Vercel API routes only)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# API secret for the /api/invite endpoint
INVITE_SECRET=
```

**Option A — Use the hosted Supabase project (easiest):**

Get the values from the [Supabase dashboard](https://supabase.com/dashboard) under **Project Settings → API**:

- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `anon` public key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (keep this secret)

Set `SUPABASE_URL` to the same value as `VITE_SUPABASE_URL`.

**Option B — Run Supabase locally (fully offline):**

See [Local Supabase](#local-supabase-optional) section below.

### 3. Start the dev server

```sh
bun dev
```

Opens at [http://localhost:8080](http://localhost:8080).

### 4. Sign in

The app uses **magic link (OTP) login** — no passwords. Enter your email and click the link sent to you.

> When using the local Supabase setup, magic link emails are captured in the Inbucket inbox at [http://localhost:54324](http://localhost:54324) — no real email is sent.

---

## Local Supabase (optional)

Run a full local Supabase stack (Postgres + Auth + Storage) via Docker.

### Start local Supabase

```sh
supabase start
```

This spins up Postgres, Auth, and other services. On first run it downloads Docker images — takes a few minutes.

Once running, it prints your local credentials:

```yaml
API URL:      http://127.0.0.1:54321
anon key:     eyJ...
service_role: eyJ...
Studio:       http://127.0.0.1:54323
Inbucket:     http://127.0.0.1:54324
```

Use these values in your `.env`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

### Apply migrations

```sh
supabase db reset
```

This drops and recreates the local DB, then runs all migrations in `supabase/migrations/` in order. Run this any time migrations change.

### Useful local URLs

| Service | URL |
|---|---|
| App | http://localhost:8080 |
| Supabase Studio (DB browser) | http://127.0.0.1:54323 |
| Inbucket (catch-all email) | http://127.0.0.1:54324 |

### Stop local Supabase

```sh
supabase stop
```

---

## Giving a user admin access

New users are automatically created with `user` role. To grant admin access, run this in the Supabase SQL editor (Studio or dashboard):

```sql
-- Replace with the user's UUID (find it in auth.users)
INSERT INTO public.user_roles (user_id, role)
VALUES ('045a0dff-59a1-42dd-ad5a-d2fb185ab39f', 'owner')
ON CONFLICT (user_id) DO UPDATE
SET role = 'owner';
```

Admins can access: Dashboard, Companies, Call Mode, Forecast, Board Report.
Viewers (default) can only access: Dashboard, Board Report.

---

## Regenerating Supabase types

After modifying the DB schema, regenerate the TypeScript types:

```sh
# Against the hosted project
supabase gen types typescript --project-id cnbooshfhlkxfjrijcck > src/integrations/supabase/types.ts

# Against local Supabase
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## Other commands

```sh
bun dev             # Dev server on :8080
bun run build       # Production build
bun run preview     # Preview production build locally
bun run lint        # ESLint
bun test            # Run tests (Vitest)
bun test --watch    # Watch mode
```

---

## Deployment

The app is deployed on **Vercel**. Push to `main` triggers a deploy automatically.

Make sure all environment variables listed above are set in the Vercel project settings.

The `api/keepalive` route runs daily at 7 AM UTC via Vercel Cron to keep the Supabase instance from going idle.
