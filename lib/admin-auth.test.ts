import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  verifyAdminPassword,
  createAdminSessionCookie,
  verifyAdminSessionCookie,
} from "./admin-auth";

describe("verifyAdminPassword", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "correct-horse-battery-staple");
  });

  it("accepts the configured password", () => {
    expect(verifyAdminPassword("correct-horse-battery-staple")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyAdminPassword("wrong")).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(verifyAdminPassword("")).toBe(false);
  });

  it("rejects when ADMIN_PASSWORD is not configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(verifyAdminPassword("")).toBe(false);
    expect(verifyAdminPassword("anything")).toBe(false);
  });
});

describe("createAdminSessionCookie / verifyAdminSessionCookie", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-session-secret");
  });

  it("a freshly created cookie verifies as valid", () => {
    const cookie = createAdminSessionCookie();
    expect(verifyAdminSessionCookie(cookie.value)).toBe(true);
  });

  it("rejects an undefined cookie value", () => {
    expect(verifyAdminSessionCookie(undefined)).toBe(false);
  });

  it("rejects a tampered cookie value", () => {
    const cookie = createAdminSessionCookie();
    const tampered = cookie.value.slice(0, -1) + (cookie.value.at(-1) === "a" ? "b" : "a");
    expect(verifyAdminSessionCookie(tampered)).toBe(false);
  });

  it("rejects a garbage cookie value", () => {
    expect(verifyAdminSessionCookie("not-a-real-cookie")).toBe(false);
  });

  it("rejects a cookie signed with a different secret", () => {
    const cookie = createAdminSessionCookie();
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-different-secret");
    expect(verifyAdminSessionCookie(cookie.value)).toBe(false);
  });

  it("rejects an expired cookie", () => {
    vi.useFakeTimers();
    const cookie = createAdminSessionCookie();
    vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 8); // 8 days
    expect(verifyAdminSessionCookie(cookie.value)).toBe(false);
    vi.useRealTimers();
  });

  it("exposes a cookie name and maxAge option consistent with the expiry window", () => {
    const cookie = createAdminSessionCookie();
    expect(cookie.name).toBe("admin_session");
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.maxAge).toBeGreaterThan(0);
  });
});
