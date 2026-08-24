import Link from "next/link";
import { ArrowRight, CircleCheck, Search } from "lucide-react";

import { PluginCard } from "@/components/plugin-card";
import { CopyCommand } from "@/components/copy-command";
import { CategoryChip, categoryName } from "@/components/views/catalogue-view";
import { t } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";
import { PRESETS } from "@/lib/presets";
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
  const [{ plugins: featured }, categories, stats, linuxdo] = await Promise.all(
    [
      getPlugins({ sort: "stars", perPage: 24, page: 1 }),
      getCategoriesWithCounts(),
      getCatalogStats(),
      getLinuxDoPlugins(6),
    ],
  );

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

      <Presets locale={locale} />
      <HowItWorks locale={locale} />
      <Faq locale={locale} />
      <InstallSection locale={locale} />
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
  stats: {
    total: number;
    indexed: number;
    lastSynced: Date | null;
    installTested: number;
    installRate: number | null;
  };
}) {
  const d = t(locale).hero;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-shell px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        {/* Stacked and centred rather than split. Against a headline this
            size a sidebar reads as a leftover column, and the command is the
            one thing the page is asking you to take — it belongs on the
            centre line, directly under the sentence that promises it. */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="eyebrow">{d.eyebrow}</p>
          {/* The head term leads the H1 verbatim in both languages. The two
              halves are separate blocks so the break always lands at the
              comma: balanced wrapping picked "plugins, one" instead, which
              splits the sentence at its weakest joint. */}
          <h1 className="display mt-5 max-w-[24ch] text-hero">
            {locale === "zh" ? (
              // Keeps the product name off a line break. It is the head
              // term; splitting "DeepSeek" from "Harness" across two lines
              // is the one break this headline cannot take.
              <span className="block sm:whitespace-nowrap">{d.h1a}</span>
            ) : (
              <span className="block text-balance">{d.h1a}</span>
            )}
            <span className="block text-balance text-copper">{d.h1b}</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-pretty text-base leading-relaxed text-muted-foreground">
            {d.lede(stats.total.toLocaleString())}{" "}
            <code className="whitespace-nowrap font-mono text-[0.9em] text-foreground">
              dsh-plugin
            </code>
            {d.ledeTail}
          </p>
        </div>

        {/* Search box: the primary action for discovery. Moved outside the
            centred max-w-4xl container so it aligns with the stats grid. */}
        <div className="mt-10 flex w-full justify-center">
          <form
            action={localePath(locale, "/plugins")}
            className="relative w-full"
          >
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-copper"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              placeholder={d.searchPlaceholder}
              aria-label={d.searchPlaceholder}
              className="hover:border-copper/50 focus:ring-copper/20 h-14 w-full border-2 border-border bg-card pl-12 pr-32 text-base font-medium outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground focus:border-copper focus:ring-2"
            />
            <button
              type="submit"
              className="hover:bg-copper/90 absolute right-2 top-1/2 -translate-y-1/2 bg-copper px-6 py-2.5 text-sm font-medium text-paper transition-colors focus:outline-none focus:ring-2 focus:ring-copper focus:ring-offset-2"
            >
              {d.searchAction}
            </button>
          </form>
        </div>

        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Link
            href={localePath(locale, "/plugins")}
            className="mt-7 inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-copper"
          >
            {d.browse}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          <Stat label={d.statPlugins} value={stats.total.toLocaleString()} />
          <Stat
            label={d.statTested}
            value={stats.installTested.toLocaleString()}
          />
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

        {/* The claim that separates this from a GitHub mirror: we ran the
            installs. Stated in words, with the tested count and a link to how,
            so the number is auditable rather than asserted. Hidden when nothing
            has been tested rather than printing a bare 0%. */}
        {stats.installRate != null ? (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted-foreground">
            <CircleCheck className="h-4 w-4 shrink-0 text-copper" aria-hidden />
            <span>{d.installVerifiedLead(stats.installRate, stats.installTested.toLocaleString())}</span>
            <Link
              href={`${localePath(locale, "/api-docs")}#install-check`}
              className="whitespace-nowrap text-copper underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {d.installMethodologyCta} ›
            </Link>
          </p>
        ) : null}
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

/**
 * Sets, on the page where people are deciding what to install.
 *
 * Reads the static PRESETS rather than the joined view the /presets page uses —
 * the homepage needs the names and the evidence, not each member's summary, and
 * this way the section costs no extra query on the busiest route.
 */
function Presets({ locale }: { locale: Locale }) {
  const d = t(locale).presets;

  return (
    <section
      id="presets"
      className="mx-auto max-w-shell scroll-mt-16 px-5 pt-20 sm:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <p className="eyebrow">{d.eyebrow}</p>
          <h2 className="display max-w-2xl text-section">{d.heading}</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {d.lede}
          </p>
        </div>
        <Link
          href={localePath(locale, "/presets")}
          className="inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-copper"
        >
          {d.viewAll}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-px border-x border-b border-border bg-border sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <Link
            key={preset.id}
            href={`${localePath(locale, "/presets")}#${preset.id}`}
            className="group bg-background p-5 transition-colors hover:bg-card"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold group-hover:text-copper">
                {preset.name[locale]}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {d.countLabel(preset.plugins.length)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {preset.blurb[locale]}
            </p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {d.verifiedOn} {preset.verified.at} · dsh {preset.verified.dsh}
            </p>
          </Link>
        ))}
      </div>

      <div className="pt-8">
        <p className="mb-2 text-sm font-medium">{d.installAll}</p>
        <CopyCommand
          size="lg"
          locale={locale}
          command="npx dshmarketplace-cli preset essentials"
          className="max-w-xl bg-card"
        />
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {d.installNote}
        </p>
      </div>
    </section>
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

function InstallSection({ locale }: { locale: Locale }) {
  const d = t(locale).hero;

  return (
    <section
      id="install"
      className="mx-auto max-w-shell scroll-mt-16 px-5 pt-20 sm:px-8"
    >
      <div className="space-y-2 border-b border-border pb-5">
        <p className="eyebrow">{d.installEyebrow}</p>
        <h2 className="display max-w-2xl text-section">
          {d.installSectionHeading}
        </h2>
      </div>

      <div className="pb-12 pt-8">
        <CopyCommand
          size="lg"
          locale={locale}
          command="npx dshmarketplace-cli add owner/repo"
          className="max-w-xl bg-card"
        />
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {d.installNote}
        </p>
      </div>
    </section>
  );
}
