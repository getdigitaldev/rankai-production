"use client";

import { useState } from "react";

export default function Favicon({
  src,
  letter,
  background,
  color,
}: {
  src: string | null | undefined;
  letter: string;
  background: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="avatar" style={{ background, color }}>
        {letter}
      </div>
    );
  }

  return (
    <div className="avatar avatar-img">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" onError={() => setFailed(true)} />
    </div>
  );
}
