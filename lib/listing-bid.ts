import type Stripe from "stripe";

const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAM_NAMES = new Set(["ref", "fbclid", "gclid"]);

const NEW_LISTING_FLOOR_CENTS = 500;
const TOP_UP_FLOOR_CENTS = 100;

export class BidTooLowError extends Error {
  constructor(public readonly floorCents: number) {
    super(`Bid must be at least $${(floorCents / 100).toFixed(0)}.`);
    this.name = "BidTooLowError";
  }
}

export function normalizeListingUrl(rawUrl: string): string {
  const withScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const parsed = new URL(withScheme);

  parsed.hostname = parsed.hostname.toLowerCase();

  for (const key of [...parsed.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (TRACKING_PARAM_NAMES.has(lower) || TRACKING_PARAM_PREFIXES.some((p) => lower.startsWith(p))) {
      parsed.searchParams.delete(key);
    }
  }

  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const search = parsed.searchParams.toString();
  return `${parsed.protocol}//${parsed.host}${pathname}${search ? `?${search}` : ""}`;
}

export function computeBidFloorCents(existingTotalPaidCents: number | null): number {
  return existingTotalPaidCents === null ? NEW_LISTING_FLOOR_CENTS : TOP_UP_FLOOR_CENTS;
}

type ListingLookup = {
  listing: {
    findUnique: (args: { where: { url: string } }) => Promise<{ totalPaidCents: number } | null>;
  };
};

type CheckoutCreator = {
  checkout: {
    sessions: {
      create: (
        args: Stripe.Checkout.SessionCreateParams,
      ) => Promise<Pick<Stripe.Checkout.Session, "url">>;
    };
  };
};

export async function prepareCheckout(
  deps: { prisma: ListingLookup; stripe: CheckoutCreator },
  input: { url: string; name: string; amountCents: number },
): Promise<{ checkoutUrl: string }> {
  const url = normalizeListingUrl(input.url);
  const existing = await deps.prisma.listing.findUnique({ where: { url } });
  const floorCents = computeBidFloorCents(existing ? existing.totalPaidCents : null);

  if (input.amountCents < floorCents) {
    throw new BidTooLowError(floorCents);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const session = await deps.stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Bid on ${input.name}` },
          unit_amount: input.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      url,
      name: input.name,
      amountCents: String(input.amountCents),
    },
    success_url: `${baseUrl}/?paid=1`,
    cancel_url: `${baseUrl}/?cancelled=1`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout url");
  }

  return { checkoutUrl: session.url };
}

type TransactionalListingUpsert = {
  $transaction: <T>(fn: (tx: TransactionClient) => Promise<T>) => Promise<T>;
};

type TransactionClient = {
  listing: {
    upsert: (args: {
      where: { url: string };
      create: { url: string; name: string; totalPaidCents: number };
      update: { totalPaidCents: { increment: number } };
    }) => Promise<{ id: string; url: string; totalPaidCents: number }>;
  };
  payment: {
    create: (args: {
      data: {
        amountCents: number;
        stripeSessionId: string;
        stripePaymentIntentId: string | null;
        listingId: string;
      };
    }) => Promise<unknown>;
  };
};

type CheckoutSessionLike = {
  id: string;
  payment_intent: string | null;
  metadata: { url: string; name: string; amountCents: string } | null;
};

function isDuplicateStripeSessionError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002" &&
    "meta" in err &&
    !!(err as { meta?: { target?: unknown[] } }).meta?.target?.includes("stripeSessionId")
  );
}

export async function confirmPayment(
  deps: { prisma: TransactionalListingUpsert },
  session: CheckoutSessionLike,
): Promise<void> {
  const metadata = session.metadata;
  if (!metadata) throw new Error("Checkout session is missing listing metadata");

  const amountCents = Number(metadata.amountCents);

  try {
    await deps.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.upsert({
        where: { url: metadata.url },
        create: { url: metadata.url, name: metadata.name, totalPaidCents: amountCents },
        update: { totalPaidCents: { increment: amountCents } },
      });

      await tx.payment.create({
        data: {
          amountCents,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          listingId: listing.id,
        },
      });
    });
  } catch (err) {
    if (isDuplicateStripeSessionError(err)) return; // already processed this Stripe session
    throw err;
  }
}
