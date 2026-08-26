import { prisma } from "@/lib/prisma";
import { formatUsd, timeAgoLabel } from "@/lib/format";
import BidForm from "./components/BidForm";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const listings = await prisma.listing.findMany({
    where: { hidden: false },
    orderBy: { totalPaidCents: "desc" },
  });

  const totalPaidCents = listings.reduce((sum, l) => sum + l.totalPaidCents, 0);

  return (
    <div>
      <section className="hero">
        <div className="wrap">
          <div className="hero-eyebrow">Live — real bids, real Stripe checkout</div>
          <h1>
            Pay to rank. <em>Nothing else decides.</em>
          </h1>
          <p className="hero-sub">
            Submit a link, bid an amount, take a spot. Getting outbid just drops you a place — your
            listing stays up and nothing is refunded. Every dollar paid stays on the board, forever.
          </p>
          <div className="hero-stats">
            <div className="stat-block">
              <div className="stat-num">{listings.length}</div>
              <div className="stat-label">Listings</div>
            </div>
            <div className="stat-block">
              <div className="stat-num">{formatUsd(totalPaidCents)}</div>
              <div className="stat-label">Total paid</div>
            </div>
            <div className="stat-block">
              <div className="stat-num">{listings[0] ? formatUsd(listings[0].totalPaidCents) : "$0"}</div>
              <div className="stat-label">Current #1</div>
            </div>
          </div>
        </div>
      </section>

      <section className="board">
        <div className="wrap">
          <BidForm />
        </div>
      </section>

      <section className="board">
        <div className="wrap">
          <div className="board-head">
            <div className="board-title">The board</div>
            <div className="board-note">Sorted by total paid · permanent · never refunded</div>
          </div>

          {listings.length === 0 ? (
            <div className="empty-state">No listings yet. Be the first — starting bid $5.</div>
          ) : (
            listings.map((l, idx) => {
              const rank = idx + 1;
              return (
                <div className="row" key={l.id}>
                  <div className={`rank-num ${rank <= 3 ? "top" : ""}`}>{rank}</div>
                  <div>
                    <div className="entry-name">
                      <a href={`/api/click/${l.id}`} target="_blank" rel="noopener">
                        {l.name}
                      </a>
                    </div>
                    <div className="entry-meta">
                      <span>{l.clicks.toLocaleString()} clicks</span>
                      <span>{timeAgoLabel(l.createdAt)}</span>
                    </div>
                  </div>
                  <div className="col-bid">{formatUsd(l.totalPaidCents)}</div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="how">
        <div className="wrap">
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
              <p>No time limit, no refunds. Outbid just means one spot lower, not gone.</p>
            </div>
            <div className="how-card">
              <div className="how-num">04</div>
              <h4>Real clicks</h4>
              <p>Every listing shows a verified, server-tracked click count.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
