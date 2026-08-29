import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { prepareCheckout, BidTooLowError } from "@/lib/listing-bid";
import { fetchLinkPreview } from "@/lib/link-preview";

const schema = z.object({
  url: z.string().min(1).max(2000),
  amountCents: z.number().int().positive(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await prepareCheckout(
      { prisma, stripe, fetchPreview: fetchLinkPreview },
      { url: parsed.data.url, amountCents: parsed.data.amountCents },
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BidTooLowError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof TypeError) {
      return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }
    throw err;
  }
}
