"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUsd } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  ownerEmail: string;
  category: string;
  bidAmountCents: number;
  status: string;
  clicks: number;
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-active",
  PENDING_PAYMENT: "badge-pending",
  EXPIRED: "badge-expired",
  OUTBID: "badge-outbid",
  CANCELLED: "badge-cancelled",
};

export default function ListingsTable({ listings }: { listings: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: "expire" | "cancel") {
    if (action === "cancel" && !confirm("Cancel this listing and refund the charge (if any)?")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Category</th>
            <th>Bid</th>
            <th>Status</th>
            <th>Clicks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td>{l.ownerEmail}</td>
              <td>{l.category}</td>
              <td>{formatUsd(l.bidAmountCents)}</td>
              <td>
                <span className={`badge ${STATUS_BADGE[l.status]}`}>{l.status.replace("_", " ")}</span>
              </td>
              <td>{l.clicks.toLocaleString()}</td>
              <td>
                <div className="table-actions">
                  {l.status === "ACTIVE" && (
                    <button className="link-btn" disabled={busyId === l.id} onClick={() => act(l.id, "expire")}>
                      Expire
                    </button>
                  )}
                  {(l.status === "ACTIVE" || l.status === "PENDING_PAYMENT") && (
                    <button
                      className="link-btn danger"
                      disabled={busyId === l.id}
                      onClick={() => act(l.id, "cancel")}
                    >
                      Cancel & refund
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
