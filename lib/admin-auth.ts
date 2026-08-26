import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || !password) return false;
  return safeEqual(password, configured);
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createAdminSessionCookie(): {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; secure: boolean; path: "/"; maxAge: number };
} {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return {
    name: COOKIE_NAME,
    value: `${issuedAt}.${signature}`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  };
}

export function verifyAdminSessionCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  const [issuedAt, signature] = cookieValue.split(".");
  if (!issuedAt || !signature) return false;

  let expectedSignature: string;
  try {
    expectedSignature = sign(issuedAt);
  } catch {
    return false;
  }
  if (!safeEqual(signature, expectedSignature)) return false;

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;

  const ageMs = Date.now() - issuedAtMs;
  return ageMs >= 0 && ageMs <= MAX_AGE_SECONDS * 1000;
}

export const ADMIN_SESSION_COOKIE_NAME = COOKIE_NAME;

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionCookie(cookieStore.get(COOKIE_NAME)?.value);
}
