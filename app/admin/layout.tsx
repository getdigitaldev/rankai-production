import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/listings">Listings</Link>
        <Link href="/admin/users">Users</Link>
        <Link href="/admin/categories">Categories</Link>
      </aside>
      <main className="dash-main">{children}</main>
    </div>
  );
}
