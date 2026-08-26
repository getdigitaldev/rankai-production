import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [listingCount, hiddenCount, revenue] = await Promise.all([
    prisma.listing.count({ where: { hidden: false } }),
    prisma.listing.count({ where: { hidden: true } }),
    prisma.payment.aggregate({ _sum: { amountCents: true } }),
  ]);

  return (
    <div>
      <div className="dash-header">
        <h2>Overview</h2>
      </div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="num">{listingCount}</div>
          <div className="label">Visible listings</div>
        </div>
        <div className="stat-card">
          <div className="num">{hiddenCount}</div>
          <div className="label">Hidden listings</div>
        </div>
        <div className="stat-card">
          <div className="num">{formatUsd(revenue._sum.amountCents || 0)}</div>
          <div className="label">Total paid</div>
        </div>
      </div>
    </div>
  );
}
