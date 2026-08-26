import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json();
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "expire") {
    await prisma.listing.update({ where: { id: listing.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    if (listing.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: listing.stripePaymentIntentId });
      } catch (err) {
        console.error("Refund failed", err);
        return NextResponse.json({ error: "Refund failed — check Stripe dashboard." }, { status: 500 });
      }
    }
    await prisma.listing.update({ where: { id: listing.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
