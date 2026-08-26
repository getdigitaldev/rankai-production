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

export function timeLeftLabel(expiresAt: Date | null): { text: string; urgent: boolean } {
  if (!expiresAt) return { text: "—", urgent: false };
  const remain = expiresAt.getTime() - Date.now();
  if (remain <= 0) return { text: "expiring", urgent: true };
  const hrs = Math.floor(remain / 3600000);
  const mins = Math.floor((remain % 3600000) / 60000);
  return { text: `${hrs}h ${mins}m left`, urgent: hrs < 2 };
}
