import { describe, expect, it } from "vitest";
import { extractPreviewFromHtml, isPrivateHostname } from "./link-preview";

describe("extractPreviewFromHtml", () => {
  it("extracts the title", () => {
    const html = "<html><head><title>Cool Tool</title></head><body></body></html>";
    expect(extractPreviewFromHtml(html, "https://example.com").title).toBe("Cool Tool");
  });

  it("trims whitespace and decodes common entities in the title", () => {
    const html = "<title>\n  Tool &amp; Friends \n</title>";
    expect(extractPreviewFromHtml(html, "https://example.com").title).toBe("Tool & Friends");
  });

  it("returns null title when there is no title tag", () => {
    const html = "<html><body>no head here</body></html>";
    expect(extractPreviewFromHtml(html, "https://example.com").title).toBeNull();
  });

  it("resolves a relative favicon href against the base url", () => {
    const html = '<link rel="icon" href="/assets/favicon.png">';
    expect(extractPreviewFromHtml(html, "https://example.com/tool").faviconUrl).toBe(
      "https://example.com/assets/favicon.png",
    );
  });

  it("resolves an absolute favicon href unchanged", () => {
    const html = '<link rel="shortcut icon" href="https://cdn.example.com/icon.png">';
    expect(extractPreviewFromHtml(html, "https://example.com").faviconUrl).toBe(
      "https://cdn.example.com/icon.png",
    );
  });

  it("falls back to /favicon.ico at the origin when no link tag is present", () => {
    const html = "<title>No icon here</title>";
    expect(extractPreviewFromHtml(html, "https://example.com/deep/path").faviconUrl).toBe(
      "https://example.com/favicon.ico",
    );
  });
});

describe("isPrivateHostname", () => {
  it.each(["localhost", "127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.1.1", "internal.local", "app.internal"])(
    "flags %s as private",
    (host) => {
      expect(isPrivateHostname(host)).toBe(true);
    },
  );

  it.each(["example.com", "sub.example.com", "8.8.8.8"])("does not flag %s as private", (host) => {
    expect(isPrivateHostname(host)).toBe(false);
  });
});
