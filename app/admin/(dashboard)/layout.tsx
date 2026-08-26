import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminRequest())) {
    redirect("/admin/login");
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/listings">Listings</Link>
      </aside>
      <main className="dash-main">{children}</main>
    </div>
  );
}
