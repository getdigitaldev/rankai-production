export default function RulesPage() {
  return (
    <div>
      <section className="hero" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="hero-eyebrow">Rules</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Simple, and permanent.</h1>
          <p className="hero-sub">
            Rank is a live sort by how much a link has paid, in total, ever. That&apos;s the whole
            mechanic.
          </p>
        </div>
      </section>
      <section className="how">
        <div className="wrap">
          <div className="board-title" style={{ marginBottom: 20 }}>
            How ranking works
          </div>
          <div className="how-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="how-card">
              <h4>Starting bids</h4>
              <p>A new link joins the board at $5 minimum. Whole-dollar bids only.</p>
            </div>
            <div className="how-card">
              <h4>Topping up</h4>
              <p>Already listed? Add $1 or more to your running total at any time to move up.</p>
            </div>
            <div className="how-card">
              <h4>Nothing expires</h4>
              <p>A listing is on the board for good. There is no time window and no renewal.</p>
            </div>
            <div className="how-card">
              <h4>Getting passed</h4>
              <p>If someone pays more, you drop one place. Your listing stays visible — it does not disappear.</p>
            </div>
          </div>

          <div className="board-title" style={{ margin: "40px 0 20px" }}>
            Payments
          </div>
          <div className="how-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="how-card">
              <h4>Charged immediately</h4>
              <p>Bids are captured via Stripe when checkout completes. Your total updates automatically.</p>
            </div>
            <div className="how-card">
              <h4>Never refunded</h4>
              <p>No refunds, ever, for any reason, including being passed on the board. Every dollar paid is permanent.</p>
            </div>
            <div className="how-card">
              <h4>Not eligible</h4>
              <p>Direct chat/invite links, adult content, and links with no working destination will be removed.</p>
            </div>
            <div className="how-card">
              <h4>Moderation</h4>
              <p>Listings that violate these rules can be hidden from the board at any time.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
