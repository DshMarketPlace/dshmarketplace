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
 * What no other index can say goes into the two places the Discover card
 * shows: label tags and sort keys. Every entry carries the dsh release its
 * listed version installed on (`sandbox-<version>`), and — once the preview
 * lane has run it — whether the next `next` / `alpha` release accepts it.
 * Only a pass and a refusal by dsh's compatibility gate become labels; a
 * failed preview install is not evidence enough to print "breaks" on
 * somebody's plugin inside the harness.
 *
 * The harness rejects the whole index over one malformed value, so every
 * entry that cannot be written down exactly is left out rather than guessed.
 */
import type { getMarketRows } from "@/lib/data";
import { t, type Dict } from "@/lib/dict";
import { directory } from "@/directory.config";

type MarketData = Awaited<ReturnType<typeof getMarketRows>>;

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
const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
const bothWith = (pick: (d: Dict) => string, vars: Record<string, string>) => ({
  en: fill(pick(t("en")), vars),
  zh: fill(pick(t("zh")), vars),
});

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

/** SemVer precedence, enough for dsh's own versions (no build metadata). */
export function compareVersions(a: string, b: string): number {
  const [aMain, aPre] = splitVersion(a);
  const [bMain, bPre] = splitVersion(b);
  for (let i = 0; i < 3; i++) if (aMain[i] !== bMain[i]) return aMain[i] - bMain[i];
  if (!aPre.length || !bPre.length) return bPre.length - aPre.length;
  for (let i = 0; i < Math.min(aPre.length, bPre.length); i++) {
    const [x, y] = [aPre[i], bPre[i]];
    if (x === y) continue;
    const [nx, ny] = [/^\d+$/.test(x), /^\d+$/.test(y)];
    if (nx && ny) return Number(x) - Number(y);
    if (nx !== ny) return nx ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return aPre.length - bPre.length;
}

function splitVersion(v: string): [number[], string[]] {
  const [main, ...rest] = v.split("+")[0].split("-");
  const pre = rest.join("-");
  return [main.split(".").map(Number), pre ? pre.split(".") : []];
}

/** Label ids are free-form strings in format 1; keep ours readable. */
const sandboxLabel = (dsh: string) => `sandbox-${dsh}`;
const previewLabel = (tag: string, outcome: "ok" | "refused") => `${tag}-${outcome}`;

/**
 * The default order and the "Recommended" sort. Attention, momentum and real
 * use, each on a log scale so one viral repository does not drown the rest,
 * nudged by how current the evidence is: a listing verified on the newest
 * dsh the sandbox runs, or already accepted by the next release, ranks above
 * one whose verdict is a release behind. Older-release listings (the latest
 * needs a newer dsh) rank a little lower.
 */
export function recommendedScore(input: {
  stars: number;
  starsWeek: number;
  installs: number;
  onNewestDsh: boolean;
  previewOk: boolean;
  olderRelease: boolean;
}): number {
  const log = (n: number) => Math.log10(1 + Math.max(0, n));
  return Math.round(
    100 * log(input.stars) +
      150 * log(input.starsWeek) +
      120 * log(input.installs) +
      (input.onNewestDsh ? 60 : 0) +
      (input.previewOk ? 30 : 0) -
      (input.olderRelease ? 40 : 0),
  );
}

/** Where an entry's homepage points: our page when it has one, else the source. */
export function homepageOf(p: { visibility: string; slug: string; repoUrl: string }): string {
  return p.visibility === "hidden" ? p.repoUrl : `${directory.baseUrl}/plugins/${p.slug}`;
}

export function buildMarketIndex({ rows, categories, weekGain, previews }: MarketData) {
  const categoryIds = new Set(categories.map((c) => c.id));
  const gainOf = new Map(weekGain);
  const newestDsh = rows
    .map((r) => r.installDshVersion)
    .filter((v): v is string => !!v && SEMVER.test(v))
    .sort(compareVersions)
    .at(-1);

  const seen = new Set<string>();
  const usedLabels = new Set<string>();
  const entries = [];

  for (const p of rows) {
    const release = releaseOf(p.verifiedRelease);
    // Rows arrive by stars, so a renamed repository listed twice keeps the
    // higher-starred row and the index keeps names unique, as it must.
    if (!release || seen.has(release.name)) continue;
    seen.add(release.name);

    const dsh = p.installDshVersion && SEMVER.test(p.installDshVersion) ? p.installDshVersion : null;
    const preview = previews.flatMap(({ tag, verdicts }) => {
      const status = verdicts[p.fullName];
      if (status === "passed") return [previewLabel(tag, "ok")];
      if (status === "incompatible") return [previewLabel(tag, "refused")];
      return [];
    });
    const olderRelease = p.installStatus === "incompatible";
    const labels = [
      dsh ? sandboxLabel(dsh) : null,
      ...preview,
      p.inRegistry ? "registry" : null,
      p.linuxdoUrl ? "linuxdo" : null,
      olderRelease ? "older-release" : null,
    ].filter((l): l is string => l !== null);
    for (const l of labels) usedLabels.add(l);

    const starsWeek = gainOf.get(p.id) ?? 0;
    const sortKeys: Record<string, number> = {
      recommended: recommendedScore({
        stars: p.stars,
        starsWeek,
        installs: p.installCount,
        onNewestDsh: !!dsh && dsh === newestDsh,
        previewOk: preview.some((l) => l.endsWith("-ok")),
        olderRelease,
      }),
      stars: p.stars,
      installs: p.installCount,
      // Absent rather than 0: the harness sorts a missing key last in either
      // direction, so "no gain this week" never outranks a real one.
      ...(starsWeek > 0 ? { "stars-week": starsWeek } : {}),
    };

    entries.push({
      name: release.name,
      title: p.name,
      ...(p.summary
        ? { description: { en: p.summary, zh: p.summaryZh ?? p.summary } }
        : {}),
      author: p.owner,
      homepage: homepageOf(p),
      repository: { url: p.repoUrl, ...(p.subpath ? { directory: p.subpath } : {}) },
      metadata: {
        ...(p.categoryId && categoryIds.has(p.categoryId) ? { category: p.categoryId } : {}),
        labels,
        sortKeys,
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

  // The default order is the recommended one; the array order is what the
  // Discover tab shows before anyone picks a sort.
  entries.sort((a, b) => b.metadata.sortKeys.recommended - a.metadata.sortKeys.recommended);

  return {
    format: 1,
    title: both((d) => d.market.title),
    description: both((d) => d.market.description),
    metadata: {
      categories: Object.fromEntries(
        categories.map((c) => [c.id, { title: { en: c.name, zh: c.nameZh ?? c.name } }]),
      ),
      labels: declareLabels(usedLabels, previews),
      sortKeys: {
        recommended: { title: both((d) => d.market.sortRecommended), order: "desc" },
        "stars-week": { title: both((d) => d.market.sortStarsWeek), order: "desc" },
        stars: { title: both((d) => d.market.sortStars), order: "desc" },
        installs: { title: both((d) => d.market.sortInstalls), order: "desc" },
      },
    },
    plugins: entries,
  };
}

/** Declares exactly the labels some entry uses, so the Labels menu has no dead ids. */
function declareLabels(used: Set<string>, previews: MarketData["previews"]) {
  const out: Record<string, { title: { en: string; zh: string } }> = {};
  const sandbox = [...used]
    .filter((l) => l.startsWith("sandbox-"))
    .map((l) => l.slice("sandbox-".length))
    .sort((a, b) => compareVersions(b, a));
  for (const dsh of sandbox) {
    out[sandboxLabel(dsh)] = { title: bothWith((d) => d.market.labelSandbox, { dsh }) };
  }
  for (const { tag, version } of previews) {
    const vars = { tag, dsh: version };
    if (used.has(previewLabel(tag, "ok")))
      out[previewLabel(tag, "ok")] = { title: bothWith((d) => d.market.labelPreviewOk, vars) };
    if (used.has(previewLabel(tag, "refused")))
      out[previewLabel(tag, "refused")] = { title: bothWith((d) => d.market.labelPreviewRefused, vars) };
  }
  const fixed: [string, (d: Dict) => string][] = [
    ["registry", (d) => d.market.labelRegistry],
    ["linuxdo", (d) => d.market.labelLinuxdo],
    ["older-release", (d) => d.market.labelOlderRelease],
  ];
  for (const [id, pick] of fixed) if (used.has(id)) out[id] = { title: both(pick) };
  return out;
}
