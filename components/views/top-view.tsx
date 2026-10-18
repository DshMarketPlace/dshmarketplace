import { PluginCard } from "@/components/plugin-card";
import { getCatalogStats, getRankings, type PluginCardRow } from "@/lib/data";
import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

type Ranked = PluginCardRow & { metric: number };

function Ranking({
  heading,
  note,
  rows,
  metric,
  locale,
}: {
  heading: string;
  note: string;
  rows: Ranked[];
  metric: (n: number) => string;
  locale: Locale;
}) {
  const d = t(locale).top;
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="display text-xl">{heading}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
      </div>
      {rows.length ? (
        <ol className="grid list-none gap-px border border-border bg-border p-0 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p, i) => (
            <li key={p.id} className="flex flex-col bg-background">
              <p className="flex items-baseline justify-between border-b border-border px-4 py-2 font-mono text-xs">
                <span className="text-copper">{d.rank(i + 1)}</span>
                <span className="text-muted-foreground">{metric(Number(p.metric))}</span>
              </p>
              <PluginCard plugin={p} locale={locale} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{d.empty}</p>
      )}
    </section>
  );
}

export async function TopView({ locale }: { locale: Locale }) {
  const d = t(locale).top;
  const [{ day, installed, rising, verified }, stats] = await Promise.all([
    getRankings(),
    getCatalogStats(),
  ]);
  const weekBefore = day
    ? new Date(Date.parse(`${day}T00:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10)
    : null;

  return (
    <main className="mx-auto max-w-shell px-5 sm:px-8">
      <div className="space-y-14 py-12 sm:py-16">
        <header className="max-w-3xl space-y-3 border-b border-border pb-6">
          <p className="eyebrow">{d.eyebrow}</p>
          <h1 className="display text-section">{d.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">{d.lede}</p>
        </header>
        <Ranking
          heading={d.installedHeading}
          note={d.installedNote}
          rows={installed}
          metric={d.installedMetric}
          locale={locale}
        />
        <Ranking
          heading={d.risingHeading}
          note={day && weekBefore ? d.risingNote(weekBefore, day) : d.empty}
          rows={rising}
          metric={d.risingMetric}
          locale={locale}
        />
        <Ranking
          heading={d.verifiedHeading(stats.installRateDsh ?? "0.2")}
          note={d.verifiedNote}
          rows={verified}
          metric={d.verifiedMetric}
          locale={locale}
        />
      </div>
    </main>
  );
}
