import { NextResponse } from "next/server";

import { getCompatFor, getCompatSummary } from "@/lib/compat";
import { MAX_NAMES, parseName, type CompatKey } from "@/lib/compat-names";
import { PREVIEW_TAGS } from "@/lib/compat-summary";

// The answer depends on the caller's list, and those keys are attacker-
// mintable, so nothing per-request goes into a server cache.
export const dynamic = "force-dynamic";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
};

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400, headers: HEADERS });
}

/**
 * The upgrade check: for each name, the verdict published on `latest` and the
 * newest preview run on each upcoming dsh tag.
 *
 *   GET /api/v1/compat?names=dsh-better-sidebar,@scope/pkg,owner/repo
 *
 * Names are npm package names or catalogue full names (`owner/repo`,
 * `owner/repo#subpath`, `github:owner/repo`), comma-separated, at most 100.
 * Every one is validated before it reaches a query.
 */
export async function GET(request: Request) {
  // Not `new URL(request.url).searchParams`: on Workers the URL arrives with
  // `%23` already decoded, so a subpath name's `#` would turn the rest of the
  // list into a fragment. URLSearchParams over the raw query keeps `#` as text.
  const query = request.url.slice(request.url.indexOf("?") + 1);
  const raw = request.url.includes("?") ? (new URLSearchParams(query).get("names") ?? "") : "";
  if (raw.length > 20_000) return bad("names is too long");

  const tokens = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
  if (!tokens.length) return bad("pass ?names=a,b,c — npm names or owner/repo");
  if (tokens.length > MAX_NAMES) return bad(`at most ${MAX_NAMES} names per request`);

  const keys: CompatKey[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const key = parseName(token);
    if (key) keys.push(key);
    else invalid.push(token.slice(0, 80));
  }

  const [results, summary] = await Promise.all([getCompatFor(keys), getCompatSummary()]);

  return NextResponse.json(
    {
      // What each tag pointed at on its newest run, so a caller can tell a
      // result on this week's alpha from one on last week's.
      tags: Object.fromEntries(
        PREVIEW_TAGS.map((tag) => {
          const s = summary.tags[tag];
          return [
            tag,
            s ? { dsh: s.version, checked: s.checked, ranAt: s.ranAt ? new Date(s.ranAt * 1000).toISOString() : null } : null,
          ];
        }),
      ),
      measures:
        "Whether the plugin installs and registers in a fresh profile on that dsh release. Not whether it works at runtime.",
      count: results.length,
      results,
      invalid,
    },
    { headers: HEADERS },
  );
}
