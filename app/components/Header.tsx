import Link from "next/link";

export default function Header() {
  return (
    <header>
      <div className="wrap header-row">
        <Link href="/" className="logo">
          <span className="dot"></span>Outbid
        </Link>
        <nav>
          <Link href="/">Board</Link>
          <Link href="/about">About</Link>
          <Link href="/rules">Rules</Link>
        </nav>
      </div>
    </header>
  );
}
