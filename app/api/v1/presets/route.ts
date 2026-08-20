import { NextResponse } from "next/server";

import { getPresetsWithPlugins, presetCommand } from "@/lib/presets";
import { directory } from "@/directory.config";

export const revalidate = 900;

/**
 * Curated sets, and the evidence for each.
 *
 * The plugin records are joined in from the catalogue rather than duplicated
 * here, so a preset cannot describe a plugin differently from its own listing —
 * the failure mode this project keeps hitting is two surfaces disagreeing, and
 * a hand-written copy of a summary is exactly that waiting to happen.
 */
export async function GET() {
  const { presets, unresolved } = await getPresetsWithPlugins();

  const results = presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    blurb: preset.blurb,
    // The exact string a reader can paste, and the one that does the extra
    // work. Both, because hiding the raw command would be the kind of thing
    // this catalogue exists not to do.
    install: presetCommand(preset),
    installCli: `npx dshmarketplace-cli preset ${preset.id}`,
    verified: preset.verified,
    plugins: preset.members.map(({ target, plugin: p }) => {
      return {
        target,
        fullName: p?.fullName ?? null,
        summary: p?.summary ?? null,
        summaryZh: p?.summaryZh ?? null,
        stars: p?.stars ?? null,
        category: p?.categoryId ?? null,
        installCheck: p?.installStatus ?? null,
        url:
          p && p.visibility !== "hidden"
            ? `${directory.baseUrl}/plugins/${p.slug}`
            : (p?.repoUrl ?? null),
      };
    }),
  }));

  return NextResponse.json(
    {
      count: results.length,
      // Surfaced rather than swallowed: if a preset names something the
      // catalogue no longer carries, a caller should be able to see that
      // without diffing two lists by hand.
      unresolved,
      presets: results,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=900",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
