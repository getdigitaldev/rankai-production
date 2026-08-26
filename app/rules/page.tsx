export default function RulesPage() {
  return (
    <div>
      <section className="hero" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="hero-eyebrow">Rules</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Simple, and enforced.</h1>
          <p className="hero-sub">
            A rank is earned by bid, and held for a fixed window. That&apos;s the whole mechanic.
            Everything below exists to keep the board fair, relevant, and free of clutter.
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
              <p>New listings start at $5. Whole-dollar bids only. A listing keeps its rank until it&apos;s outbid or its 24-hour window expires.</p>
            </div>
            <div className="how-card">
              <h4>Outbidding</h4>
              <p>Beat the current top bid on a listing by at least $1 to take that spot. Payment is captured immediately via Stripe.</p>
            </div>
            <div className="how-card">
              <h4>Time-bound holds</h4>
              <p>Every claimed rank is guaranteed for 24 hours from the moment payment is confirmed. When the window ends, the slot opens again.</p>
            </div>
            <div className="how-card">
              <h4>One product, one listing</h4>
              <p>Duplicate listings for the same product across categories are not allowed. Pick the category that actually fits.</p>
            </div>
          </div>

          <div className="board-title" style={{ margin: "40px 0 20px" }}>
            What can be listed
          </div>
          <div className="how-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="how-card">
              <h4>Eligible</h4>
              <p>Any live AI product, tool, or platform with a working URL. Pre-launch tools with a real waitlist or demo page are welcome.</p>
            </div>
            <div className="how-card">
              <h4>Not eligible</h4>
              <p>Chat or invite links, adult content, tools with no functioning product behind them, and listings unrelated to AI.</p>
            </div>
            <div className="how-card">
              <h4>Payments</h4>
              <p>Bids are charged immediately via Stripe when you submit. Bids are non-refundable once a listing goes live — see your dashboard for receipts.</p>
            </div>
            <div className="how-card">
              <h4>Moderation</h4>
              <p>RankAI may remove listings that violate these rules. Admins can deactivate a listing at any time; contact support for a review.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
