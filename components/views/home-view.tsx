import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PluginCard } from "@/components/plugin-card";
import { CopyCommand } from "@/components/copy-command";
import { CategoryChip, categoryName } from "@/components/views/catalogue-view";
import { t } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";
import {
  getPlugins,
  getCategoriesWithCounts,
  getCatalogStats,
  getLinuxDoPlugins,
} from "@/lib/data";

/**
 * The landing page. Browsing lives at /plugins now: one URL that answers
 * "what is this and why" and a separate one that answers "show me everything"
 * beats a single page that silently became a different page once a query
 * string was attached.
 */
export async function HomeView({ locale }: { locale: Locale }) {
  const [{ plugins: featured }, categories, stats, linuxdo] = await Promise.all([
    getPlugins({ sort: "stars", perPage: 24, page: 1 }),
    getCategoriesWithCounts(),
    getCatalogStats(),
    getLinuxDoPlugins(6),
  ]);

  const d = t(locale);

  return (
    <main>
      <Hero locale={locale} stats={stats} />

      <section className="mx-auto max-w-shell px-5 pt-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-2">
            <p className="eyebrow">{d.featured.eyebrow}</p>
            <h2 className="display text-section">{d.featured.heading}</h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              {d.featured.lede}
            </p>
          </div>
          <Link
            href={localePath(locale, "/plugins")}
            className="inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-copper"
          >
            {d.featured.viewAll(stats.total.toLocaleString())}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 9).map((p) => (
            <PluginCard key={p.id} plugin={p} locale={locale} />
          ))}
        </div>

        {/* The category rail is the internal-linking layer: every one of these
            is a crawlable, indexable facet of the catalogue. */}
        <nav
          aria-label={d.browse.categoriesLabel}
          className="-mx-1 flex flex-wrap gap-1 px-1 pt-5"
        >
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              href={`${localePath(locale, "/plugins")}?category=${c.id}`}
              label={categoryName(c, locale)}
              count={c.pluginCount}
              active={false}
            />
          ))}
        </nav>
      </section>

      {linuxdo.length > 0 ? (
        <LinuxDo locale={locale} plugins={linuxdo} />
      ) : null}

      <HowItWorks locale={locale} />
      <Faq locale={locale} />
    </main>
  );
}

/**
 * The one section here that cannot be generated from GitHub metadata: plugins
 * whose authors posted them on LINUX DO, with the thread linked. Hidden
 * entirely when there is nothing verified, rather than shown empty.
 */
function LinuxDo({
  locale,
  plugins,
}: {
  locale: Locale;
  plugins: Awaited<ReturnType<typeof getLinuxDoPlugins>>;
}) {
  const d = t(locale).linuxdo;

  return (
    <section
      id="linuxdo"
      className="mx-auto max-w-shell scroll-mt-16 px-5 pt-20 sm:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-copper pb-5">
        <div className="space-y-2">
          <p className="eyebrow text-copper">{d.eyebrow}</p>
          <h2 className="display text-section">{d.heading}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {d.lede}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {d.submitPrompt}{" "}
          <Link
            href={localePath(locale, "/contact")}
            className="text-copper underline underline-offset-4"
          >
            {d.submitCta}
          </Link>
        </p>
      </div>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((p) => (
          <PluginCard key={p.id} plugin={p} locale={locale} />
        ))}
      </div>

      <div className="pt-4">
        <Link
          href={`${localePath(locale, "/plugins")}?linuxdo=1`}
          className="inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-copper"
        >
          {d.filter}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function Faq({ locale }: { locale: Locale }) {
  const d = t(locale).faq;

  return (
    <section
      id="faq"
      className="mx-auto max-w-shell scroll-mt-16 px-5 pt-20 sm:px-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: locale === "zh" ? "zh-Hans" : "en",
            mainEntity: d.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      <div className="space-y-2 border-b border-border pb-5">
        <p className="eyebrow">{d.eyebrow}</p>
        <h2 className="display max-w-2xl text-section">{d.heading}</h2>
      </div>

      <div className="divide-y divide-border border-b border-border">
        {d.items.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base font-medium marker:content-none">
              {item.q}
              <span
                aria-hidden
                className="mt-1 shrink-0 font-mono text-copper transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Hero({
  locale,
  stats,
}: {
  locale: Locale;
  stats: { total: number; indexed: number; lastSynced: Date | null };
}) {
  const d = t(locale).hero;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-shell px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-16">
          <div className="space-y-6">
            <p className="eyebrow">{d.eyebrow}</p>
            {/* The head term leads the H1 verbatim in both languages. */}
            <h1
              className={
                locale === "zh"
                  ? "display max-w-[26ch] text-hero"
                  : "display max-w-[16ch] text-hero"
              }
            >
              {locale === "zh" ? (
                // Keeps the product name off a line break. It is the head
                // term; splitting "DeepSeek" from "Harness" across two lines
                // is the one break this headline cannot take.
                <span className="whitespace-nowrap">{d.h1a}</span>
              ) : (
                d.h1a
              )}{" "}
              <span className="text-copper">{d.h1b}</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
              {d.lede(stats.total.toLocaleString())}{" "}
              <code className="whitespace-nowrap font-mono text-[0.9em] text-foreground">
                dsh-plugin
              </code>
              {d.ledeTail}
            </p>
          </div>

          <div id="install" className="space-y-3 scroll-mt-20">
            <p className="eyebrow">{d.installEyebrow}</p>
            <CopyCommand
              size="lg"
              locale={locale}
              command="npx dshmarketplace-cli add owner/repo"
              className="bg-card"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {d.installNote}
            </p>
            <Link
              href={localePath(locale, "/plugins")}
              className="inline-flex items-center gap-1.5 pt-1 text-sm text-foreground transition-colors hover:text-copper"
            >
              {d.browse}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          <Stat label={d.statPlugins} value={stats.total.toLocaleString()} />
          <Stat label={d.statCategories} value="14" />
          <Stat label={d.statPages} value={stats.indexed.toLocaleString()} />
          <Stat
            label={d.statSynced}
            value={
              stats.lastSynced
                ? stats.lastSynced.toISOString().slice(0, 10)
                : "—"
            }
          />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-4 py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular display mt-1.5 text-xl">{value}</dd>
    </div>
  );
}

function HowItWorks({ locale }: { locale: Locale }) {
  const d = t(locale).how;

  return (
    <section
      id="how"
      className="mx-auto max-w-shell scroll-mt-16 px-5 pt-20 sm:px-8"
    >
      <div className="space-y-2 border-b border-border pb-5">
        <p className="eyebrow">{d.eyebrow}</p>
        <h2 className="display max-w-2xl text-section">{d.heading}</h2>
      </div>

      <div className="grid gap-px border-x border-b border-border bg-border sm:grid-cols-3">
        {d.steps.map((step, i) => (
          <div key={step.title} className="space-y-3 bg-background p-6">
            <p className="tabular font-mono text-xs text-copper">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="display text-lg">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
