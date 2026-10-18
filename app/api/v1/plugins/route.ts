import { NextResponse } from "next/server";

import { getPlugins, INSTALL_VERDICTS, type InstallVerdict } from "@/lib/data";
import { pluginRecord } from "@/lib/plugin-record";

export const revalidate = 900;

/**
 * Public catalog API. This is the single source the CLI, the in-DSH plugin and
 * the website all read from, so a listing can never disagree with itself
 * across surfaces.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // A pinned preset member (`name@0.26.1`) reaches here verbatim from
  // dshmarketplace-cli 0.3, which predates pins and searches for the whole
  // spec. Searching the name keeps that client installing the full set rather
  // than reporting one member missing and installing the rest.
  const q =
    url.searchParams
      .get("q")
      ?.replace(/^(@[^/@\s]+\/[^@\s]+|[^@\s][^@\s]*)@[^@\s]+$/, "$1") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);

  // Whitelisted against the closed verdict set before it can influence the
  // query: this value reaches the cached facet count's key, and an arbitrary
  // string must never mint a cache entry. Unknown values mean "no filter",
  // not an error — an older client that never sends it keeps working.
  const installCheckParam = url.searchParams.get("installCheck") ?? "";
  const installCheck = (INSTALL_VERDICTS as readonly string[]).includes(
    installCheckParam,
  )
    ? (installCheckParam as InstallVerdict)
    : undefined;

  const { plugins, total } = await getPlugins({
    q,
    category,
    installCheck,
    sort: "stars",
    page: Number(url.searchParams.get("page")) || 1,
    perPage: limit <= 24 ? 24 : limit <= 48 ? 48 : 96,
  });

  const results = plugins.slice(0, limit).map(pluginRecord);

  return NextResponse.json(
    { total, count: results.length, results },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=900",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
