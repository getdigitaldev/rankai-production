import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL));
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { clicks: { increment: 1 } },
  });

  let destination = listing.url;
  try {
    new URL(destination);
  } catch {
    destination = `https://${destination}`;
  }

  return NextResponse.redirect(destination);
}
