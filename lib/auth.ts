import { cookies } from "next/headers";

/**
 * Minimal admin session, built on Web Crypto so it works natively on Workers
 * with no dependencies. The previous scaffold used a middleware-based library
 * that pulled a JWT stack into the bundle for a single protected route.
 *
 * The token is `expiry.signature`, signed with HMAC-SHA256 over the expiry.
 * There is exactly one admin, so there is no subject to carry.
 */

export const SESSION_COOKIE = "dshm_session";
const TTL_SECONDS = 60 * 60 * 8;

function secretKey() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken() {
  const expiry = String(Math.floor(Date.now() / 1000) + TTL_SECONDS);
  const sig = await crypto.subtle.sign(
    "HMAC",
    await secretKey(),
    new TextEncoder().encode(expiry),
  );
  return `${expiry}.${toHex(sig)}`;
}

export async function verifyToken(token: string | undefined) {
  if (!token) return false;

  const [expiry, sig] = token.split(".");
  if (!expiry || !sig) return false;
  if (Number(expiry) < Math.floor(Date.now() / 1000)) return false;

  const expected = toHex(
    await crypto.subtle.sign(
      "HMAC",
      await secretKey(),
      new TextEncoder().encode(expiry),
    ),
  );

  // Constant-time comparison — a length check first, then an accumulating XOR.
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export async function isAuthenticated() {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

export function checkPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (expected.length !== candidate.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i);
  }
  return diff === 0;
}
