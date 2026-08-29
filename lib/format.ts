export function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function timeAgoLabel(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const AVATAR_HUES = [4, 24, 44, 160, 200, 230, 260, 320];

export function avatarStyle(seed: string): { background: string; color: string; letter: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  const letter = seed.trim().charAt(0).toUpperCase() || "?";
  return { background: `hsl(${hue} 70% 88%)`, color: `hsl(${hue} 55% 32%)`, letter };
}
