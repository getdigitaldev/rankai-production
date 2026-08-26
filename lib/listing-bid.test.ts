import { describe, expect, it, vi } from "vitest";
import {
  normalizeListingUrl,
  computeBidFloorCents,
  prepareCheckout,
  confirmPayment,
  BidTooLowError,
} from "./listing-bid";

describe("normalizeListingUrl", () => {
  it("lowercases the host", () => {
    expect(normalizeListingUrl("https://ExAmple.com/tool")).toBe("https://example.com/tool");
  });

  it("strips a trailing slash", () => {
    expect(normalizeListingUrl("https://example.com/tool/")).toBe("https://example.com/tool");
  });

  it("does not strip the root path slash", () => {
    expect(normalizeListingUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("strips tracking query params", () => {
    expect(
      normalizeListingUrl("https://example.com/tool?utm_source=x&utm_campaign=y&ref=z&fbclid=1&keep=me"),
    ).toBe("https://example.com/tool?keep=me");
  });

  it("drops an empty query string entirely", () => {
    expect(normalizeListingUrl("https://example.com/tool?utm_source=x")).toBe(
      "https://example.com/tool",
    );
  });

  it("adds https:// when the scheme is missing", () => {
    expect(normalizeListingUrl("example.com/tool")).toBe("https://example.com/tool");
  });

  it("throws on an unparseable url", () => {
    expect(() => normalizeListingUrl("not a url at all !!")).toThrow();
  });
});

describe("computeBidFloorCents", () => {
  it("is $5 for a brand-new url", () => {
    expect(computeBidFloorCents(null)).toBe(500);
  });

  it("is $1 to top up an existing listing, regardless of its current total", () => {
    expect(computeBidFloorCents(0)).toBe(100);
    expect(computeBidFloorCents(50_000)).toBe(100);
  });
});

function fakePrisma(existingListing: { url: string; totalPaidCents: number } | null) {
  return {
    listing: {
      findUnique: vi.fn(async () => existingListing),
    },
  };
}

function fakeStripe(checkoutUrl = "https://checkout.stripe.com/session/123") {
  return {
    checkout: {
      sessions: {
        create: vi.fn(async (_args: any) => ({ url: checkoutUrl })),
      },
    },
  };
}

describe("prepareCheckout", () => {
  it("rejects a bid below the $5 floor for a new url", async () => {
    const prisma = fakePrisma(null);
    const stripe = fakeStripe();
    await expect(
      prepareCheckout(
        { prisma: prisma as any, stripe: stripe as any },
        { url: "https://example.com", name: "Example", amountCents: 400 },
      ),
    ).rejects.toBeInstanceOf(BidTooLowError);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects a bid below the $1 top-up floor for an existing url", async () => {
    const prisma = fakePrisma({ url: "https://example.com", totalPaidCents: 900 });
    const stripe = fakeStripe();
    await expect(
      prepareCheckout(
        { prisma: prisma as any, stripe: stripe as any },
        { url: "https://example.com", name: "Example", amountCents: 50 },
      ),
    ).rejects.toBeInstanceOf(BidTooLowError);
  });

  it("creates a Stripe checkout session with normalized-url metadata and returns its url", async () => {
    const prisma = fakePrisma(null);
    const stripe = fakeStripe("https://checkout.stripe.com/session/abc");
    const result = await prepareCheckout(
      { prisma: prisma as any, stripe: stripe as any },
      { url: "https://ExAmple.com/tool/?utm_source=x", name: "Example", amountCents: 500 },
    );

    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/session/abc");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
    const call = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(call.metadata).toEqual({
      url: "https://example.com/tool",
      name: "Example",
      amountCents: "500",
    });
  });
});

class FakeUniqueConstraintError extends Error {
  code = "P2002";
  meta = { target: ["stripeSessionId"] };
}

function fakeTransactionalPrisma(initial: Map<string, { id: string; totalPaidCents: number }>) {
  const listings = new Map(initial);
  const payments: any[] = [];

  const tx = {
    listing: {
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const existing = listings.get(where.url);
        if (existing) {
          existing.totalPaidCents += update.totalPaidCents.increment;
          return existing;
        }
        const created = { id: `listing_${listings.size + 1}`, url: where.url, ...create };
        listings.set(where.url, created);
        return created;
      }),
    },
    payment: {
      create: vi.fn(async ({ data }: any) => {
        if (payments.some((p) => p.stripeSessionId === data.stripeSessionId)) {
          throw new FakeUniqueConstraintError("Unique constraint failed on stripeSessionId");
        }
        const created = { id: `payment_${payments.length + 1}`, ...data };
        payments.push(created);
        return created;
      }),
    },
  };

  return {
    listings,
    payments,
    prisma: {
      $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => {
        const snapshot = new Map([...listings].map(([k, v]) => [k, { ...v }]));
        try {
          return await fn(tx);
        } catch (err) {
          listings.clear();
          for (const [k, v] of snapshot) listings.set(k, v);
          throw err;
        }
      }),
    },
  };
}

describe("confirmPayment", () => {
  it("creates a new listing with the paid amount as its total when the url is new", async () => {
    const { prisma, listings, payments } = fakeTransactionalPrisma(new Map());
    const session = {
      id: "cs_123",
      payment_intent: "pi_123",
      metadata: { url: "https://example.com/tool", name: "Example", amountCents: "500" },
    };

    await confirmPayment({ prisma: prisma as any }, session as any);

    expect(listings.get("https://example.com/tool")?.totalPaidCents).toBe(500);
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      amountCents: 500,
      stripeSessionId: "cs_123",
      stripePaymentIntentId: "pi_123",
    });
  });

  it("increments an existing listing's total instead of overwriting it", async () => {
    const { prisma, listings } = fakeTransactionalPrisma(
      new Map([["https://example.com/tool", { id: "listing_1", totalPaidCents: 900 }]]),
    );
    const session = {
      id: "cs_456",
      payment_intent: "pi_456",
      metadata: { url: "https://example.com/tool", name: "Example", amountCents: "300" },
    };

    await confirmPayment({ prisma: prisma as any }, session as any);

    expect(listings.get("https://example.com/tool")?.totalPaidCents).toBe(1200);
  });

  it("runs inside a single transaction", async () => {
    const { prisma } = fakeTransactionalPrisma(new Map());
    const session = {
      id: "cs_789",
      payment_intent: "pi_789",
      metadata: { url: "https://example.com/tool", name: "Example", amountCents: "500" },
    };

    await confirmPayment({ prisma: prisma as any }, session as any);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: replaying the same Stripe session does not double-count", async () => {
    const { prisma, listings, payments } = fakeTransactionalPrisma(new Map());
    const session = {
      id: "cs_dup",
      payment_intent: "pi_dup",
      metadata: { url: "https://example.com/tool", name: "Example", amountCents: "500" },
    };

    await confirmPayment({ prisma: prisma as any }, session as any);
    await confirmPayment({ prisma: prisma as any }, session as any);

    expect(listings.get("https://example.com/tool")?.totalPaidCents).toBe(500);
    expect(payments).toHaveLength(1);
  });
});
