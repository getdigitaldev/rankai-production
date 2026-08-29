# RankAI — production build

Next.js 14 (App Router) + Prisma/Postgres + Stripe Checkout + NextAuth, implementing the
RankAI leaderboard prototype as a real, deployable app with user and admin dashboards.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **PostgreSQL** via **Prisma**
- **Stripe Checkout** for real payments (no card data touches this app's servers)
- **NextAuth** (email + password, JWT sessions, `USER`/`ADMIN` roles)
- Vercel Cron for 24h listing expiry

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string (local, Neon, Supabase, Railway...)
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `STRIPE_SECRET_KEY` — from your Stripe dashboard (test mode key to start)
   - `STRIPE_WEBHOOK_SECRET` — see below
   - `CRON_SECRET` — `openssl rand -base64 32`

3. Push the schema and seed categories + an admin user:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   The seed creates an admin at `admin@rankai.local` / `ChangeMe123!` (override with
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before seeding). **Change this
   password immediately in production.**

4. Forward Stripe webhooks to your local server (in a separate terminal):

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`.

5. Run the app:

   ```bash
   npm run dev
   ```

## How bidding actually works

- A logged-in user submits the listing form. This creates a `Listing` row with status
  `PENDING_PAYMENT` and a Stripe Checkout Session for the bid amount, then redirects the
  browser to Stripe's hosted checkout page.
- On successful payment, Stripe calls `POST /api/stripe/webhook`
  (`checkout.session.completed`). The webhook activates the listing (`ACTIVE`, 24h
  `expiresAt`), records a `Payment`, and — if this was an "outbid" — marks the previously
  active listing as `OUTBID`.
- The board (`/`) only ever renders `ACTIVE` listings, filtered by category and sorted by
  bid amount.
- `GET /api/click/[id]` increments the click counter and redirects to the tool's URL — this
  is the "verified clicks" link every listing uses instead of a raw `href`.
- `GET /api/cron/expire` (wired up in `vercel.json` to run hourly) flips any `ACTIVE`
  listing past its `expiresAt` to `EXPIRED`. Vercel Cron automatically sends
  `Authorization: Bearer $CRON_SECRET`, which the route checks.

## Deploying (Vercel)

1. Push this repo to GitHub and import it into Vercel.
2. Provision Postgres (Vercel Postgres, Neon, or Supabase) and set `DATABASE_URL`.
3. Set all the env vars from `.env.example` in the Vercel project settings. Set
   `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your real production domain.
4. Run migrations against the production database once, e.g. via `vercel env pull` +
   `npm run db:deploy` locally, or a one-off build step.
5. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://yourdomain.com/api/stripe/webhook` listening for `checkout.session.completed`,
   and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
6. Deploy. `vercel.json` already registers the hourly expiry cron.

## Known simplifications (call these out before scaling this for real money)

- **Race conditions on outbid**: two people can start checkout against the same target
  listing at nearly the same time; only whoever's webhook lands first wins the slot, and
  the second payment still succeeds and activates its own listing (it just won't replace
  anything, since the target is no longer `ACTIVE`). For a v2, add a stricter reservation
  step or reconcile this in the webhook with a compensating refund.
- **No email verification / password reset** — registration is instant, and there's no
  "forgot password" flow yet. Add a transactional email provider (Resend, Postmark) before
  relying on this in production.
- **Refunds** on admin cancel only run if a Stripe `payment_intent` exists on the listing.
- **Click counting** is a simple increment with no bot/fraud filtering.
- **Dependency versions**: pinned to Next.js 16.3.2 and Prisma 6.19.3, the current stable
  lines as of this writing, specifically to avoid the high-severity advisories that still
  affect Next 14/15 and older Prisma releases (`npm audit` should show 0 vulnerabilities in
  `@prisma/client`/runtime deps). One exception: `npm audit` flags `deepmerge-ts` via
  `prisma`'s own CLI config loader (`@prisma/config`) — this is a devDependency used only by
  the `prisma` command-line tool at build/migrate time, not by `@prisma/client` in the
  running app, so it isn't reachable by a request against the deployed server. No Prisma
  release currently fixes it upstream; re-check `npm audit` on your next dependency bump.
- Next.js 16 deprecated the `middleware` file convention in favor of `proxy` — this project
  already uses `proxy.ts` at the root. `package.json#prisma` (used for `db:seed`) is
  deprecated in favor of a `prisma.config.ts` file; it still works in Prisma 6.x today but
  will need migrating before a future Prisma 7 upgrade..
