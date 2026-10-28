import type { Metadata } from "next";
import Link from "next/link";

import { t } from "@/lib/dict";
import { absoluteUrl, alternatesFor, HTML_LANG, localePath, type Locale } from "@/lib/i18n";
import { OG_COVER, OG_LOCALE } from "@/lib/social";
import { listWeeklyIssues, type WeeklyIssue, type WeeklyRefusal, type WeeklyRow } from "@/lib/weekly";
import { directory } from "@/directory.config";

/**
 * The plugin's page when it has one, the repo when it does not. Visibility is
 * the one recorded with the issue: a past week links the way it did then.
 */
function PluginLink({ row, locale }: { row: WeeklyRow; locale: Locale }) {
  const className = "font-mono text-sm text-foreground transition-colors hover:text-copper";
  return row.visibility === "hidden" ? (
    <a href={row.repoUrl} rel="noopener" className={className}>
      {row.fullName}
    </a>
  ) : (
    <Link href={localePath(locale, `/plugins/${row.slug}`)} className={className}>
      {row.fullName}
    </Link>
  );
}

function Ranking({
  heading,
  rows,
  metric,
  locale,
}: {
  heading: string;
  rows: WeeklyRow[];
  metric: (n: number) => string;
  locale: Locale;
}) {
  const d = t(locale);
  return (
    <section className="space-y-4">
      <h2 className="display text-xl">{heading}</h2>
      {rows.length ? (
        <ol className="grid list-none gap-px border border-border bg-border p-0 md:grid-cols-2">
          {rows.map((p, i) => {
            const summary = locale === "zh" ? (p.summaryZh ?? p.summary) : p.summary;
            return (
              <li key={p.fullName} className="flex flex-col gap-2 bg-background px-4 py-3">
                <p className="flex items-baseline justify-between font-mono text-xs">
                  <span className="text-copper">{d.top.rank(i + 1)}</span>
                  <span className="text-muted-foreground">{metric(p.metric)}</span>
                </p>
                <PluginLink row={p} locale={locale} />
                {summary ? (
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{summary}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{d.weekly.none}</p>
      )}
    </section>
  );
}

function Refusals({ rows, locale }: { rows: WeeklyRefusal[]; locale: Locale }) {
  const d = t(locale).weekly;
  if (!rows.length) return null;
  return (
    <ul className="divide-y divide-border border border-border">
      {rows.map((p) => {
        const f = p.fallback;
        const fix = f?.status === "passed" && p.npm && f.version ? `${p.npm}@${f.version}` : null;
        return (
          <li key={p.fullName} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2">
            <PluginLink row={p} locale={locale} />
            <span className={`font-mono text-xs ${fix ? "" : "text-muted-foreground"}`}>{fix ?? d.noFit}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function weeklyListMetadata(locale: Locale): Metadata {
  const d = t(locale).weekly;
  return {
    title: d.listMetaTitle,
    description: d.listMetaDescription,
    alternates: alternatesFor(locale, "/weekly"),
  };
}

/** Article cards, so a link to an issue shared in a forum reads as that issue. */
export function weeklyIssueMetadata(issue: WeeklyIssue, locale: Locale): Metadata {
  const d = t(locale).weekly;
  const { from, day, totals } = issue.data;
  const title = d.issueMetaTitle(from, day);
  const description = d.issueMetaDescription(from, day, totals.added);
  return {
    title,
    description,
    alternates: alternatesFor(locale, `/weekly/${day}`),
    openGraph: {
      type: "article",
      siteName: directory.name,
      url: absoluteUrl(locale, `/weekly/${day}`),
      title,
      description,
      publishedTime: issue.createdAt.toISOString(),
      locale: OG_LOCALE[locale],
      images: [OG_COVER[locale]],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_COVER[locale]] },
  };
}

function ArticleJsonLd({ issue, locale }: { issue: WeeklyIssue; locale: Locale }) {
  const d = t(locale).weekly;
  const url = absoluteUrl(locale, `/weekly/${issue.day}`);
  const at = issue.createdAt.toISOString();
  const org = { "@type": "Organization", name: directory.name, url: directory.baseUrl };
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: d.issueTitle(issue.data.from, issue.day),
    description: d.lede(issue.data.totals.total, issue.data.totals.added),
    inLanguage: HTML_LANG[locale],
    datePublished: at,
    dateModified: at,
    url,
    mainEntityOfPage: url,
    author: org,
    publisher: org,
  });
  // Escaped so no string that reaches this object can close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json.replace(/</g, "\\u003c") }} />;
}

export function WeeklyIssueView({ issue, locale }: { issue: WeeklyIssue; locale: Locale }) {
  const d = t(locale).weekly;
  const w = issue.data;
  return (
    <main className="mx-auto max-w-shell px-5 sm:px-8">
      <ArticleJsonLd issue={issue} locale={locale} />
      <article className="space-y-14 py-12 sm:py-16">
        <header className="max-w-3xl space-y-3 border-b border-border pb-6">
          <nav className="text-xs text-muted-foreground">
            <Link href={localePath(locale, "/weekly")} className="transition-colors hover:text-copper">
              {d.allIssues}
            </Link>
          </nav>
          <p className="eyebrow">{d.eyebrow}</p>
          <h1 className="display text-section">{d.issueTitle(w.from, w.day)}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            {d.lede(w.totals.total, w.totals.added)}
          </p>
          <p className="text-xs text-muted-foreground">{d.frozen(w.day)}</p>
        </header>

        {w.releases.length ? (
          <section className="space-y-4">
            <h2 className="display text-xl">{d.releasesHeading}</h2>
            <ul className="space-y-1 font-mono text-sm">
              {w.releases.map((r) => (
                <li key={r.version}>
                  {r.version} <span className="text-muted-foreground">· {r.day}{r.tag ? ` · npm ${r.tag}` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Ranking heading={d.arrivedHeading} rows={w.arrived} metric={d.starsMetric} locale={locale} />
        <Ranking heading={d.risingHeading} rows={w.rising} metric={d.gainedMetric} locale={locale} />
        <Ranking heading={d.installedHeading} rows={w.installed} metric={d.installsMetric} locale={locale} />

        {w.compat ? (
          <section className="space-y-4">
            <h2 className="display text-xl">{d.compatHeading(w.compat.dsh)}</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {d.compatBody(w.compat.dsh, w.compat.tested, w.compat.refused, w.compat.rescued)}{" "}
              <Link href={localePath(locale, "/install-failed")} className="text-foreground underline hover:text-copper">
                {d.compatHelp}
              </Link>
              {d.cliLead} <code className="font-mono text-foreground">{d.cliCommand}</code>
              {d.cliTail}
            </p>
            <Refusals rows={w.refused} locale={locale} />
          </section>
        ) : null}
      </article>
    </main>
  );
}

export async function WeeklyListView({ locale }: { locale: Locale }) {
  const d = t(locale).weekly;
  const issues = await listWeeklyIssues();
  return (
    <main className="mx-auto max-w-shell px-5 sm:px-8">
      <div className="space-y-10 py-12 sm:py-16">
        <header className="max-w-3xl space-y-3 border-b border-border pb-6">
          <p className="eyebrow">{d.eyebrow}</p>
          <h1 className="display text-section">{d.listTitle}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{d.listLede}</p>
        </header>
        {issues.length ? (
          <ol className="max-w-3xl list-none divide-y divide-border border-y border-border p-0">
            {issues.map((issue) => (
              <li key={issue.day}>
                <Link
                  href={localePath(locale, `/weekly/${issue.day}`)}
                  className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <span className="display text-lg transition-colors group-hover:text-copper">
                    {d.issueTitle(issue.from, issue.day)}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {d.listItem(issue.total, issue.added)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{d.noIssues}</p>
        )}
      </div>
    </main>
  );
}
