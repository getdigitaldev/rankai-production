const FETCH_TIMEOUT_MS = 4000;
const MAX_BYTES = 200_000;

const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /\.local$/i,
  /\.internal$/i,
];

export function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function extractPreviewFromHtml(
  html: string,
  baseUrl: string,
): { title: string | null; faviconUrl: string | null } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim().slice(0, 200) : "";
  const title = rawTitle.length > 0 ? rawTitle : null;

  const iconTagMatch = html.match(/<link[^>]+rel=["']?(?:shortcut icon|icon)["']?[^>]*>/i);
  let faviconUrl: string | null = null;
  if (iconTagMatch) {
    const hrefMatch = iconTagMatch[0].match(/href=["']([^"'\s>]+)["']?/i);
    if (hrefMatch) {
      try {
        faviconUrl = new URL(hrefMatch[1], baseUrl).toString();
      } catch {
        faviconUrl = null;
      }
    }
  }
  if (!faviconUrl) {
    try {
      faviconUrl = new URL("/favicon.ico", baseUrl).toString();
    } catch {
      faviconUrl = null;
    }
  }

  return { title, faviconUrl };
}

export type LinkPreview = { title: string; faviconUrl: string | null; domain: string };

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  const domain = parsed.hostname.toLowerCase();
  const origin = `${parsed.protocol}//${parsed.host}`;

  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHostname(domain)) {
    return { title: domain, faviconUrl: null, domain };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; toprankbot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      return { title: domain, faviconUrl: `${origin}/favicon.ico`, domain };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let received = 0;
    while (received < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    reader.cancel().catch(() => {});

    const { title, faviconUrl } = extractPreviewFromHtml(html, parsed.toString());
    return { title: title ?? domain, faviconUrl: faviconUrl ?? `${origin}/favicon.ico`, domain };
  } catch {
    return { title: domain, faviconUrl: `${origin}/favicon.ico`, domain };
  }
}
