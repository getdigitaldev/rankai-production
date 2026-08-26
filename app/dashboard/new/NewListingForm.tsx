"use client";

import { useState } from "react";

type Category = { id: string; label: string };
type Target = {
  id: string;
  name: string;
  bidAmountCents: number;
  categoryId: string;
  categoryLabel: string;
} | null;

export default function NewListingForm({
  categories,
  target,
  cancelled,
}: {
  categories: Category[];
  target: Target;
  cancelled: boolean;
}) {
  const minBidCents = target ? target.bidAmountCents + 100 : 500;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(target?.categoryId || categories[0]?.id || "");
  const [bid, setBid] = useState(Math.ceil(minBidCents / 100));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const bidAmountCents = Math.round(bid * 100);
    if (bidAmountCents < minBidCents) {
      setError(`Bid must be at least $${(minBidCents / 100).toFixed(0)}.`);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url,
        description,
        categoryId,
        bidAmountCents,
        targetId: target?.id,
      }),
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
    <form className="form-card" onSubmit={onSubmit}>
      <h3>{target ? `Outbid ${target.name}` : "List a new tool"}</h3>
      <p className="form-sub">
        {target
          ? `Current bid is $${(target.bidAmountCents / 100).toFixed(0)} in ${target.categoryLabel}. Beat it to take this spot for the next 24 hours.`
          : "Starting bids open at $5. Pick the category that fits your product."}
      </p>

      {cancelled && <div className="form-error">Checkout was cancelled — no charge was made.</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>Tool name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Prompt Layer" required />
      </div>
      <div className="field">
        <label>URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourtool.com"
          required
        />
      </div>
      <div className="field">
        <label>One-line description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does it do, in one sentence?"
          required
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!!target}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Your bid ($)</label>
          <input
            type="number"
            min={Math.ceil(minBidCents / 100)}
            value={bid}
            onChange={(e) => setBid(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="price-preview">
        <span>Minimum to claim this spot</span>
        <span className="amt">${(minBidCents / 100).toFixed(0)}</span>
      </div>

      <button className="submit-btn" disabled={loading} type="submit">
        {loading ? "Redirecting to checkout…" : "Continue to Stripe checkout"}
      </button>
      <p className="form-disclaimer">
        You&apos;ll be redirected to Stripe to complete payment. Your listing goes live automatically
        once payment is confirmed.
      </p>
    </form>
  );
}
