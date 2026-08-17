import { NextResponse } from "next/server";

import { getPlugins } from "@/lib/data";
import { primaryInstall, installOptions, isInstallable } from "@/lib/install";
import { directory } from "@/directory.config";

export const revalidate = 900;

/**
 * Public catalog API. This is the single source the CLI, the in-DSH plugin and
 * the website all read from, so a listing can never disagree with itself
 * across surfaces.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);

  const { plugins, total } = await getPlugins({
    q,
    category,
    sort: "stars",
    page: Number(url.searchParams.get("page")) || 1,
    perPage: limit <= 24 ? 24 : limit <= 48 ? 48 : 96,
  });

  const results = plugins.slice(0, limit).map((p) => ({
    fullName: p.fullName,
    name: p.name,
    owner: p.owner,
    repo: p.repo,
    subpath: p.subpath,
    summary: p.summary,
    summaryZh: p.summaryZh,
    category: p.categoryId,
    language: p.language,
    license: p.license,
    stars: p.stars,
    pushedAt: p.repoPushedAt,
    repoUrl: p.repoUrl,
    npmPackage: p.npmPackage,
    installKind: p.installKind,
    // null rather than a placeholder: a caller that runs whatever is in this
    // field must not be handed something that does not install the plugin.
    install: primaryInstall(p)?.cmd ?? null,
    installable: isInstallable(p),
    installOptions: installOptions(p),
    // What happened when the command above was actually run, in a throwaway
    // container against a clean profile: passed | needs-approval | not-a-layer
    // | failed | timeout, or null where it has not been run since the command
    // last changed. Only the last two are defects. `needs-approval` means pnpm
    // blocked a build script until it is allowlisted, which one `allowBuilds`
    // entry fixes; `not-a-layer` means the package installed but declares no
    // `dsh.bundle`, so the harness took it as an ordinary dependency.
    installCheck: p.installStatus,
    installCheckedAt: p.installCheckedAt,
    riskFlags: p.riskFlags ? JSON.parse(p.riskFlags) : [],
    inRegistry: p.inRegistry,
    // Only promoted plugins have a page worth linking to.
    url:
      p.visibility === "hidden"
        ? p.repoUrl
        : `${directory.baseUrl}/plugins/${p.slug}`,
  }));

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
