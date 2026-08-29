import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { avatarStyle, formatUsd, timeAgoLabel } from "@/lib/format";
import { parseBoardRange } from "@/lib/board";
import BidForm from "./components/BidForm";
import Favicon from "./components/Favicon";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type Row = {
  id: string;
  url: string;
  name: string;
  faviconUrl: string | null;
  clicks: number;
  createdAt: Date;
  totalPaidCents: number;
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range = parseBoardRange(rangeParam);

  const allListings = await prisma.listing.findMany({
    where: { hidden: false },
    orderBy: { totalPaidCents: "desc" },
  });
  const rankById = new Map(allListings.map((l, i) => [l.id, i + 1]));
  const byId = new Map(allListings.map((l) => [l.id, l]));

  const since = new Date(Date.now() - DAY_MS);
  const todayGrouped = await prisma.payment.groupBy({
    by: ["listingId"],
    where: { createdAt: { gte: since }, listing: { hidden: false } },
    _sum: { amountCents: true },
  });
  const todayRows: Row[] = todayGrouped
    .map((g): Row | null => {
      const listing = byId.get(g.listingId);
      if (!listing) return null;
      return {
        id: listing.id,
        url: listing.url,
        name: listing.name,
        faviconUrl: listing.faviconUrl,
        clicks: listing.clicks,
        createdAt: listing.createdAt,
        totalPaidCents: g._sum.amountCents ?? 0,
      };
    })
    .filter((row): row is Row => row !== null)
    .sort((a, b) => b.totalPaidCents - a.totalPaidCents);

  const boardRows: Row[] = range === "today" ? todayRows : allListings;
  const todayTop3 = todayRows.slice(0, 3);

  const latestPayments = await prisma.payment.findMany({
    where: { listing: { hidden: false } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { listing: true },
  });

  const totalPaidAllTimeCents = allListings.reduce((sum, l) => sum + l.totalPaidCents, 0);
  const topCents = boardRows[0]?.totalPaidCents ?? 0;
  const suggestedAmountCents = topCents > 0 ? topCents + 100 : 500;
  const floorCents = topCents > 0 ? 100 : 500;

  return (
    <div className="board-narrow">
      <div style={{ textAlign: "center", paddingTop: 28 }}>
        <span className="stat-pill">
          <span className="live-dot" />
          {allListings.length} listings · {formatUsd(totalPaidAllTimeCents)} total paid
        </span>
      </div>

      <BidForm suggestedAmountCents={suggestedAmountCents} floorCents={floorCents} />

      {boardRows.length === 0 ? (
        <div className="empty-state">
          No listings {range === "today" ? "today" : "yet"}. Be the first — starting bid $5.
        </div>
      ) : (
        <>
          <div className="side-strip">
            <div className="side-card">
              <div className="side-card-head">
                <div className="side-card-title">Today&apos;s top ranking</div>
                <Link href="/?range=today" className="side-card-link">
                  See all
                </Link>
              </div>
              {todayTop3.length === 0 ? (
                <div style={{ fontSize: 12.5, opacity: 0.5 }}>No bids yet today.</div>
              ) : (
                todayTop3.map((l, idx) => (
                  <Link href={`/api/click/${l.id}`} key={l.id} className="mini-item" target="_blank" rel="noopener">
                    <span className="mini-rank">#{idx + 1}</span>
                    <span className="mini-name">{l.name}</span>
                    <span className="mini-amt">{formatUsd(l.totalPaidCents)}</span>
                  </Link>
                ))
              )}
            </div>

            <div className="side-card">
              <div className="side-card-head">
                <div className="side-card-title">Latest activity</div>
              </div>
              {latestPayments.length === 0 ? (
                <div style={{ fontSize: 12.5, opacity: 0.5 }}>No activity yet.</div>
              ) : (
                latestPayments.map((p) => (
                  <Link href={`/api/click/${p.listing.id}`} key={p.id} className="mini-item" target="_blank" rel="noopener">
                    <span className="mini-name">{p.listing.name}</span>
                    <span className="mini-amt">#{rankById.get(p.listing.id)}</span>
                    <span className="mini-time">{timeAgoLabel(p.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="top-cards">
            {boardRows.slice(0, 3).map((l, idx) => {
              const avatar = avatarStyle(l.name);
              const claimAmountCents = l.totalPaidCents + 100;
              return (
                <div key={l.id} className="top-card">
                  <a href={`/api/click/${l.id}`} className="top-card-row" target="_blank" rel="noopener">
                    <Favicon src={l.faviconUrl} letter={avatar.letter} background={avatar.background} color={avatar.color} />
                    <div className="top-card-body">
                      <div className="top-card-head">
                        <span className="top-card-name">
                          #{idx + 1} {l.name}
                        </span>
                        <span className="top-card-amt">{formatUsd(l.totalPaidCents)}</span>
                      </div>
                      <div className="top-card-meta">
                        <span>{timeAgoLabel(l.createdAt)}</span>
                        <span>{l.clicks.toLocaleString()} clicks</span>
                      </div>
                    </div>
                  </a>
                  <Link
                    href={`/?url=${encodeURIComponent(l.url)}&amount=${Math.ceil(claimAmountCents / 100)}#bid`}
                    className="top-card-claim"
                  >
                    Pay {formatUsd(claimAmountCents)} to take #{idx + 1}
                  </Link>
                </div>
              );
            })}
          </div>

          {boardRows.length > 3 && (
          <div className="rows">
            {boardRows.slice(3).map((l, idx) => {
              const rank = idx + 4;
              const avatar = avatarStyle(l.name);
              const claimAmountCents = l.totalPaidCents + 100;
              return (
                <div className="row2" key={l.id}>
                  <div className="row2-rank">{rank}</div>
                  <Favicon src={l.faviconUrl} letter={avatar.letter} background={avatar.background} color={avatar.color} />
                  <div className="row2-body">
                    <a href={`/api/click/${l.id}`} className="row2-name" target="_blank" rel="noopener">
                      {l.name}
                    </a>
                    <div className="row2-meta">
                      <span>{timeAgoLabel(l.createdAt)}</span>
                      <span>{l.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                  <div className="row2-amt">{formatUsd(l.totalPaidCents)}</div>
                  <Link
                    href={`/?url=${encodeURIComponent(l.url)}&amount=${Math.ceil(claimAmountCents / 100)}#bid`}
                    className="claim-pill"
                  >
                    claim this rank for {formatUsd(claimAmountCents)}
                  </Link>
                </div>
              );
            })}
          </div>
          )}
        </>
      )}

      <section className="how" style={{ borderTop: "1px solid var(--line)", marginTop: 24 }}>
        <div className="board-title">How it works</div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <h4>Submit a link</h4>
            <p>Any URL. New listings start at $5.</p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <h4>Bid to rank</h4>
            <p>Rank is a live sort by total paid. Top up any time for at least $1 more.</p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <h4>Never expires</h4>
            <p>No time limit, no refunds. Getting passed just means one spot lower, not gone.</p>
          </div>
          <div className="how-card">
            <div className="how-num">04</div>
            <h4>Real clicks</h4>
            <p>Every listing shows a verified, server-tracked click count.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
