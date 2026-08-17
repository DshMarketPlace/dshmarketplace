import Link from "next/link";

import { localePath, type Locale } from "@/lib/i18n";
import { directory } from "@/directory.config";

/**
 * Shared frame for the static information pages. They share one measure and
 * one heading rhythm so About and Terms do not read as two different sites.
 */
export function PageShell({
  eyebrow,
  title,
  lede,
  updated,
  updatedLabel,
  locale = "en",
  // Prose sets its own measure; a page carrying request lines and JSON needs a
  // wider one, or every example wraps at a point the reader has to undo.
  wide = false,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  updated?: string;
  updatedLabel?: string;
  locale?: Locale;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-shell px-5 sm:px-8">
      <div
        className={`${wide ? "max-w-3xl" : "max-w-2xl"} py-14 sm:py-20`}
      >
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link
            href={localePath(locale)}
            className="transition-colors hover:text-copper"
          >
            {directory.name}
          </Link>
          <span aria-hidden> / </span>
          <span>{title}</span>
        </nav>

        <header className="space-y-3 border-b border-border pb-6">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display text-section">{title}</h1>
          {lede ? (
            <p className="text-base leading-relaxed text-muted-foreground text-pretty">
              {lede}
            </p>
          ) : null}
          {updated ? (
            <p className="text-xs text-muted-foreground">
              {updatedLabel ?? "Last updated"} {updated}
            </p>
          ) : null}
        </header>

        <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-copper prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-code:font-normal">
          {children}
        </div>
      </div>
    </main>
  );
}
