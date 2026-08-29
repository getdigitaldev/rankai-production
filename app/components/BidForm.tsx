"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { avatarStyle } from "@/lib/format";
import Favicon from "./Favicon";

type Preview = { title: string; faviconUrl: string | null; domain: string };

function BidFormInner({ suggestedAmountCents, floorCents }: { suggestedAmountCents: number; floorCents: number }) {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [amountCents, setAmountCents] = useState(
    Number(searchParams.get("amount")) > 0
      ? Math.round(Number(searchParams.get("amount"))) * 100
      : suggestedAmountCents,
  );
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const amountDollars = Math.round(amountCents / 100);

  function step(deltaCents: number) {
    setAmountCents((c) => Math.max(floorCents, c + deltaCents));
  }

  useEffect(() => {
    const trimmed = url.trim();
    if (trimmed.length < 3) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPreview(data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [url]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Enter a URL.");
      return;
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Enter a valid bid amount.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, amountCents }),
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
    <div className="board-hero" id="bid">
      <h2 className="claim-heading">
        Claim #1 for
        <span className="claim-stepper">
          <button type="button" className="stepper-btn" onClick={() => step(-100)} aria-label="Decrease bid by one dollar">
            −
          </button>
          <span className="claim-amt">${amountDollars.toLocaleString()}</span>
          <button type="button" className="stepper-btn" onClick={() => step(100)} aria-label="Increase bid by one dollar">
            +
          </button>
        </span>
      </h2>
      <p className="claim-sub">
        <strong>New spots start at $5.</strong> Paying less than the #1 price still puts you on the
        board at whatever place that bid can take.
      </p>

      <form className="bid-bar" onSubmit={onSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Your product URL"
          required
        />
        <button className="bid-bar-btn" disabled={loading} type="submit">
          {loading ? "Redirecting…" : "Claim Rank"}
        </button>
      </form>

      {(previewLoading || preview) && (
        <div className="link-preview">
          {previewLoading ? (
            <span className="link-preview-loading">Fetching page details…</span>
          ) : preview ? (
            <>
              <Favicon
                src={preview.faviconUrl}
                letter={preview.domain.charAt(0).toUpperCase() || "?"}
                background={avatarStyle(preview.domain).background}
                color={avatarStyle(preview.domain).color}
              />
              <span className="link-preview-title">{preview.title}</span>
              <span className="link-preview-domain">{preview.domain}</span>
            </>
          ) : null}
        </div>
      )}

      {error && <div className="form-error bid-bar-error">{error}</div>}
      <p className="claim-disclaimer">
        Bids are never refunded. Your listing never expires — falling behind just drops your rank.
      </p>
    </div>
  );
}

export default function BidForm({
  suggestedAmountCents,
  floorCents,
}: {
  suggestedAmountCents: number;
  floorCents: number;
}) {
  return (
    <Suspense fallback={null}>
      <BidFormInner suggestedAmountCents={suggestedAmountCents} floorCents={floorCents} />
    </Suspense>
  );
}
