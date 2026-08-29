import { NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/link-preview";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url || url.trim().length === 0) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const preview = await fetchLinkPreview(url);
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }
}
