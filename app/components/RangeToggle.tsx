"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const OPTIONS = [
  { href: "/", label: "All-time", icon: "🏆" },
  { href: "/?range=today", label: "Today", icon: "●", iconClass: "dot-live" },
];

function RangeToggleInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isToday = pathname === "/" && searchParams.get("range") === "today";
  const activeIndex = isToday ? 1 : 0;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = OPTIONS[activeIndex];

  return (
    <div className="range-dropdown" ref={rootRef}>
      <button
        type="button"
        className="range-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`segmented-icon ${active.iconClass ?? ""}`}>{active.icon}</span>
        {active.label}
        <span className={`range-chevron ${open ? "open" : ""}`}>▾</span>
      </button>
      <div className={`range-dropdown-menu ${open ? "open" : ""}`} role="listbox">
        {OPTIONS.map((opt, i) => (
          <Link
            key={opt.href}
            href={opt.href}
            role="option"
            aria-selected={i === activeIndex}
            className={`range-dropdown-item ${i === activeIndex ? "active" : ""}`}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
          >
            <span className={`segmented-icon ${opt.iconClass ?? ""}`}>{opt.icon}</span>
            {opt.label}
            {i === activeIndex && <span className="range-check">✓</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RangeToggle() {
  return (
    <Suspense fallback={<div className="range-dropdown" />}>
      <RangeToggleInner />
    </Suspense>
  );
}
