import { prisma } from "@/lib/prisma";
import { formatUsd, timeAgoLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { listings: { include: { payments: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="dash-header">
        <h2>Users</h2>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Listings</th>
              <th>Total spent</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const spent = u.listings.flatMap((l) => l.payments).reduce((s, p) => s + p.amountCents, 0);
              return (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name || "—"}</td>
                  <td>
                    <span className={`badge ${u.role === "ADMIN" ? "badge-active" : "badge-outbid"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.listings.length}</td>
                  <td>{formatUsd(spent)}</td>
                  <td>{timeAgoLabel(u.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
