export default function AboutPage() {
  return (
    <div>
      <section className="hero" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="hero-eyebrow">About</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>A leaderboard, not a listing.</h1>
          <p className="hero-sub">
            Most directories charge a flat fee and sort by date. This one sorts by money, live,
            forever. A bid buys a rank, not a rental — and it stays visible even after someone pays
            more than you.
          </p>
        </div>
      </section>
      <section className="how">
        <div className="wrap">
          <div className="board-title" style={{ marginBottom: 20 }}>
            What&apos;s different here
          </div>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>No accounts, no login</h4>
              <p>Submit a link, pay, done. Anyone can top up any listing&apos;s total at any time.</p>
            </div>
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>Permanent, not rented</h4>
              <p>A listing never expires. Getting passed drops your rank, it doesn&apos;t remove you.</p>
            </div>
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>Clicks are counted, not claimed</h4>
              <p>Every listing shows a real, server-tracked click count.</p>
            </div>
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>Real payments, real commitment</h4>
              <p>Every bid is a real Stripe charge, and it&apos;s never refunded.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
