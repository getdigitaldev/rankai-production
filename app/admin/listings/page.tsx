import { prisma } from "@/lib/prisma";
import ListingsTable from "./ListingsTable";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    include: { category: true, owner: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="dash-header">
        <h2>Listings</h2>
      </div>
      <ListingsTable
        listings={listings.map((l) => ({
          id: l.id,
          name: l.name,
          ownerEmail: l.owner.email,
          category: l.category.label,
          bidAmountCents: l.bidAmountCents,
          status: l.status,
          clicks: l.clicks,
        }))}
      />
    </div>
  );
}
