# Pivot to an outbid.lol clone — design spec

Date: 2026-08-26
Status: Approved

## Context

The project (rankai-production) launched as an "AI tools only" pay-to-rank
directory: fixed categories, 24h time-bound listing slots, user accounts
(NextAuth + bcrypt), a per-user dashboard, and an admin panel that can
cancel/refund a listing.

The product direction has changed: build a close functional clone of
outbid.lol — a single public leaderboard where anyone submits a URL, pays to
rank, and the listing never expires or gets refunded. Getting outbid just
means dropping a place. Money paid is a permanent, public, sunk cost — that
mechanic is the growth engine (a dollar auction), not an incidental detail.

This also removes the AI-tool niche framing; the product is domain-agnostic.

## Decisions

Confirmed via brainstorming with the project owner:

1. **Permanence.** Listings never expire, are never refunded. Rank is a live
   sort by total paid, not a status flag. This replaces the current
   `PENDING_PAYMENT → ACTIVE → OUTBID/EXPIRED/CANCELLED` lifecycle entirely.
2. **Cumulative re-bidding.** Re-bidding on an already-listed URL adds to
   that same listing's running total (one row per URL), not a new row. Rank
   emerges from `totalPaidCents`.
3. **Fully anonymous.** No concept of listing ownership. Anyone can add to
   any listing's total. Submission fields (name/description) are locked
   after creation — only the paid total changes on re-bid.
4. **No public accounts.** No registration, login, or per-user dashboard for
   end users.
5. **Free-form bidding.** One form everywhere: URL + amount. New URL floor
   is $5; topping up an existing URL floor is $1. No "beat this specific
   row by $1" targeting logic anywhere.
6. **Admin stays, simplified.** A single admin login gates `/admin` for
   moderation (hide a spam listing). No `User` table — one
   `ADMIN_PASSWORD` env var plus a signed cookie.
7. **Categories removed entirely.** Single global board, not niched by
   category.
8. **Dev database reset is acceptable.** No production data exists yet;
   this spec does not include a data migration path from the old schema.

## Data model

Replaces `prisma/schema.prisma` in full. Drops `User`, `Category`, `Role`,
`ListingStatus`. `Listing` and `Payment` are the only models.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Listing {
  id             String   @id @default(cuid())
  url            String   @unique
  name           String
  description    String?
  totalPaidCents Int      @default(0)
  clicks         Int      @default(0)
  hidden         Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  payments       Payment[]

  @@index([totalPaidCents])
}

model Payment {
  id                    String   @id @default(cuid())
  amountCents           Int
  stripeSessionId       String   @unique
  stripePaymentIntentId String?
  createdAt             DateTime @default(now())

  listingId String
  listing   Listing @relation(fields: [listingId], references: [id])
}
```

`url` is the identity key. Normalization (lowercase host, strip trailing
slash, strip tracking query params such as `utm_*`, `ref`, `fbclid`) happens
once, in the module that owns bid submission (see below), so both a fresh
submission and a top-up resolve to the same row.

No row is ever written for an unpaid attempt — `Listing` and `Payment` rows
are created only from the Stripe webhook, once payment is confirmed. This is
what eliminates the old lifecycle: there is no "pending" or "cancelled"
state to model, because nothing incomplete is ever persisted.

## Bid submission module

A new deep module, `lib/listing-bid.ts`, owns the two operations that used
to be smeared across four route handlers:

- `prepareCheckout({ url, name, amountCents }): Promise<{ checkoutUrl: string }>`
  — normalizes the URL, looks up the existing listing (if any) to compute
  the floor ($5 new / $1 top-up), validates `amountCents` against it,
  creates the Stripe Checkout Session with `{ url, name, amountCents }` in
  metadata, returns the checkout URL. Throws a typed error for
  under-floor bids that the route handler turns into a 400.
- `confirmPayment(session: Stripe.Checkout.Session): Promise<Listing>` —
  called only from the webhook handler after verifying the Stripe
  signature. Reads metadata, upserts the `Listing` (create with
  `totalPaidCents = amount`, or `increment`), creates the `Payment` row.
  Wrapped in a `prisma.$transaction` so the upsert and payment insert are
  atomic — this is what closes the double-promotion race the architecture
  review flagged in the old design (the operation that used to be spread
  across `listings/route.ts` and `stripe/webhook/route.ts` is now one
  atomic unit behind one seam).

`app/api/listings/route.ts` becomes a thin adapter: parse the request body,
call `prepareCheckout`, return its result as JSON. `app/api/stripe/webhook/route.ts`
becomes: verify signature, call `confirmPayment`. Both routes are thin by
design — the module is where the interesting behavior (floor calculation,
normalization, atomicity) lives, which is the deep-module shape: small
interface, two call sites, one place to test.

## Admin auth module

Replaces `lib/auth.ts` (NextAuth + bcrypt + `User` lookup) with
`lib/admin-auth.ts`:

- `verifyAdminPassword(password: string): boolean` — constant-time compare
  against `process.env.ADMIN_PASSWORD`.
- `createAdminSessionCookie(): { name, value, options }` — HMAC-signs a
  fixed payload (`"admin"` + timestamp) with `process.env.ADMIN_SESSION_SECRET`.
- `verifyAdminSessionCookie(cookieValue: string | undefined): boolean` —
  verifies the HMAC and an expiry window.

`app/api/admin/login/route.ts` (new) calls `verifyAdminPassword`, sets the
cookie via `createAdminSessionCookie`. `proxy.ts` (currently NextAuth's
`withAuth` middleware, matcher `["/dashboard/:path*", "/admin/:path*"]`)
becomes a plain middleware: matcher `["/admin/:path*"]`, reads the cookie,
calls `verifyAdminSessionCookie`, redirects to `/admin/login` on failure.
`app/admin/layout.tsx` keeps a server-side re-check calling the same
`verifyAdminSessionCookie` helper (defense in depth against a matcher
misconfiguration) — same helper as the middleware, one seam, checked twice.

## Pages and routes

**Delete:**
- `app/login/`, `app/register/`
- `app/dashboard/` (entire subtree, including `NewListingForm.tsx`)
- `app/admin/categories/`, `app/admin/users/`
- `app/api/register/`, `app/api/auth/[...nextauth]/`, `app/api/cron/expire/`
- `types/next-auth.d.ts`

**Rewrite:**
- `app/page.tsx` — drop category tabs, category counts, AI-specific hero
  copy, the "time left" column. Single board: `listing.findMany({ where: { hidden: false }, orderBy: { totalPaidCents: 'desc' } })`. Inline submit-bid form at the top of the page (URL + amount), replacing the separate `/dashboard/new` flow and the per-row `Outbid →` deep link.
- `app/api/listings/route.ts` — thin adapter over `prepareCheckout` (see above).
- `app/api/stripe/webhook/route.ts` — thin adapter over `confirmPayment`.
- `app/admin/listings/page.tsx` + `ListingsTable.tsx` — moderation action
  becomes toggle `hidden` instead of cancel/refund/expire. Drop the Stripe
  refund call entirely (there's nothing to refund).
- `app/admin/layout.tsx` — cookie check instead of `getServerSession`.
- `app/admin/page.tsx` — drop any user-count/category-count stats tied to
  removed models.
- `app/rules/page.tsx`, `app/about/page.tsx` — rewritten copy: no AI-tool
  framing; state the real mechanic (permanent, cumulative, never refunded,
  outbid = drop in rank not disappear).
- `app/components/Header.tsx` — drop user login/register/dashboard links.
  No admin link in the public header; `/admin` is reachable by URL only.
- `app/components/HeaderAuthLinks.tsx` — deleted (no public auth state left
  to render).
- `proxy.ts` — see admin auth module above.

**Keep as-is:**
- `app/api/click/[id]/route.ts`
- `lib/format.ts`, `lib/prisma.ts`, `lib/stripe.ts`

**New:**
- `lib/listing-bid.ts`, `lib/admin-auth.ts` (see above)
- `app/admin/login/page.tsx`, `app/api/admin/login/route.ts`

## Dependencies

Remove: `next-auth`, `bcryptjs`, `@types/bcryptjs`.
No new dependencies required — cookie signing uses Node's built-in `crypto`.

## Environment variables

Remove: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
Add: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
Unchanged: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL`.

## Rollout

No production data exists. `prisma/migrations/` gets reset (delete the
existing migration, `prisma migrate dev` generates a fresh one against the
new schema) rather than writing a migration path from the old model.
`prisma/seed.ts` is rewritten to seed a couple of example listings with a
`totalPaidCents` instead of categories/users.

## Out of scope (deferred)

- Real-time board updates (websocket/polling) — nice-to-have virality
  booster, not required to prove the mechanic.
- Polar as merchant-of-record — Stripe is already integrated and sufficient
  to launch on.
- Any moderation beyond a single `hidden` boolean (e.g. a queue, reasons,
  audit log).
