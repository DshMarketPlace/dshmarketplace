import Link from "next/link";
import { Star, ArrowUpRight, ShieldAlert, MessagesSquare } from "lucide-react";

import { CopyCommand } from "@/components/copy-command";
import { InstallCheck } from "@/components/install-check";
import { ReviewDialog } from "@/components/review-dialog";
import { primaryInstall, installKindLabel } from "@/lib/install";
import { t } from "@/lib/dict";
import { localePath, relativeTime, riskList, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Plugin } from "@/db/schema";

function compact(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
}

export function PluginCard({
  plugin,
  locale = "en",
}: {
  plugin: Plugin;
  locale?: Locale;
}) {
  const d = t(locale).card;

  // A hidden plugin has no page of its own yet, so the card sends people
  // straight to the source instead of through an empty stub.
  const hasPage = plugin.visibility !== "hidden";
  const href = hasPage ? localePath(locale, `/plugins/${plugin.slug}`) : plugin.repoUrl;
  const flags: string[] = plugin.riskFlags ? JSON.parse(plugin.riskFlags) : [];
  const install = primaryInstall(plugin, locale);

  // The catalogue ships a hand-written Chinese description for every entry, so
  // the Chinese card is never a translation of the English one.
  const summary =
    locale === "zh" ? (plugin.summaryZh ?? plugin.summary) : plugin.summary;

  // Only the locale's copy crosses to the client. Shipping both doubles the
  // payload of a 24-card grid for a panel most readers will never open.
  const reviewHtml =
    locale === "zh"
      ? (plugin.reviewHtmlZh ?? plugin.reviewHtml)
      : (plugin.reviewHtml ?? plugin.reviewHtmlZh);

  return (
    <article className="group flex flex-col border border-border bg-card transition-colors hover:border-rule-strong">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate font-mono text-sm font-medium">
              <Link
                href={href}
                {...(hasPage ? {} : { target: "_blank", rel: "noopener" })}
                className="transition-colors hover:text-copper"
              >
                {plugin.name}
              </Link>
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {plugin.owner}
            </p>
          </div>

          <span className="tabular flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3" aria-hidden />
            {compact(plugin.stars)}
          </span>
        </div>

        {summary ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        ) : (
          <p className="text-sm italic text-ink-faint">{d.noDescription}</p>
        )}

        <div className="mt-auto space-y-1.5 pt-1">
          {install ? (
            <>
              <CopyCommand command={install.cmd} locale={locale} />
              <InstallCheck status={plugin.installStatus} locale={locale} />
            </>
          ) : (
            <p className="border border-dashed border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {d.noInstallCommand}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-[0.6875rem] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate">
            {installKindLabel(plugin.installKind, locale)}
          </span>
          {plugin.language ? (
            <>
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span className="truncate">{plugin.language}</span>
            </>
          ) : null}
          {plugin.repoPushedAt ? (
            <>
              <span aria-hidden className="text-ink-faint">
                ·
              </span>
              <span className="whitespace-nowrap">
                {relativeTime(plugin.repoPushedAt, locale)}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {reviewHtml ? (
            <ReviewDialog
              name={plugin.name}
              html={reviewHtml}
              model={plugin.reviewModel}
              sourceUrl={plugin.repoUrl}
              locale={locale}
            />
          ) : null}
          {plugin.linuxdoUrl ? (
            // A visible badge, not just an icon: this is the strongest signal
            // on a card and the only one no competitor can generate.
            <a
              href={plugin.linuxdoUrl}
              target="_blank"
              rel="noopener"
              title={plugin.linuxdoTitle ?? d.linuxdo}
              className="flex shrink-0 items-center gap-1 border border-copper px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-copper transition-colors hover:bg-copper hover:text-paper"
            >
              <MessagesSquare className="h-2.5 w-2.5" aria-hidden />
              LINUX DO
            </a>
          ) : null}
          {flags.length > 0 ? (
            <span
              title={riskList(flags, locale)}
              className="flex items-center gap-1 text-copper"
            >
              <ShieldAlert className="h-3 w-3" aria-hidden />
              {flags.length}
            </span>
          ) : null}
          <Link
            href={href}
            {...(hasPage ? {} : { target: "_blank", rel: "noopener" })}
            className={cn(
              "flex items-center gap-0.5 transition-colors hover:text-foreground",
              hasPage && "text-foreground",
            )}
          >
            {hasPage ? d.details : d.source}
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
