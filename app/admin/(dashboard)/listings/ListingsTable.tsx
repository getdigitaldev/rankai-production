"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUsd } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  url: string;
  totalPaidCents: number;
  clicks: number;
  hidden: boolean;
};

export default function ListingsTable({ listings }: { listings: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleHidden(id: string, nextHidden: boolean) {
    setBusyId(id);
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: nextHidden }),
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
            <th>URL</th>
            <th>Total paid</th>
            <th>Clicks</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td>{l.url}</td>
              <td>{formatUsd(l.totalPaidCents)}</td>
              <td>{l.clicks.toLocaleString()}</td>
              <td>
                <span className={`badge ${l.hidden ? "badge-cancelled" : "badge-active"}`}>
                  {l.hidden ? "Hidden" : "Visible"}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button
                    className={`link-btn ${l.hidden ? "" : "danger"}`}
                    disabled={busyId === l.id}
                    onClick={() => toggleHidden(l.id, !l.hidden)}
                  >
                    {l.hidden ? "Unhide" : "Hide"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
