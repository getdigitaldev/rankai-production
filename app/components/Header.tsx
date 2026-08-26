import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HeaderAuthLinks from "./HeaderAuthLinks";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header>
      <div className="wrap header-row">
        <Link href="/" className="logo">
          <span className="dot"></span>RankAI
        </Link>
        <nav>
          <Link href="/">Leaderboard</Link>
          <Link href="/about">About</Link>
          <Link href="/rules">Rules</Link>
          <HeaderAuthLinks
            isLoggedIn={!!session}
            isAdmin={session?.user?.role === "ADMIN"}
          />
        </nav>
      </div>
    </header>
  );
}
