import { text, sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

/**
 * Visibility drives the staged SEO rollout.
 *
 *  hidden  — no route is generated. The plugin exists in the API and in browse
 *            cards (which link straight to GitHub), but Google never sees a
 *            page for it. This is the default for freshly synced repos.
 *  listed  — a detail page is rendered with `noindex, follow`. Reachable and
 *            linkable, but withheld from the index until the copy is worth it.
 *  indexed — fully indexable and present in the sitemap.
 *
 * Un-enriched plugins stay `hidden` rather than `listed`: a noindex page is
 * still crawled and still counts toward site-level quality evaluation, so
 * parking thousands of thin pages at noindex is not free.
 */
export type Visibility = "hidden" | "listed" | "indexed";

/** How the plugin is installed into DeepSeek Harness. */
export type InstallKind = "npm" | "github" | "bundle" | "skill" | "unknown";

/** Where we first learned about this plugin. */
export type Provenance = "registry" | "topic" | "submitted";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameZh: text("name_zh"),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const plugins = sqliteTable(
  "plugins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Identity. The natural key is "owner/repo" or, for monorepos that ship
    // several plugins from one repository, "owner/repo#subpath" — dropping the
    // subpath silently merges distinct plugins (54 of them in the seed data).
    fullName: text("full_name").notNull().unique(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    subpath: text("subpath"),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    repoUrl: text("repo_url").notNull(),
    homepageUrl: text("homepage_url"),

    // Copy. `summary*` come from the upstream catalog; `overview` is ours and
    // is what lifts a listing above a scraped-README stub.
    summary: text("summary"),
    summaryZh: text("summary_zh"),
    overview: text("overview"),
    overviewZh: text("overview_zh"),

    // Our own reference section, written from the README rather than lifted
    // from it. The imported README is kept as the source of record but is no
    // longer what the page shows: it is byte-identical to what every other
    // directory scraped, and it arrives full of badge rows and repo chrome.
    docs: text("docs"),
    docsZh: text("docs_zh"),
    readmeMd: text("readme_md"),

    // Markdown is rendered and sanitised during sync, not at request time: it
    // keeps the markdown parser out of the Worker bundle, and the crawler gets
    // finished HTML. README content is untrusted, so the sanitiser in the sync
    // job is the only thing standing between a repo author and stored XSS.
    overviewHtml: text("overview_html"),
    overviewHtmlZh: text("overview_html_zh"),
    docsHtml: text("docs_html"),
    docsHtmlZh: text("docs_html_zh"),
    readmeHtml: text("readme_html"),

    // Taxonomy
    categoryId: text("category_id").references(() => categories.id),
    tags: text("tags"),
    language: text("language"),

    // Repo signals
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    openIssues: integer("open_issues").notNull().default(0),
    license: text("license"),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    repoCreatedAt: integer("repo_created_at", { mode: "timestamp" }),
    repoPushedAt: integer("repo_pushed_at", { mode: "timestamp" }),

    // Install resolution
    installKind: text("install_kind").notNull().default("unknown"),
    npmPackage: text("npm_package"),
    installCmd: text("install_cmd"),

    // Trust layer. `riskFlags` is a JSON array of machine-detected concerns
    // (build scripts, terminal surface, credential prompts). Listing is not an
    // endorsement, so we surface what we can detect and say so plainly.
    riskFlags: text("risk_flags"),
    provenance: text("provenance").notNull().default("topic"),
    inRegistry: integer("in_registry", { mode: "boolean" })
      .notNull()
      .default(false),

    // Media. `illustration` is a commissioned diagram of what the plugin
    // actually does, rendered in the site's own palette — the one thing on a
    // detail page that no competitor's scraper can lift from the repo.
    screenshot: text("screenshot"),
    illustration: text("illustration"),
    illustrationAlt: text("illustration_alt"),
    ogImage: text("og_image"),

    // Community proof. A LINUX DO thread is both social proof and a two-way
    // referral: the listing points at the discussion, the discussion points
    // back here. Curated by hand, never scraped.
    linuxdoUrl: text("linuxdo_url"),
    linuxdoTitle: text("linuxdo_title"),
    linuxdoVerifiedAt: integer("linuxdo_verified_at", { mode: "timestamp" }),

    // What happened when the plugin was actually installed, in a throwaway
    // container on a machine that had never seen it. `installStatus` is one of
    // passed / needs-approval / not-a-layer / failed / timeout, and it is the
    // one field here that no competitor can scrape: it is the record of a run,
    // not of a repo. `incompatible` joined them with dsh 0.2, which refuses a
    // plugin whose dsh range does not cover it before installing anything.
    installStatus: text("install_status"),
    installDetail: text("install_detail"),
    blockedBuilds: text("blocked_builds"),
    installCheckedAt: integer("install_checked_at", { mode: "timestamp" }),
    // The dsh the verdict was produced on. Null for every verdict before
    // 18 Oct 2026 — all of them dsh 0.1 — which is how those get re-run.
    installDshVersion: text("install_dsh_version"),
    // When dsh refuses the latest release: the newest release it accepts and
    // what happened when that one was installed, as JSON
    // `{ version, status }`, or `{ version: null }` when no release fits.
    installFallback: text("install_fallback"),
    // The release known to install on `installDshVersion`, as a DSH plugin
    // index lists it: JSON `{ name, version, publishedAt, engines }`. The
    // latest release on `passed`, the fallback on `incompatible`; npm only.
    verifiedRelease: text("verified_release"),

    // The written verdict. Generated from the README, the repository signals
    // and — where one exists — the install result above, which is what keeps
    // it from being the same paragraph every other directory can generate.
    review: text("review"),
    reviewZh: text("review_zh"),
    reviewHtml: text("review_html"),
    reviewHtmlZh: text("review_html_zh"),
    reviewModel: text("review_model"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),

    // SEO rollout
    visibility: text("visibility").notNull().default("hidden"),
    indexedAt: integer("indexed_at", { mode: "timestamp" }),
    contentScore: integer("content_score").notNull().default(0),

    // Our own telemetry — the one ranking signal competitors cannot scrape.
    installCount: integer("install_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    syncedAt: integer("synced_at", { mode: "timestamp" }),
  },
  (t) => ({
    visibilityIdx: index("plugins_visibility_idx").on(t.visibility),
    categoryIdx: index("plugins_category_idx").on(t.categoryId),
    starsIdx: index("plugins_stars_idx").on(t.stars),
    pushedIdx: index("plugins_pushed_idx").on(t.repoPushedAt),
    ownerIdx: index("plugins_owner_idx").on(t.owner),
    // readme_md and readme_html (~230 MB together) sit mid-row, so reading any
    // later column of a row walks its README overflow pages: every catalogue
    // aggregate and every `?q=` search read the whole 370 MB table, 5–11 s on
    // the self-hosted sqld. These let those queries read a few MB of index
    // instead (migrations/0009 has the measurements). Keep a column a hot
    // query filters, sorts or aggregates on inside one of them.
    statsCoverIdx: index("plugins_stats_cover_idx").on(
      t.isArchived,
      t.installStatus,
      t.installDshVersion,
      t.visibility,
      t.syncedAt,
      t.installFallback,
    ),
    searchCoverIdx: index("plugins_search_cover_idx").on(
      t.isArchived,
      t.stars,
      t.installStatus,
      t.fullName,
      t.name,
      t.summary,
      t.summaryZh,
      t.tags,
      t.npmPackage,
    ),
    searchStatusIdx: index("plugins_search_status_idx").on(
      t.isArchived,
      t.installStatus,
      t.stars,
      t.fullName,
      t.name,
      t.summary,
      t.summaryZh,
      t.tags,
      t.npmPackage,
    ),
    linuxdoStarsIdx: index("plugins_linuxdo_stars_idx")
      .on(t.isArchived, t.stars)
      .where(sql`${t.linuxdoUrl} IS NOT NULL`),
    linuxdoRecentIdx: index("plugins_linuxdo_recent_idx")
      .on(t.isArchived, t.linuxdoVerifiedAt, t.stars)
      .where(sql`${t.linuxdoUrl} IS NOT NULL`),
    visibilitySlugIdx: index("plugins_visibility_slug_idx").on(t.visibility, t.slug),
    installCountIdx: index("plugins_install_count_idx").on(t.isArchived, t.installCount),
    // One per catalogue sort inside a category (orderFor in lib/data.ts), so a
    // category page reads 24 rows, not the category; the stars one also covers
    // getCategoriesWithCounts, which read ~3 GB of pages per call without it.
    categoryStarsIdx: index("plugins_category_stars_idx").on(t.categoryId, t.isArchived, t.stars),
    categoryPushedIdx: index("plugins_category_pushed_idx").on(
      t.categoryId,
      t.isArchived,
      t.repoPushedAt,
    ),
    categoryCreatedIdx: index("plugins_category_created_idx").on(
      t.categoryId,
      t.isArchived,
      t.createdAt,
    ),
    categoryNameIdx: index("plugins_category_name_idx").on(t.categoryId, t.isArchived, t.fullName),
    categoryInstallsIdx: index("plugins_category_installs_idx").on(
      t.categoryId,
      t.isArchived,
      t.installCount,
    ),
    categoryLinuxdoIdx: index("plugins_category_linuxdo_idx")
      .on(t.categoryId, t.isArchived)
      .where(sql`${t.linuxdoUrl} IS NOT NULL`),
    archivedCreatedIdx: index("plugins_archived_created_idx").on(t.isArchived, t.createdAt),
    npmPackageIdx: index("plugins_npm_package_idx").on(t.npmPackage),
    // The upgrade check looks up to 100 pasted names per request, uncached
    // (the keys are the caller's), and every column it reads sits past the
    // README. Covering them keeps one request at a few index pages instead of
    // a hundred README overflow chains. migrations/0012.
    compatCoverIdx: index("plugins_compat_cover_idx").on(
      t.fullName,
      t.isArchived,
      t.installStatus,
      t.installDshVersion,
      t.npmPackage,
      t.visibility,
      t.slug,
      t.stars,
    ),
  }),
);

/**
 * Every verdict the catalogue has ever published, append-only.
 *
 * The plugins table keeps only the latest run, and the nightly re-checks ~150
 * listings a night — so "installed last month, broke this month" was being
 * destroyed at the moment it was produced. Rows are keyed by fullName rather
 * than plugin id because a listing can be deleted (two harness rows were) and
 * its run record should outlive it.
 *
 * A retraction marks the row instead of deleting it: the run happened, we
 * just no longer stand behind what it said about the plugin.
 */
export const installRuns = sqliteTable(
  "install_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fullName: text("full_name").notNull(),
    // The exact command this verdict is about. Null only on rows backfilled
    // from before this table existed — the old columns never stored it.
    install: text("install"),
    status: text("status").notNull(),
    detail: text("detail"),
    blockedBuilds: text("blocked_builds"),
    // Null until the probe starts emitting them; the pnpm 10/11 split already
    // proved the interpreter version changes the verdict.
    dshVersion: text("dsh_version"),
    pnpmVersion: text("pnpm_version"),
    ranAt: integer("ran_at", { mode: "timestamp" }).notNull(),
    retractedAt: integer("retracted_at", { mode: "timestamp" }),
  },
  (t) => ({
    nameRanIdx: index("install_runs_name_ran_idx").on(t.fullName, t.ranAt),
  }),
);

/**
 * Installs on an upcoming dsh — npm `next` or `alpha` — of plugins that pass
 * on `latest`, so a reader can see what an upgrade would stop installing.
 *
 * Its own table on purpose: nothing here is a verdict the catalogue
 * publishes. `plugins.install_*` and `install_runs` describe `latest`, and
 * retraction reads them; a preview row reaching either would put a release
 * most people do not run on the listing. Append-only, like install_runs; the
 * latest row per (full_name, dsh_tag) is the answer.
 */
export const compatRuns = sqliteTable(
  "compat_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fullName: text("full_name").notNull(),
    /** The dist-tag the image was built from: `next` or `alpha`. */
    dshTag: text("dsh_tag").notNull(),
    /** What the tag resolved to when it ran; a tag moves, this does not. */
    dshVersion: text("dsh_version").notNull(),
    install: text("install"),
    status: text("status").notNull(),
    detail: text("detail"),
    ranAt: integer("ran_at", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    // Latest per (plugin, tag) for the API's pasted names.
    nameTagRanIdx: index("compat_runs_name_tag_ran_idx").on(t.fullName, t.dshTag, t.ranAt),
    // Latest per plugin on one release of a tag: the summary and the export.
    tagVersionIdx: index("compat_runs_tag_version_idx").on(
      t.dshTag,
      t.dshVersion,
      t.fullName,
      t.ranAt,
    ),
  }),
);

/** Daily snapshots, so "trending" is measured rather than guessed. */
export const pluginStats = sqliteTable(
  "plugin_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pluginId: integer("plugin_id")
      .notNull()
      .references(() => plugins.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD
    stars: integer("stars").notNull().default(0),
    installs: integer("installs").notNull().default(0),
    views: integer("views").notNull().default(0),
  },
  (t) => ({
    pluginDayIdx: index("plugin_stats_plugin_day_idx").on(t.pluginId, t.day),
    // The trending page reads one day across every plugin; without this that
    // is a scan of the whole history, which Turso bills row by row.
    dayIdx: index("plugin_stats_day_idx").on(t.day),
  }),
);

/**
 * Repositories the admission bar has already turned away, so it does not pay
 * for them again.
 *
 * The `dsh-plugin` topic holds thousands of repositories and admits about one
 * in twenty. Deciding costs two API calls — the manifest and the commit count
 * — and without this table every rejected repository was re-examined every
 * night. The bill grows with the topic, not with our catalogue, and it grew
 * past the hourly ceiling: the first scheduled run spent 109 of its 120
 * minutes asleep waiting for a quota reset, and was cancelled.
 *
 * `pushedAt` is the invalidator, and it is exact rather than a heuristic:
 * neither the manifest nor the commit count can change without a push. Search
 * results carry it, so re-checking costs nothing.
 */
export const ingestRejections = sqliteTable("ingest_rejections", {
  fullName: text("full_name").primaryKey(),
  reason: text("reason").notNull(),
  pushedAt: integer("pushed_at", { mode: "timestamp" }).notNull(),
  checkedAt: integer("checked_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * One row per published weekly report, keyed by the snapshot day its week
 * ends on. The issue is stored rather than recomputed because a past week
 * must read the same next month: plugins get renamed, hidden and deleted, and
 * a recomputed issue would quietly rewrite what we said at the time. `data`
 * is language-neutral JSON (`WeeklyData` in `lib/weekly.ts`); the pages and
 * the Markdown render the words.
 */
export const weeklyReports = sqliteTable("weekly_reports", {
  day: text("day").primaryKey(), // YYYY-MM-DD, a plugin_stats day
  data: text("data").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** Community submissions awaiting review. */
export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  repoUrl: text("repo_url").notNull(),
  note: text("note"),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  plugins: many(plugins),
}));

export const pluginsRelations = relations(plugins, ({ one, many }) => ({
  category: one(categories, {
    fields: [plugins.categoryId],
    references: [categories.id],
  }),
  stats: many(pluginStats),
}));

export const pluginStatsRelations = relations(pluginStats, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginStats.pluginId],
    references: [plugins.id],
  }),
}));

export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;
export type Category = typeof categories.$inferSelect;
