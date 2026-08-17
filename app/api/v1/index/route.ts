import { NextResponse } from "next/server";

import { getCatalogueIndex } from "@/lib/data";
import { primaryInstall } from "@/lib/install";
import { directory } from "@/directory.config";

/**
 * Read at request time, not at build time. `promote.ts` and `sync-github.ts`
 * write straight to the database without a deploy, and a prerendered index
 * would then disagree with `/api/v1/plugins` until the next push — the exact
 * producer/consumer drift this endpoint exists to avoid.
 */
export const dynamic = "force-dynamic";

/**
 * The whole catalogue in one response, five columns per listing.
 *
 * `/api/v1/plugins` answers "tell me about this plugin". This answers "which
 * of these thousand repositories are plugins at all" — the question a browser
 * extension decorating a GitHub topic page has to ask, and one it cannot ask
 * a repository at a time. Rows are positional to keep the payload small; the
 * column names ship with it so the shape is still self-describing.
 *
 * `install` is null when no command can install the plugin, `path` is null
 * when the listing has no page of its own yet, and `npm` is null when the
 * plugin publishes nowhere. None is ever a placeholder: a caller that runs
 * whatever is in `install` must not be handed a string that fails.
 */
export async function GET() {
  const rows = await getCatalogueIndex();

  const listings = rows.map((p) => [
    p.fullName,
    p.categoryId,
    primaryInstall(p)?.cmd ?? null,
    p.visibility === "hidden" ? null : `/plugins/${p.slug}`,
    p.npmPackage,
  ]);

  return NextResponse.json(
    {
      generated: new Date().toISOString(),
      count: listings.length,
      site: directory.baseUrl,
      fields: ["fullName", "category", "install", "path", "npm"],
      plugins: listings,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=21600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
