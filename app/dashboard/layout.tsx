import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Link href="/dashboard">My listings</Link>
        <Link href="/dashboard/new">New listing / bid</Link>
      </aside>
      <main className="dash-main">{children}</main>
    </div>
  );
}
