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
  getTableColumns,
} from "drizzle-orm";

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

export type BrowseParams = {
  category?: string;
  linuxdo?: boolean;
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

  const filters = [eq(plugins.isArchived, false)];

  if (params.category) {
    filters.push(eq(plugins.categoryId, params.category));
  }

  if (params.linuxdo) {
    filters.push(isNotNull(plugins.linuxdoUrl));
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

  const where = and(...filters);

  const [rows, totalRow] = await Promise.all([
    db
      .select(listColumns)
      .from(plugins)
      .where(where)
      .orderBy(orderFor(params.sort))
      .limit(perPage)
      .offset(offset),
    db.select({ value: count() }).from(plugins).where(where),
  ]);

  const total = totalRow[0]?.value ?? 0;

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

export async function getCategoriesWithCounts(): Promise<
  (Category & { pluginCount: number })[]
> {
  const rows = await db
    .select({
      category: categories,
      pluginCount: count(plugins.id),
    })
    .from(categories)
    .leftJoin(
      plugins,
      and(eq(plugins.categoryId, categories.id), eq(plugins.isArchived, false)),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((r) => ({ ...r.category, pluginCount: r.pluginCount }));
}

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

export async function countLinuxDoPlugins() {
  const [row] = await db
    .select({ value: count() })
    .from(plugins)
    .where(and(isNotNull(plugins.linuxdoUrl), eq(plugins.isArchived, false)));
  return row?.value ?? 0;
}

/**
 * Every listing, five columns — the payload behind `/api/v1/index`.
 *
 * A client that decorates a page full of repositories cannot make one request
 * per repository, so this exists to be fetched once and cached. Star order so
 * a client that truncates keeps the listings anyone is likely to hit.
 */
export async function getCatalogueIndex() {
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
}

/** Header counters. Real numbers, computed — never hardcoded. */
export async function getCatalogStats() {
  const [totals] = await db
    .select({
      total: count(),
      indexed: sql<number>`sum(case when ${plugins.visibility} = 'indexed' then 1 else 0 end)`,
      lastSynced: sql<number | null>`max(${plugins.syncedAt})`,
    })
    .from(plugins)
    .where(eq(plugins.isArchived, false));

  return {
    total: totals?.total ?? 0,
    indexed: Number(totals?.indexed ?? 0),
    lastSynced: totals?.lastSynced ? new Date(totals.lastSynced * 1000) : null,
  };
}
