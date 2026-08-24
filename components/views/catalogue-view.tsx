import Link from "next/link";
import { CircleCheck, Search } from "lucide-react";

import { PluginCard } from "@/components/plugin-card";
import { t, type Dict } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";
import {
  getPlugins,
  getCategoriesWithCounts,
  getCatalogStats,
  type SortKey,
} from "@/lib/data";
import type { Category } from "@/db/schema";

export type CatalogueParams = {
  q?: string;
  linuxdo?: string;
  category?: string;
  sort?: string;
  page?: string;
  per?: string;
};

const SORT_KEYS: SortKey[] = ["stars", "updated", "new", "name"];

function sortLabels(d: Dict): Record<string, string> {
  return {
    stars: d.browse.sortStars,
    updated: d.browse.sortUpdated,
    new: d.browse.sortNew,
    name: d.browse.sortName,
  };
}

function buildHref(
  locale: Locale,
  base: CatalogueParams,
  patch: Partial<CatalogueParams>,
) {
  const root = localePath(locale, "/plugins");
  const merged = { ...base, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && !(k === "page" && v === "1")) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${root}?${qs}` : root;
}

/** Category names are stored bilingually; only the label swaps. */
export function categoryName(c: Category, locale: Locale) {
  return locale === "zh" ? (c.nameZh ?? c.name) : c.name;
}

export async function CatalogueView({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: CatalogueParams;
}) {
  const d = t(locale);
  const sp = searchParams;
  const sort = (SORT_KEYS.find((s) => s === sp.sort) ?? "stars") as SortKey;

  const [{ plugins, total, page, totalPages }, categories, stats] =
    await Promise.all([
      getPlugins({
        q: sp.q,
        category: sp.category,
        linuxdo: sp.linuxdo === "1",
        sort,
        page: Number(sp.page) || 1,
        perPage: Number(sp.per) || 24,
      }),
      getCategoriesWithCounts(),
      getCatalogStats(),
    ]);

  const activeCategory = categories.find((c) => c.id === sp.category);
  const labels = sortLabels(d);

  return (
    <main className="mx-auto max-w-shell px-5 pt-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <p className="eyebrow">{d.browse.eyebrow}</p>
          <h1 className="display text-section">
            {activeCategory
              ? categoryName(activeCategory, locale)
              : d.browse.heading}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {activeCategory?.description ?? d.browse.lede}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular text-sm text-muted-foreground">
            <span className="text-foreground">{total.toLocaleString()}</span>{" "}
            {d.browse.unit(total === 1)}
            {sp.q ? d.browse.matching(sp.q) : null}
          </p>
          {/* The unscrapeable signal, kept next to the count: not just how many
              plugins, but how many we actually installed. */}
          {stats.installRate != null ? (
            <p className="mt-1 flex items-center justify-end gap-1.5 text-xs text-copper">
              <CircleCheck className="h-3 w-3 shrink-0" aria-hidden />
              {d.browse.installVerified(stats.installRate)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="sticky top-14 z-30 -mx-5 border-b border-border bg-background/90 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <form action={localePath(locale, "/plugins")} className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          {sp.category ? (
            <input type="hidden" name="category" value={sp.category} />
          ) : null}
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder={d.browse.searchPlaceholder}
            aria-label={d.browse.searchLabel}
            className="h-10 w-full border border-border bg-paper-sunken pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-copper"
          />
        </form>

        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
          <nav
            aria-label={d.browse.categoriesLabel}
            className="-mx-1 flex min-w-0 flex-1 flex-wrap gap-1 px-1"
          >
            <CategoryChip
              href={buildHref(locale, sp, { category: undefined, page: "1" })}
              label={d.browse.all}
              count={stats.total}
              active={!sp.category && sp.linuxdo !== "1"}
            />
            <Link
              href={buildHref(locale, sp, {
                linuxdo: sp.linuxdo === "1" ? undefined : "1",
                category: undefined,
                page: "1",
              })}
              rel="nofollow"
              className={
                sp.linuxdo === "1"
                  ? "flex shrink-0 items-center gap-1.5 border border-copper bg-copper px-2.5 py-1 text-xs text-paper"
                  : "flex shrink-0 items-center gap-1.5 border border-copper px-2.5 py-1 text-xs text-copper transition-colors hover:bg-copper hover:text-paper"
              }
            >
              {d.linuxdo.filter}
            </Link>
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                href={buildHref(locale, sp, { category: c.id, page: "1" })}
                label={categoryName(c, locale)}
                count={c.pluginCount}
                active={sp.category === c.id}
              />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="eyebrow">{d.browse.sort}</span>
            {SORT_KEYS.map((key) => (
              <Link
                key={key}
                href={buildHref(locale, sp, { sort: key, page: "1" })}
                rel="nofollow"
                className={
                  sort === key
                    ? "whitespace-nowrap text-foreground underline decoration-copper decoration-2 underline-offset-4"
                    : "whitespace-nowrap transition-colors hover:text-foreground"
                }
              >
                {labels[key]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {plugins.length === 0 ? (
        <EmptyState locale={locale} query={sp.q} />
      ) : (
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((p) => (
            <PluginCard key={p.id} plugin={p} locale={locale} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label={d.browse.pagination}
          className="flex items-center justify-between gap-4 border-t border-border py-5 text-sm"
        >
          {page > 1 ? (
            <Link
              href={buildHref(locale, sp, { page: String(page - 1) })}
              rel="prev nofollow"
              className="transition-colors hover:text-copper"
            >
              {d.browse.prev}
            </Link>
          ) : (
            <span />
          )}
          <span className="tabular text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref(locale, sp, { page: String(page + 1) })}
              rel="next nofollow"
              className="transition-colors hover:text-copper"
            >
              {d.browse.next}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}

export function CategoryChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex shrink-0 items-center gap-1.5 border border-ink bg-ink px-2.5 py-1 text-xs text-paper"
          : "flex shrink-0 items-center gap-1.5 border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-rule-strong hover:text-foreground"
      }
    >
      {label}
      <span className="tabular opacity-60">{count}</span>
    </Link>
  );
}

function EmptyState({ locale, query }: { locale: Locale; query?: string }) {
  const d = t(locale).browse;

  return (
    <div className="border border-border px-6 py-20 text-center">
      <p className="display text-xl">{d.emptyTitle(query)}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {d.emptyBodyA} <code className="font-mono">dsh-*</code> {d.emptyBodyB}
      </p>
      <Link
        href={localePath(locale, "/plugins")}
        className="mt-5 inline-block text-sm text-copper hover:underline"
      >
        {d.clear}
      </Link>
    </div>
  );
}
