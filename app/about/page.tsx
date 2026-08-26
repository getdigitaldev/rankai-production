export default function AboutPage() {
  return (
    <div>
      <section className="hero" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="hero-eyebrow">About</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Why a leaderboard just for AI tools.</h1>
          <p className="hero-sub">
            AI product marketing has gotten expensive fast. Paid CAC keeps climbing, every
            category is crowded, and most founders are stuck bidding against unrelated companies
            for the same eyeballs. RankAI narrows that down to one thing: a bid buys a fixed,
            time-bound spot in front of people already looking for AI tools, inside the category
            that actually fits.
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
              <h4>Category-only, not everything</h4>
              <p>Every listing is an AI product. No crypto tickers, no unrelated services, no noise diluting the board.</p>
            </div>
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>A rank is a rental, not a war</h4>
              <p>Bids hold a spot for 24 hours. You&apos;re not defending a position forever, you&apos;re buying a known, fixed window of visibility.</p>
            </div>
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>Clicks are counted, not claimed</h4>
              <p>Every listing shows a real, server-tracked click count. No self-reported traffic numbers to take on faith.</p>
            </div>
            <div className="how-card">
              <div className="how-num">→</div>
              <h4>Real payments, real commitment</h4>
              <p>Every bid is a real Stripe charge. That keeps the board free of throwaway listings.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
