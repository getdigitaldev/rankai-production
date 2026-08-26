import { prisma } from "@/lib/prisma";
import ListingsTable from "./ListingsTable";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { totalPaidCents: "desc" },
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
          url: l.url,
          totalPaidCents: l.totalPaidCents,
          clicks: l.clicks,
          hidden: l.hidden,
        }))}
      />
    </div>
  );
}
