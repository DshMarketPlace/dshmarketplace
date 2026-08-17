import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Throttling for the admin login, on Cloudflare's own rate-limit binding.
 *
 * The password check is constant-time, which defeats timing attacks and does
 * nothing at all against someone simply trying passwords in a loop. This
 * repository is public, so the endpoint, the single-password design and the
 * absence of a lockout are all readable from source — the loop has to cost
 * something.
 *
 * The binding is unmetered and lives in the runtime, so this adds no
 * dependency and nothing to the Worker bundle, which rules out every
 * store-backed limiter for a site whose size ceiling is already the binding
 * constraint.
 *
 * **It is best-effort, and measured much looser than configured.** Against
 * production at 5 requests/60s, a 40-request burst from one address got its
 * first 429 on the 34th; under `wrangler dev` the same code refuses the 6th
 * exactly. Cloudflare counts per location and converges late. So this raises
 * the cost of a sustained attack rather than capping attempts at five, and
 * the password still has to be a real one.
 */

/** Not in the generated env types; `wrangler types` writes those, and the file is gitignored. */
type RateLimiter = { limit: (opts: { key: string }) => Promise<{ success: boolean }> };

export const LOGIN_LIMITER = "LOGIN_RATE_LIMIT";

/**
 * The client address as Cloudflare sees it. `CF-Connecting-IP` is set by the
 * edge and cannot be spoofed by the caller; `X-Forwarded-For` can be, so it is
 * deliberately not consulted.
 */
export function clientIp(request: Request) {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

/**
 * Returns false when the caller has exhausted its allowance.
 *
 * Absent binding means `next dev`, where there is no runtime to provide one —
 * that path allows the request. It is a deliberate trade: with one operator and
 * no recovery flow, a misconfigured binding that locked out the admin would be
 * the worse failure.
 */
export async function withinRateLimit(binding: string, key: string) {
  let limiter: RateLimiter | undefined;
  try {
    const env = getCloudflareContext().env as unknown as Record<string, RateLimiter>;
    limiter = env?.[binding];
  } catch {
    return true;
  }

  if (!limiter) return true;
  const { success } = await limiter.limit({ key });
  return success;
}
