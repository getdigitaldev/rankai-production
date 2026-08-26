import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  description: z.string().min(1).max(300),
  categoryId: z.string().min(1),
  bidAmountCents: z.number().int().positive(),
  targetId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in to bid." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, url, description, categoryId, bidAmountCents, targetId } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  let targetListing = null;
  if (targetId) {
    targetListing = await prisma.listing.findUnique({ where: { id: targetId } });
    if (!targetListing || targetListing.status !== "ACTIVE") {
      return NextResponse.json({ error: "That listing is no longer active." }, { status: 409 });
    }
    if (bidAmountCents <= targetListing.bidAmountCents) {
      return NextResponse.json(
        { error: `Bid must be higher than $${(targetListing.bidAmountCents / 100).toFixed(0)}.` },
        { status: 400 }
      );
    }
    if (targetListing.categoryId !== categoryId) {
      return NextResponse.json({ error: "Category must match the listing being outbid." }, { status: 400 });
    }
  } else if (bidAmountCents < 500) {
    return NextResponse.json({ error: "Starting bid must be at least $5." }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      name,
      url,
      description,
      categoryId,
      bidAmountCents,
      ownerId: session.user.id,
      status: "PENDING_PAYMENT",
      replacedListingId: targetListing?.id,
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: bidAmountCents,
          product_data: {
            name: targetListing
              ? `RankAI outbid: ${name} (${category.label})`
              : `RankAI listing: ${name} (${category.label})`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { listingId: listing.id },
    customer_email: session.user.email ?? undefined,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/new?cancelled=1`,
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
