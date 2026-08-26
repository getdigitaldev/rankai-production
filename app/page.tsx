import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUsd, timeAgoLabel, timeLeftLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const activeCat = (await searchParams).cat || "all";

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(activeCat !== "all" ? { category: { slug: activeCat } } : {}),
    },
    include: { category: true },
    orderBy: { bidAmountCents: "desc" },
  });

  const counts: Record<string, number> = { all: listings.length === 0 ? 0 : 0 };
  const allActiveListings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: { categoryId: true, category: { select: { slug: true } } },
  });
  counts.all = allActiveListings.length;
  for (const c of categories) {
    counts[c.slug] = allActiveListings.filter((l) => l.category.slug === c.slug).length;
  }

  const totalPoolCents = allActiveListings.length
    ? (await prisma.listing.aggregate({ where: { status: "ACTIVE" }, _sum: { bidAmountCents: true } }))._sum
        .bidAmountCents || 0
    : 0;

  const currentLabel = activeCat === "all" ? "All categories" : categories.find((c) => c.slug === activeCat)?.label;

  return (
    <div>
      <section className="hero">
        <div className="wrap">
          <div className="hero-eyebrow">Live — real bids, real Stripe checkout</div>
          <h1>
            Outbid your category. <em>Not the internet.</em>
          </h1>
          <p className="hero-sub">
            A visibility exchange built only for AI tools. No crypto, no peptides, no noise, just
            AI products bidding for a time-bound spot in front of people actually shopping for AI
            tools.
          </p>
          <div className="hero-stats">
            <div className="stat-block">
              <div className="stat-num">{counts.all}</div>
              <div className="stat-label">Live listings</div>
            </div>
            <div className="stat-block">
              <div className="stat-num">{categories.length}</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-block">
              <div className="stat-num">{formatUsd(totalPoolCents)}</div>
              <div className="stat-label">Total bid volume</div>
            </div>
          </div>
        </div>
      </section>

      <div className="cat-bar wrap">
        <Link href="/" className={`cat-tab ${activeCat === "all" ? "active" : ""}`}>
          All <span className="cat-count">{counts.all}</span>
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?cat=${c.slug}`}
            className={`cat-tab ${activeCat === c.slug ? "active" : ""}`}
          >
            {c.label} <span className="cat-count">{counts[c.slug] || 0}</span>
          </Link>
        ))}
      </div>

      <section className="board">
        <div className="wrap">
          <div className="board-head">
            <div className="board-title">{currentLabel}</div>
            <div className="board-note">Ranks reset every 24h · time-bound bidding</div>
          </div>

          {listings.length === 0 ? (
            <div className="empty-state">
              No listings in this category yet. Be the first to claim #1 — starting bid $5.
            </div>
          ) : (
            listings.map((l, idx) => {
              const rank = idx + 1;
              const tl = timeLeftLabel(l.expiresAt);
              return (
                <div className="row" key={l.id}>
                  <div className={`rank-num ${rank <= 3 ? "top" : ""}`}>{rank}</div>
                  <div>
                    <div className="entry-name">
                      <a href={`/api/click/${l.id}`} target="_blank" rel="noopener">
                        {l.name}
                      </a>
                    </div>
                    <div className="entry-desc">{l.description}</div>
                    <div className="entry-meta">
                      <span>{l.clicks.toLocaleString()} clicks</span>
                      <span>{timeAgoLabel(l.claimedAt ?? l.createdAt)}</span>
                      <span>{l.category.label}</span>
                    </div>
                  </div>
                  <div className="col-bid">{formatUsd(l.bidAmountCents)}</div>
                  <div className={`col-time ${tl.urgent ? "urgent" : ""}`}>{tl.text}</div>
                  <Link href={`/dashboard/new?targetId=${l.id}`} className="outbid-btn">
                    Outbid →
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="how">
        <div className="wrap">
          <div className="board-title">How the exchange works</div>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-num">01</div>
              <h4>Pick a category</h4>
              <p>List under the AI sub-sector that actually matches your product.</p>
            </div>
            <div className="how-card">
              <div className="how-num">02</div>
              <h4>Bid for a rank</h4>
              <p>Outbid the current holder of any position, or open a fresh one starting at $5.</p>
            </div>
            <div className="how-card">
              <div className="how-num">03</div>
              <h4>Hold it for 24 hours</h4>
              <p>Your bid guarantees the spot for a fixed window via a real Stripe payment.</p>
            </div>
            <div className="how-card">
              <div className="how-num">04</div>
              <h4>Track real clicks</h4>
              <p>Every listing shows verified, server-tracked click counts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
