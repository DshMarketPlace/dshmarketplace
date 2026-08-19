import Link from "next/link";
import { Star, GitFork, ExternalLink, MessagesSquare, Sparkles } from "lucide-react";

import { PluginCard } from "@/components/plugin-card";
import { CopyCommand } from "@/components/copy-command";
import { InstallCheck } from "@/components/install-check";
import { installOptions, installKindLabel } from "@/lib/install";
import { t } from "@/lib/dict";
import {
  absoluteUrl,
  localePath,
  relativeTime,
  riskList,
  HTML_LANG,
  type Locale,
} from "@/lib/i18n";
import { getRelatedPlugins } from "@/lib/data";
import { directory } from "@/directory.config";
import type { Plugin } from "@/db/schema";

/** The Chinese summary is written by the registry, not machine-translated. */
export function summaryFor(plugin: Plugin, locale: Locale) {
  return locale === "zh" ? (plugin.summaryZh ?? plugin.summary) : plugin.summary;
}

/**
 * Falls back to English rather than rendering nothing: a page with an English
 * overview beats a Chinese page with a hole in it, and the fallback is visible
 * in the DB so it is obvious what still needs writing.
 */
function overviewFor(plugin: Plugin, locale: Locale) {
  return locale === "zh"
    ? (plugin.overviewHtmlZh ?? plugin.overviewHtml)
    : plugin.overviewHtml;
}

function docsFor(plugin: Plugin, locale: Locale) {
  return locale === "zh"
    ? (plugin.docsHtmlZh ?? plugin.docsHtml)
    : plugin.docsHtml;
}

function reviewFor(plugin: Plugin, locale: Locale) {
  return locale === "zh"
    ? (plugin.reviewHtmlZh ?? plugin.reviewHtml)
    : (plugin.reviewHtml ?? plugin.reviewHtmlZh);
}

function JsonLd({ plugin, locale }: { plugin: Plugin; locale: Locale }) {
  const url = absoluteUrl(locale, `/plugins/${plugin.slug}`);
  const d = t(locale);

  const graph = [
    {
      "@type": "SoftwareApplication",
      name: plugin.fullName,
      applicationCategory: "DeveloperApplication",
      description: summaryFor(plugin, locale) ?? undefined,
      inLanguage: HTML_LANG[locale],
      image: plugin.illustration
        ? `${directory.baseUrl}${plugin.illustration}`
        : undefined,
      url,
      codeRepository: plugin.repoUrl,
      programmingLanguage: plugin.language ?? undefined,
      license: plugin.license ?? undefined,
      author: { "@type": "Person", name: plugin.owner },
      isAccessibleForFree: true,
      operatingSystem: "Cross-platform",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: d.plugin.breadcrumb,
          item: absoluteUrl(locale),
        },
        { "@type": "ListItem", position: 2, name: plugin.fullName, item: url },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}

export async function PluginView({
  plugin,
  locale,
}: {
  plugin: Plugin;
  locale: Locale;
}) {
  const d = t(locale).plugin;
  const related = await getRelatedPlugins(plugin);
  const flags: string[] = plugin.riskFlags ? JSON.parse(plugin.riskFlags) : [];
  const commands = installOptions(plugin, locale);
  const checkedAgo = relativeTime(plugin.installCheckedAt, locale);
  const summary = summaryFor(plugin, locale);
  const overview = overviewFor(plugin, locale);
  const docs = docsFor(plugin, locale);
  const review = reviewFor(plugin, locale);
  const dr = t(locale).review;

  return (
    <main className="mx-auto max-w-shell px-5 sm:px-8">
      <div className="max-w-3xl space-y-12 py-12">
        <JsonLd plugin={plugin} locale={locale} />

        <header className="space-y-5">
          <nav className="text-xs text-muted-foreground">
            <Link
              href={localePath(locale)}
              className="transition-colors hover:text-copper"
            >
              {d.breadcrumb}
            </Link>
            {plugin.categoryId ? (
              <>
                <span aria-hidden> / </span>
                <Link
                  href={`${localePath(locale)}?category=${plugin.categoryId}`}
                  className="transition-colors hover:text-copper"
                >
                  {plugin.categoryId}
                </Link>
              </>
            ) : null}
          </nav>

          <div className="space-y-2">
            <h1 className="display text-section">{plugin.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">
              {plugin.fullName}
            </p>
          </div>

          {summary ? (
            <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
              {summary}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" aria-hidden />
              {plugin.stars.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3 w-3" aria-hidden />
              {plugin.forks.toLocaleString()}
            </span>
            {plugin.language ? <span>{plugin.language}</span> : null}
            {plugin.license ? <span>{plugin.license}</span> : null}
            <a
              href={plugin.repoUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              {t(locale).card.source}
            </a>
            {plugin.linuxdoUrl ? (
              <a
                href={plugin.linuxdoUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1 hover:text-foreground hover:underline"
              >
                <MessagesSquare className="h-3 w-3" aria-hidden />
                {plugin.linuxdoTitle ?? t(locale).card.linuxdo}
              </a>
            ) : null}
          </div>
        </header>

        <section className="space-y-4">
          <div className="space-y-1.5">
            <p className="eyebrow">{d.installEyebrow}</p>
            <h2 className="display text-xl">{d.installHeading(plugin.name)}</h2>
          </div>
          {commands.length === 0 ? (
            <p className="border-l-2 border-copper pl-4 text-sm leading-relaxed text-muted-foreground">
              {t(locale).install.subpathUnsupported}
            </p>
          ) : null}
          {commands.map((c) => (
            <div key={c.label} className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {d.via(c.label)}
                {plugin.installKind !== "unknown" && c.label === "GitHub"
                  ? ` · ${installKindLabel(plugin.installKind, locale)}`
                  : null}
              </p>
              <CopyCommand command={c.cmd} size="lg" locale={locale} />
              {c.note ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {c.note}
                </p>
              ) : null}
            </div>
          ))}

          {plugin.installStatus ? (
            <div className="space-y-2 border border-border bg-card p-4">
              <p className="eyebrow">{t(locale).installCheck.heading}</p>
              <InstallCheck
                status={plugin.installStatus}
                locale={locale}
                className="text-xs"
              />
              {/* The two verdicts a reader can act on, so each says how rather
                  than leaving them to work out `allowBuilds`, or to read a
                  working install as a broken one. */}
              {plugin.installStatus === "needs-approval" ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(locale).installCheck.approvalHelp}
                </p>
              ) : null}
              {plugin.installStatus === "not-a-layer" ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(locale).installCheck.layerHelp}
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-ink-faint">
                {t(locale).installCheck.method}
                {checkedAgo
                  ? ` ${t(locale).installCheck.checkedAt(checkedAgo)}.`
                  : null}
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="space-y-1.5">
            <p className="eyebrow">{d.dueEyebrow}</p>
            <h2 className="display text-xl">{d.dueHeading(plugin.name)}</h2>
          </div>
          <ul className="space-y-2.5 border-l-2 border-copper pl-4 text-sm leading-relaxed text-muted-foreground">
            <li>
              {d.sourceOfRecord}{" "}
              <a
                href={plugin.repoUrl}
                target="_blank"
                rel="noopener"
                className="underline hover:text-foreground"
              >
                {plugin.owner}/{plugin.repo}
              </a>
              {plugin.inRegistry
                ? d.inRegistry
                : plugin.provenance === "submitted"
                  ? d.submittedByHand
                  : d.notInRegistry}
            </li>
            {plugin.license ? (
              <li>{d.licensed(plugin.license)}</li>
            ) : (
              <li>{d.noLicence}</li>
            )}
            {flags.length > 0 ? (
              <li className="text-copper">
                {d.detected(riskList(flags, locale))}
              </li>
            ) : null}
            <li>{d.notAReview}</li>
          </ul>
        </section>

        {review ? (
          // Above the overview on purpose: it is the shortest thing on the
          // page and the only part a reader can act on immediately. The
          // disclaimer is inside the panel rather than in a footnote — a
          // generated verdict that has to be hunted for is one that gets
          // quoted without it.
          <section className="space-y-3">
            <h2 className="display flex items-center gap-2 text-xl">
              <Sparkles className="h-4 w-4 text-copper" aria-hidden />
              {dr.heading}
            </h2>
            <div className="border-l-2 border-copper bg-paper-sunken px-5 py-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2.5 prose-strong:text-copper prose-code:before:content-none prose-code:after:content-none prose-code:font-normal"
                dangerouslySetInnerHTML={{ __html: review }}
              />
              <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                {plugin.reviewModel
                  ? dr.disclaimerWithModel(plugin.reviewModel)
                  : dr.disclaimer}
              </p>
            </div>
          </section>
        ) : null}

        {overview ? (
          <section className="space-y-4">
            <h2 className="display text-xl">
              {d.overviewHeading(plugin.name)}
            </h2>
            {plugin.illustration ? (
              // Commissioned per plugin, in the site's own palette. Not
              // decoration: it is the one element of a detail page that
              // cannot be scraped off the source repository.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={plugin.illustration}
                alt={plugin.illustrationAlt ?? ""}
                width={1000}
                height={1000}
                loading="lazy"
                decoding="async"
                // Capped rather than full-bleed: the illustrations are square,
                // and a square at the full measure pushes the prose a whole
                // screen down. Centred at half the column it reads as a plate
                // in a technical manual, which is the register the rest of the
                // page is already in.
                className="mx-auto block w-full max-w-sm border border-border bg-paper-sunken"
              />
            ) : null}
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: overview }}
            />
          </section>
        ) : null}

        {/*
          Our own reference section, not the imported README. The README is
          still stored — it is the source this was written from — but rendering
          it verbatim gave the page a wall of shields.io badges, the project's
          own language switcher and social links, and 18 KB byte-identical to
          what every competing directory scraped.
        */}
        {docs ? (
          <section className="space-y-3">
            <h2 className="display text-xl">{d.readmeHeading(plugin.name)}</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none prose-h3:mt-6 prose-h3:text-base prose-h3:font-semibold prose-code:before:content-none prose-code:after:content-none prose-code:font-normal"
              dangerouslySetInnerHTML={{ __html: docs }}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {d.docsNote}{" "}
              <a
                href={plugin.repoUrl}
                target="_blank"
                rel="noopener"
                className="underline hover:text-foreground"
              >
                {d.docsSource}
              </a>
            </p>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="space-y-4">
            <div className="space-y-1.5">
              <p className="eyebrow">{d.relatedEyebrow}</p>
              <h2 className="display text-xl">
                {d.relatedHeading(plugin.name)}
              </h2>
            </div>
            <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
              {related.map((p) => (
                <PluginCard key={p.id} plugin={p} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

/** Shared by both locales' generateMetadata. */
export function pluginMetaFor(plugin: Plugin, locale: Locale) {
  const d = t(locale).plugin;
  const summary = summaryFor(plugin, locale);
  return {
    title: d.metaTitle(plugin.name, plugin.owner),
    description: summary?.slice(0, 155) ?? d.metaFallback(plugin.name),
    url: `${directory.baseUrl}${localePath(locale, `/plugins/${plugin.slug}`)}`,
  };
}
