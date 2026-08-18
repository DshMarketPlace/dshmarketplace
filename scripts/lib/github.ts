/**
 * One GitHub client for every author-time script, and one rule about quota.
 *
 * **A rate limit must end a step, never a night.** Discovery, the README
 * fetch, the metadata refresh and the admission re-check are the first four
 * steps of a nine-step nightly. Sleeping until an hourly quota resets does not
 * cost that step — it costs the sandbox, the reviews and the deploy queued
 * behind it. The first scheduled run slept 109 of its 120 minutes inside step
 * one and was cancelled having accomplished nothing at all.
 *
 * A short wait is still worth taking: the secondary limit clears in seconds.
 * A long one is not, so past `MAX_WAIT_MS` this surrenders and says so.
 *
 * This lives in one file because the same wrong version was written three
 * times — `ingest-topic.ts`, `prune-topic.ts` and `sync-github.ts` each had
 * their own sleep-until-reset, and fixing one left the nightly hanging in the
 * next. A rule that has to be repeated is a rule that will be repeated wrong.
 *
 * ## The part that matters after the quota is gone
 *
 * Callers read a null or a zero as evidence — "no marker", "no commits", "no
 * README". Once the quota is gone that is also what a failed request returns,
 * and acting on it deletes listings or records rejections for repositories
 * nobody looked at. So check `exhausted()` before believing any absence.
 */

const API = "https://api.github.com";

/** Longer than this and the step gives up rather than blocking the night. */
export const MAX_WAIT_MS = 120_000;

let out = false;

/** True once the quota is gone. Nothing may be judged while it is set. */
export function exhausted() {
  return out;
}

/** Test seam, and a way for a long script to start a fresh phase. */
export function resetQuotaState() {
  out = false;
}

export type GhOptions = {
  /** Sent as User-Agent, so a throttled script is identifiable in the logs. */
  agent: string;
  /** Ask for the raw file body rather than the JSON metadata envelope. */
  raw?: boolean;
  /** Statuses to report as `null` instead of retrying — 409 is an empty repo. */
  absent?: number[];
};

/**
 * Returns the parsed body, or null for "absent, or we could not find out".
 *
 * The two cases are deliberately the same shape, because every caller already
 * had to handle null — and are told apart by `exhausted()`, which the caller
 * must consult before treating null as an answer about the repository.
 */
export async function gh<T>(
  path: string,
  { agent, raw = false, absent = [404] }: GhOptions,
): Promise<T | null> {
  if (out) return null;

  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    headers: {
      Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json",
      "User-Agent": agent,
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

  if (absent.includes(res.status)) return null;

  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    const waitMs = Math.max(reset - Date.now(), 30_000);

    if (waitMs > MAX_WAIT_MS) {
      out = true;
      console.warn(
        `  out of GitHub API quota, ${Math.round(waitMs / 60_000)} min to reset — ` +
          `stopping this step so the rest of the run can continue`,
      );
      return null;
    }

    console.warn(`  rate limited — sleeping ${Math.round(waitMs / 1000)}s`);
    await new Promise((r) => setTimeout(r, waitMs));
    return gh<T>(path, { agent, raw, absent });
  }

  if (!res.ok) return null;
  return raw ? ((await res.text()) as T) : ((await res.json()) as T);
}

/**
 * Commit count, read from the pagination header rather than by walking the
 * history — one request whatever the repository's size.
 *
 * Null means "we do not know", which is not the same as zero and must never be
 * rounded down to it: a blip would then delete a good listing or record a
 * rejection that `pushed_at` keeps in place until the next push.
 */
export async function commitCount(
  owner: string,
  repo: string,
  agent: string,
): Promise<number | null> {
  if (out) return null;

  const res = await fetch(`${API}/repos/${owner}/${repo}/commits?per_page=1`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": agent,
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

  // Gone, or created with no commits. Either way it cannot be listed.
  if (res.status === 404 || res.status === 409) return 0;

  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    const waitMs = Math.max(reset - Date.now(), 30_000);
    if (waitMs > MAX_WAIT_MS) {
      out = true;
      return null;
    }
    await new Promise((r) => setTimeout(r, waitMs));
    return commitCount(owner, repo, agent);
  }

  if (!res.ok) return null;

  const last = res.headers.get("link")?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (last) return Number(last[1]);

  const body = (await res.json()) as unknown[];
  return Array.isArray(body) ? body.length : 0;
}
