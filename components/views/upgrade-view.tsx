import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { UpgradeCheck } from "@/components/upgrade-check";
import { getCompatSummary, type CompatSummary } from "@/lib/compat";
import { PREVIEW_TAGS } from "@/lib/compat-summary";
import { t } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";
import { directory } from "@/directory.config";

/**
 * The release the page is about: the furthest-ahead tag that has run, as its
 * base version (`0.2.2-alpha.2` → `0.2.2`), which is what people search for.
 * Null until a run lands, so the title never names a release we have not
 * measured.
 */
export function upgradeVersion(summary: CompatSummary): string | null {
  for (const tag of [...PREVIEW_TAGS].reverse()) {
    const v = summary.tags[tag]?.version;
    if (v) return v.replace(/-.*$/, "");
  }
  return null;
}

function day(seconds: number | null): string {
  return seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : "—";
}

function Regressions({ summary, locale }: { summary: CompatSummary; locale: Locale }) {
  const d = t(locale).upgrade;
  const tags = PREVIEW_TAGS.filter((tag) => summary.tags[tag]);
  if (!summary.regressions.length) return <p>{d.regressionsEmpty}</p>;

  return (
    <div className="not-prose overflow-x-auto border border-border">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-paper-sunken text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{d.plugin}</th>
            <th className="px-3 py-2 font-medium">{d.stars}</th>
            {tags.map((tag) => (
              <th key={tag} className="px-3 py-2 font-medium">
                {tag} · {summary.tags[tag]?.version}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {summary.regressions.map((r) => (
            <tr key={r.fullName}>
              <td className="px-3 py-2 align-top">
                {r.visibility === "hidden" ? (
                  <a
                    href={`https://github.com/${r.fullName.split("#")[0]}`}
                    rel="noopener"
                    className="font-mono hover:text-copper"
                  >
                    {r.fullName}
                  </a>
                ) : (
                  <Link
                    href={localePath(locale, `/plugins/${r.slug}`)}
                    className="font-mono hover:text-copper"
                  >
                    {r.fullName}
                  </Link>
                )}
              </td>
              <td className="tabular px-3 py-2 align-top">{r.stars.toLocaleString(locale)}</td>
              {tags.map((tag) => {
                const verdict = r.preview[tag];
                return (
                  <td
                    key={tag}
                    className={`px-3 py-2 align-top ${verdict && verdict !== "passed" ? "font-medium text-copper" : "text-muted-foreground"}`}
                  >
                    {verdict ? (d.verdicts[verdict] ?? verdict) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function UpgradeView({ locale }: { locale: Locale }) {
  const d = t(locale).upgrade;
  const summary = await getCompatSummary();
  const tags = PREVIEW_TAGS.filter((tag) => summary.tags[tag]);

  return (
    <PageShell
      wide
      locale={locale}
      eyebrow={d.eyebrow}
      title={d.title(upgradeVersion(summary))}
      lede={d.lede}
    >
      <UpgradeCheck locale={locale} />

      <h2>{d.summaryHeading}</h2>
      {tags.length ? (
        <ul>
          {tags.map((tag) => {
            const s = summary.tags[tag]!;
            const failed = (s.counts.failed ?? 0) + (s.counts.timeout ?? 0);
            return (
              <li key={tag}>
                <strong>{d.tagLine(tag, s.version ?? "", s.passed, s.checked, day(s.ranAt))}</strong>{" "}
                {d.tagBreakdown(s.counts.incompatible ?? 0, failed, s.counts["needs-approval"] ?? 0)}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>{d.noRuns}</p>
      )}

      {tags.length ? (
        <>
          <h2>{d.regressionsHeading}</h2>
          <p>{d.regressionsNote}</p>
          <Regressions summary={summary} locale={locale} />
        </>
      ) : null}

      <h2>{d.fixHeading}</h2>
      <p>{d.fixBody}</p>
      <p>
        <Link href={localePath(locale, "/install-failed")}>{d.fixLink}</Link>
      </p>
      <p>{d.api}</p>
      <pre>
        <code>{`GET ${directory.baseUrl}/api/v1/compat?names=dsh-better-sidebar,owner/repo`}</code>
      </pre>
    </PageShell>
  );
}
