"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function HeaderAuthLinks({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <>
        <Link href="/login">Log in</Link>
        <Link href="/dashboard/new" className="nav-btn" style={{ textDecoration: "none" }}>
          List your tool
        </Link>
      </>
    );
  }

  return (
    <>
      {isAdmin && <Link href="/admin">Admin</Link>}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/new" className="nav-btn" style={{ textDecoration: "none" }}>
        List your tool
      </Link>
      <a onClick={() => signOut({ callbackUrl: "/" })}>Log out</a>
    </>
  );
}
