import Link from "next/link";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitch } from "@/components/language-switch";
import { t } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";
import { directory } from "@/directory.config";

/**
 * Header, footer and providers, shared by both root layouts. The layouts
 * themselves only differ in `lang`, the metadata and which locale they pass
 * down here.
 */
export function SiteFrame({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SiteHeader locale={locale} />
      {children}
      <SiteFooter locale={locale} />
    </ThemeProvider>
  );
}

function SiteHeader({ locale }: { locale: Locale }) {
  const d = t(locale);
  const nav = [
    { href: localePath(locale, "/plugins"), label: d.nav.plugins },
    { href: `${localePath(locale)}#install`, label: d.nav.install },
    { href: `${localePath(locale)}#how`, label: d.nav.how },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-shell items-center gap-8 px-5 sm:px-8">
        <Link href={localePath(locale)} className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mark.svg"
            alt=""
            width={22}
            height={22}
            className="shrink-0"
          />
          <span className="display text-[0.95rem] tracking-tight">
            {directory.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href={localePath(locale, "/submit")}
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {d.nav.submit}
          </Link>
          <LanguageSwitch locale={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ locale }: { locale: Locale }) {
  const d = t(locale);
  const p = (path: string) => localePath(locale, path);

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-shell gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark.svg" alt="" width={22} height={22} />
            <p className="display text-lg tracking-tight">{directory.name}</p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {d.footer.blurb}
          </p>
        </div>

        <FooterColumn
          title={d.footer.directory}
          links={[
            { href: p("/plugins"), label: d.footer.explore },
            { href: p("/submit"), label: d.nav.submit },
            { href: `${p("/")}#faq`, label: d.footer.faq },
          ]}
        />

        <FooterColumn
          title={d.footer.project}
          links={[
            { href: p("/about"), label: d.footer.about },
            { href: p("/contact"), label: d.footer.contact },
            {
              href: "https://github.com/topics/dsh-plugin",
              label: d.footer.githubTopic,
              external: true,
            },
            {
              href: "https://github.com/deepseek-ai/deepseek-harness",
              label: "DeepSeek Harness",
              external: true,
            },
          ]}
        />

        <FooterColumn
          title={d.footer.legal}
          links={[
            { href: p("/terms"), label: d.footer.terms },
            { href: p("/privacy"), label: d.footer.privacy },
          ]}
        />
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-shell flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground sm:px-8">
          <p>
            © {new Date().getFullYear()} {directory.name}
          </p>
          <p>{d.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div className="space-y-2.5 text-sm">
      <p className="eyebrow">{title}</p>
      <ul className="space-y-1.5 text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener"
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
