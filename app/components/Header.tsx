import Link from "next/link";
import Image from "next/image";
import RangeToggle from "./RangeToggle";

export default function Header() {
  return (
    <header>
      <div className="wrap header-row">
        <div className="header-left">
          <Link href="/" className="logo">
            <Image src="/toprank.sh-logo.webp" alt="toprank.sh" width={99} height={33} className="logo-mark" priority />
          </Link>
          <RangeToggle />
        </div>
        <nav>
          <Link href="/">Board</Link>
          <Link href="/about">About</Link>
          <Link href="/rules">Rules</Link>
        </nav>
      </div>
    </header>
  );
}
