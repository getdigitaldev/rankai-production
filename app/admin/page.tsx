import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [activeListings, totalUsers, pendingListings, revenue] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.listing.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.payment.aggregate({ _sum: { amountCents: true } }),
  ]);

  return (
    <div>
      <div className="dash-header">
        <h2>Overview</h2>
      </div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="num">{activeListings}</div>
          <div className="label">Active listings</div>
        </div>
        <div className="stat-card">
          <div className="num">{pendingListings}</div>
          <div className="label">Pending payment</div>
        </div>
        <div className="stat-card">
          <div className="num">{totalUsers}</div>
          <div className="label">Registered users</div>
        </div>
        <div className="stat-card">
          <div className="num">{formatUsd(revenue._sum.amountCents || 0)}</div>
          <div className="label">Total revenue collected</div>
        </div>
      </div>
    </div>
  );
}
