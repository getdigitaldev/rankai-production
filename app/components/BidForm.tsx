"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function BidFormInner() {
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [amount, setAmount] = useState(searchParams.get("amount") ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Enter a valid bid amount.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, amountCents }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <form className="form-card" id="bid" onSubmit={onSubmit}>
      <h3>Submit or bid</h3>
      <p className="form-sub">
        New link, $5 to join the board. Already listed? Add any amount ≥ $1 to your total.
      </p>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yoursite.com"
          required
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your product" required />
        </div>
        <div className="field">
          <label>Bid ($)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5"
            required
          />
        </div>
      </div>

      <button className="submit-btn" disabled={loading} type="submit">
        {loading ? "Redirecting to checkout…" : "Continue to Stripe checkout"}
      </button>
      <p className="form-disclaimer">
        Bids are never refunded. Your listing never expires — getting outbid just drops your rank.
      </p>
    </form>
  );
}

export default function BidForm() {
  return (
    <Suspense fallback={null}>
      <BidFormInner />
    </Suspense>
  );
}
