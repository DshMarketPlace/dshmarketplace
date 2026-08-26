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
    // not of a repo.
    installStatus: text("install_status"),
    installDetail: text("install_detail"),
    blockedBuilds: text("blocked_builds"),
    installCheckedAt: integer("install_checked_at", { mode: "timestamp" }),

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
