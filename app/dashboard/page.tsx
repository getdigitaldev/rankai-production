import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatUsd, timeAgoLabel, timeLeftLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-active",
  PENDING_PAYMENT: "badge-pending",
  EXPIRED: "badge-expired",
  OUTBID: "badge-outbid",
  CANCELLED: "badge-cancelled",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const listings = await prisma.listing.findMany({
    where: { ownerId: session.user.id },
    include: { category: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const totalSpentCents = listings
    .flatMap((l) => l.payments)
    .reduce((sum, p) => sum + p.amountCents, 0);
  const totalClicks = listings.reduce((sum, l) => sum + l.clicks, 0);

  return (
    <div>
      <div className="dash-header">
        <h2>My listings</h2>
        <Link href="/dashboard/new" className="btn btn-primary">
          + New listing
        </Link>
      </div>

      {success && (
        <div className="form-error" style={{ background: "#dff3e4", borderColor: "#1f9d55", color: "#1f9d55" }}>
          Payment received. Your listing will go live within a few seconds once Stripe confirms the
          payment — refresh if it still shows Pending.
        </div>
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="num">{activeCount}</div>
          <div className="label">Active listings</div>
        </div>
        <div className="stat-card">
          <div className="num">{totalClicks.toLocaleString()}</div>
          <div className="label">Total clicks</div>
        </div>
        <div className="stat-card">
          <div className="num">{formatUsd(totalSpentCents)}</div>
          <div className="label">Total spent</div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          You haven&apos;t listed anything yet. <Link href="/dashboard/new">Create your first listing →</Link>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Bid</th>
                <th>Status</th>
                <th>Clicks</th>
                <th>Claimed</th>
                <th>Time left</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const tl = timeLeftLabel(l.expiresAt);
                return (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.category.label}</td>
                    <td>{formatUsd(l.bidAmountCents)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[l.status]}`}>{l.status.replace("_", " ")}</span>
                    </td>
                    <td>{l.clicks.toLocaleString()}</td>
                    <td>{l.claimedAt ? timeAgoLabel(l.claimedAt) : "—"}</td>
                    <td>{l.status === "ACTIVE" ? tl.text : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
