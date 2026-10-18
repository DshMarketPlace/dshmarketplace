/**
 * The catalogue as a DeepSeek Harness plugin index (format 1).
 *
 * From dsh 0.2.1 the harness can browse third-party indexes in a Discover tab
 * on its Plugins page and install from them after a confirmation. The format
 * is defined in deepseek-ai/deepseek-harness, docs/user/guide/plugin-market.md.
 *
 * Only what the sandbox installed goes in, and only the exact release it
 * installed: an index is read inside the harness, where an install button
 * that fails reads as our defect — the same reason the in-DSH store lists
 * only `passed`. When dsh refused a plugin's latest release and an older one
 * installed, that older one is listed, with the dsh range the harness will
 * check it against, so the Discover tab offers it only where it fits.
 *
 * The harness rejects the whole index over one malformed value, so every
 * entry that cannot be written down exactly is left out rather than guessed.
 */
import type { getMarketRows } from "@/lib/data";
import { t, type Dict } from "@/lib/dict";
import { directory } from "@/directory.config";

type Rows = Awaited<ReturnType<typeof getMarketRows>>;

type Release = {
  name: string;
  version: string;
  publishedAt: number | null;
  engines: string | false | null;
};

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z.-]+)?$/;
// Characters a SemVer range can contain. Not a parser — the harness is — but
// enough to keep an arbitrary manifest string out of a file it validates whole.
const RANGE = /^[0-9A-Za-z.\s<>=~^|*+-]+$/;

const both = (pick: (d: Dict) => string) => ({ en: pick(t("en")), zh: pick(t("zh")) });

function releaseOf(json: string | null): Release | null {
  if (!json) return null;
  try {
    const r = JSON.parse(json) as Release;
    if (!r?.name || !SEMVER.test(r.version) || !Number.isInteger(r.publishedAt)) return null;
    if (r.engines === false) return null;
    if (typeof r.engines === "string" && (!r.engines.trim() || !RANGE.test(r.engines))) return null;
    return r;
  } catch {
    return null;
  }
}

export function buildMarketIndex({ rows, categories }: Rows) {
  const categoryIds = new Set(categories.map((c) => c.id));
  const seen = new Set<string>();
  const entries = [];

  for (const p of rows) {
    const release = releaseOf(p.verifiedRelease);
    // Rows arrive by stars, so a renamed repository listed twice keeps the
    // higher-starred row and the index keeps names unique, as it must.
    if (!release || seen.has(release.name)) continue;
    seen.add(release.name);

    const labels = [
      p.inRegistry ? "registry" : null,
      p.linuxdoUrl ? "linuxdo" : null,
      p.installStatus === "incompatible" ? "older-release" : null,
    ].filter((l): l is string => l !== null);

    entries.push({
      name: release.name,
      title: p.name,
      ...(p.summary
        ? { description: { en: p.summary, zh: p.summaryZh ?? p.summary } }
        : {}),
      author: p.owner,
      homepage:
        p.visibility === "hidden"
          ? `${directory.baseUrl}/plugins?q=${encodeURIComponent(p.fullName)}`
          : `${directory.baseUrl}/plugins/${p.slug}`,
      repository: { url: p.repoUrl, ...(p.subpath ? { directory: p.subpath } : {}) },
      metadata: {
        ...(p.categoryId && categoryIds.has(p.categoryId) ? { category: p.categoryId } : {}),
        labels,
        sortKeys: { stars: p.stars, installs: p.installCount },
      },
      versions: [
        {
          version: release.version,
          publishTimestamp: release.publishedAt,
          source: { type: "npm" },
          ...(typeof release.engines === "string" ? { engines: { dsh: release.engines } } : {}),
        },
      ],
    });
  }

  return {
    format: 1,
    title: both((d) => d.market.title),
    description: both((d) => d.market.description),
    metadata: {
      categories: Object.fromEntries(
        categories.map((c) => [c.id, { title: { en: c.name, zh: c.nameZh ?? c.name } }]),
      ),
      labels: {
        registry: { title: both((d) => d.market.labelRegistry) },
        linuxdo: { title: both((d) => d.market.labelLinuxdo) },
        "older-release": { title: both((d) => d.market.labelOlderRelease) },
      },
      sortKeys: {
        stars: { title: both((d) => d.market.sortStars), order: "desc" },
        installs: { title: both((d) => d.market.sortInstalls), order: "desc" },
      },
    },
    plugins: entries,
  };
}
