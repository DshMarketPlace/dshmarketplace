import { db } from "@/db/client";
import { plugins, categories, type Plugin, type Category } from "@/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  like,
  or,
  sql,
  count,
  ne,
  isNotNull,
  inArray,
  getTableColumns,
} from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Every catalogue-wide aggregate below (`count`, `sum(case…)`, `GROUP BY`) is
 * a full scan SQLite answers by visiting every `is_archived = 0` row — no
 * index helps. Each is identical for every visitor and only moves when a batch
 * writes, yet it was recomputed on every catalogue, homepage, api-docs and
 * `/api/v1/index` hit: 5,077 rows read per scan, half a billion rows a month
 * out of Turso once the crawlers arrived. Caching turns that into one scan per
 * window per region. A deploy resets the cache and every nightly ends in one,
 * so this TTL only bounds staleness for a mid-day write that ships no deploy —
 * on a header count nobody reads to the minute.
 */
const CATALOG_TTL = 900;

/** One tag over every catalogue aggregate, so a write can drop them together. */
const CATALOG_TAG = "catalog";

/**
 * The long-form text a card never shows.
 *
 * `db.select()` returns all 62 columns, and the stored README is around 30 KB
 * a row: one page of 24 cards pulled **750 KB** out of Turso to render
 * summaries, of which 706 KB was `readme_md` and `readme_html` alone. It cost
 * about 0.7s of the catalogue's ~0.9s server time.
 *
 * Written as an exclusion rather than a list of wanted columns on purpose. A
 * new column then appears in list views by default, and the failure mode of
 * forgetting to update this is a slightly larger payload — not a card that
 * silently renders without its new field.
 */
const LONG_FORM = [
  "readmeMd",
  "readmeHtml",
  "overview",
  "overviewZh",
  "overviewHtml",
  "overviewHtmlZh",
  "docs",
  "docsZh",
  "docsHtml",
  "docsHtmlZh",
  "review",
  "reviewZh",
] as const;

type ListColumns = Omit<
  ReturnType<typeof getTableColumns<typeof plugins>>,
  (typeof LONG_FORM)[number]
>;

/** Everything a card, the API and `primaryInstall()` read — and nothing else. */
const listColumns = Object.fromEntries(
  Object.entries(getTableColumns(plugins)).filter(
    ([name]) => !(LONG_FORM as readonly string[]).includes(name),
  ),
) as ListColumns;

/** A row from a list view: a `Plugin` minus the long-form text. */
export type PluginCardRow = Omit<Plugin, (typeof LONG_FORM)[number]>;

export type SortKey = "stars" | "updated" | "new" | "name" | "installs";

/**
 * The sandbox's closed verdict set. Closed matters beyond documentation: the
 * API whitelists its `installCheck` parameter against this, which is what lets
 * the cached facet count include the value in its key without letting an
 * arbitrary query string mint cache entries.
 */
export const INSTALL_VERDICTS = [
  "passed",
  "needs-approval",
  "not-a-layer",
  "failed",
  "timeout",
] as const;
export type InstallVerdict = (typeof INSTALL_VERDICTS)[number];

export type BrowseParams = {
  category?: string;
  linuxdo?: boolean;
  installCheck?: InstallVerdict;
  sort?: SortKey;
  q?: string;
  page?: number;
  perPage?: number;
};

const PER_PAGE_ALLOWED = [24, 48, 96] as const;

function orderFor(sort: SortKey = "stars") {
  switch (sort) {
    case "updated":
      return desc(plugins.repoPushedAt);
    case "new":
      return desc(plugins.createdAt);
    case "name":
      return asc(plugins.fullName);
    case "installs":
      return desc(plugins.installCount);
    case "stars":
    default:
      return desc(plugins.stars);
  }
}

/**
 * The WHERE for a browse query, shared by the listing and its count so the two
 * can never disagree about what they are counting.
 */
function browseFilters(params: BrowseParams) {
  const filters = [eq(plugins.isArchived, false)];

  if (params.category) {
    filters.push(eq(plugins.categoryId, params.category));
  }

  if (params.linuxdo) {
    filters.push(isNotNull(plugins.linuxdoUrl));
  }

  if (params.installCheck) {
    filters.push(eq(plugins.installStatus, params.installCheck));
  }

  const q = params.q?.trim();
  if (q) {
    const needle = `%${q}%`;
    filters.push(
      or(
        like(plugins.fullName, needle),
        like(plugins.name, needle),
        like(plugins.summary, needle),
        like(plugins.summaryZh, needle),
        like(plugins.tags, needle),
        // The npm name is the one string every install command we publish
        // contains, so it is what people paste back at us — and searching for
        // `@liustack/modsearch` returned nothing while the plugin sat in the
        // catalogue under `liustack/modsearch`. A catalogue that cannot find a
        // package by the name it tells you to install is missing its own
        // primary key.
        like(plugins.npmPackage, needle),
      )!,
    );
  }

  return filters;
}

/**
 * The count behind a browse page's header total, for the crawlable facets — the
 * whole catalogue, each category, the LINUX DO filter. A bounded set, so it is
 * cached. A `?q=` search count is a full scan too, but it is robots-disallowed
 * and human-rare, and caching per distinct query would let probing mint
 * unbounded cache keys — so {@link browseCount} runs a search live instead.
 */
const cachedFacetCount = unstable_cache(
  async (sig: { category: string; linuxdo: boolean; installCheck: string }) => {
    const where = and(
      ...browseFilters({
        category: sig.category || undefined,
        linuxdo: sig.linuxdo,
        installCheck: (sig.installCheck || undefined) as
          | InstallVerdict
          | undefined,
      }),
    );
    const [row] = await db
      .select({ value: count() })
      .from(plugins)
      .where(where);
    return row?.value ?? 0;
  },
  ["browse-facet-count"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] },
);

/** Header total for a browse query: cached for facets, live for a search. */
function browseCount(params: BrowseParams): Promise<number> {
  if (params.q?.trim()) {
    return db
      .select({ value: count() })
      .from(plugins)
      .where(and(...browseFilters(params)))
      .then((rows) => rows[0]?.value ?? 0);
  }
  return cachedFacetCount({
    category: params.category ?? "",
    linuxdo: Boolean(params.linuxdo),
    installCheck: params.installCheck ?? "",
  });
}

/**
 * Browse listing. Archived repos are excluded but every visibility tier is
 * shown — `hidden` only means "no detail page of its own", not "not a real
 * plugin". The card decides where to link.
 */
export async function getPlugins(params: BrowseParams = {}) {
  const perPage = PER_PAGE_ALLOWED.includes(params.perPage as never)
    ? (params.perPage as number)
    : 24;
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * perPage;

  const where = and(...browseFilters(params));

  const [rows, total] = await Promise.all([
    db
      .select(listColumns)
      .from(plugins)
      .where(where)
      .orderBy(orderFor(params.sort))
      .limit(perPage)
      .offset(offset),
    browseCount(params),
  ]);

  return {
    plugins: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Detail lookup. `hidden` plugins resolve to null so the route can 404 — we
 * deliberately do not render a thin page and mark it noindex, because a
 * noindex page is still crawled and still counts toward site-level quality.
 */
export async function getPluginBySlug(slug: string): Promise<Plugin | null> {
  const rows = await db
    .select()
    .from(plugins)
    .where(and(eq(plugins.slug, slug), ne(plugins.visibility, "hidden")))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * The two columns the badge endpoint reads — never the 62-column row, which
 * drags the ~30 KB stored README along for a 20px image.
 */
export async function getInstallStatusBySlug(slug: string) {
  const rows = await db
    .select({ slug: plugins.slug, installStatus: plugins.installStatus })
    .from(plugins)
    .where(eq(plugins.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Any visibility — used by the admin surface and the public JSON API. */
export async function getPluginBySlugAnyVisibility(
  slug: string,
): Promise<Plugin | null> {
  const rows = await db
    .select()
    .from(plugins)
    .where(eq(plugins.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

/** Sitemap source. Only fully promoted pages belong here. */
export async function getIndexedPlugins() {
  return db
    .select({
      slug: plugins.slug,
      updatedAt: plugins.updatedAt,
      indexedAt: plugins.indexedAt,
    })
    .from(plugins)
    .where(eq(plugins.visibility, "indexed"))
    .orderBy(desc(plugins.stars));
}

/** Routes that should exist at build time: everything with a page. */
export async function getRoutablePluginSlugs() {
  const rows = await db
    .select({ slug: plugins.slug })
    .from(plugins)
    .where(ne(plugins.visibility, "hidden"));

  return rows.map((r) => r.slug);
}

/**
 * Category chips with their live counts — a `GROUP BY` over the whole plugins
 * table, run on every catalogue render. Cached: the set only changes when a
 * batch writes. (The `Category` timestamp columns ride along unused; the cache
 * may return them as strings, which nothing that reads this ever touches.)
 */
export const getCategoriesWithCounts = unstable_cache(
  async (): Promise<(Category & { pluginCount: number })[]> => {
    const rows = await db
      .select({
        category: categories,
        pluginCount: count(plugins.id),
      })
      .from(categories)
      .leftJoin(
        plugins,
        and(
          eq(plugins.categoryId, categories.id),
          eq(plugins.isArchived, false),
        ),
      )
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return rows.map((r) => ({ ...r.category, pluginCount: r.pluginCount }));
  },
  ["categories-with-counts"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] },
);

export async function getAllCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

/** Related plugins for the detail page — same category, closest star count. */
export async function getRelatedPlugins(plugin: Plugin, limit = 6) {
  if (!plugin.categoryId) return [];

  return db
    .select(listColumns)
    .from(plugins)
    .where(
      and(
        eq(plugins.categoryId, plugin.categoryId),
        ne(plugins.id, plugin.id),
        eq(plugins.isArchived, false),
      ),
    )
    .orderBy(desc(plugins.stars))
    .limit(limit);
}

/**
 * Plugins whose authors posted them on LINUX DO, newest verification first.
 *
 * Hand-curated and verified, so this is small on purpose — it is the one
 * signal here that cannot be generated, and diluting it would be the point of
 * failure.
 */
export async function getLinuxDoPlugins(limit = 12) {
  return db
    .select(listColumns)
    .from(plugins)
    .where(and(isNotNull(plugins.linuxdoUrl), eq(plugins.isArchived, false)))
    .orderBy(desc(plugins.linuxdoVerifiedAt), desc(plugins.stars))
    .limit(limit);
}

export const countLinuxDoPlugins = unstable_cache(
  async () => {
    const [row] = await db
      .select({ value: count() })
      .from(plugins)
      .where(and(isNotNull(plugins.linuxdoUrl), eq(plugins.isArchived, false)));
    return row?.value ?? 0;
  },
  ["linuxdo-count"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] },
);

/**
 * Every listing, five columns — the payload behind `/api/v1/index`.
 *
 * A client that decorates a page full of repositories cannot make one request
 * per repository, so this exists to be fetched once and cached. Star order so
 * a client that truncates keeps the listings anyone is likely to hit.
 */
export const getCatalogueIndex = unstable_cache(
  async () => {
    return db
      .select({
        fullName: plugins.fullName,
        owner: plugins.owner,
        repo: plugins.repo,
        subpath: plugins.subpath,
        npmPackage: plugins.npmPackage,
        installKind: plugins.installKind,
        categoryId: plugins.categoryId,
        slug: plugins.slug,
        visibility: plugins.visibility,
      })
      .from(plugins)
      .where(eq(plugins.isArchived, false))
      .orderBy(desc(plugins.stars));
  },
  ["catalogue-index"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] },
);

/**
 * Header counters. Real numbers, computed — never hardcoded.
 *
 * The scan is cached; the wrapper below rebuilds the `Date` outside the cache,
 * because `unstable_cache` serialises its result and a `Date` returns as a
 * string that breaks `stats.lastSynced.toISOString()` at the call site.
 */
const getCatalogStatsRaw = unstable_cache(
  async () => {
    const [totals] = await db
      .select({
        total: count(),
        indexed: sql<number>`sum(case when ${plugins.visibility} = 'indexed' then 1 else 0 end)`,
        lastSyncedUnix: sql<number | null>`max(${plugins.syncedAt})`,
        // Installability from real sandbox runs — the one figure no scraper can
        // produce. `needs-approval` counts as installable: it installs once a
        // build script is allowlisted, which `dshmarketplace-cli` does on its own.
        // `not-a-layer` is excluded from both sides (the package installs but is
        // not a plugin layer), and an untested row counts toward neither, so the
        // rate is over what was actually run, not over the whole catalogue.
        installable: sql<number>`sum(case when ${plugins.installStatus} in ('passed','needs-approval') then 1 else 0 end)`,
        installTested: sql<number>`sum(case when ${plugins.installStatus} in ('passed','needs-approval','failed','timeout') then 1 else 0 end)`,
      })
      .from(plugins)
      .where(eq(plugins.isArchived, false));

    const installTested = Number(totals?.installTested ?? 0);
    const installable = Number(totals?.installable ?? 0);

    return {
      total: totals?.total ?? 0,
      indexed: Number(totals?.indexed ?? 0),
      lastSyncedUnix: totals?.lastSyncedUnix ?? null,
      installTested,
      // Null, not 0, when nothing has been tested — the UI hides the claim
      // rather than printing "0% install-verified".
      installRate: installTested
        ? Math.round((installable / installTested) * 100)
        : null,
    };
  },
  ["catalog-stats"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] },
);

export async function getCatalogStats() {
  const s = await getCatalogStatsRaw();
  return {
    total: s.total,
    indexed: s.indexed,
    lastSynced: s.lastSyncedUnix ? new Date(s.lastSyncedUnix * 1000) : null,
    installTested: s.installTested,
    installRate: s.installRate,
  };
}

/**
 * The plugins a preset names, fetched by npm package name.
 *
 * Deliberately not `getPlugins({ perPage: 96 })` filtered afterwards. A preset
 * member can sit anywhere in the catalogue — `dsh-tokenledger` is 26 stars —
 * and taking the top page would drop it silently, leaving a published command
 * longer than the list of plugins printed beside it. That is this project's
 * recurring bug in its purest form: a correct rule run over the wrong rows.
 */
export async function getPluginsByNpmName(
  names: string[],
): Promise<PluginCardRow[]> {
  if (!names.length) return [];
  return db
    .select(listColumns)
    .from(plugins)
    .where(inArray(plugins.npmPackage, names));
}
