"use client";

import { usePathname } from "next/navigation";

import { t } from "@/lib/dict";
import { localePath, stripLocale, type Locale } from "@/lib/i18n";

/**
 * Switches language without losing the page you are on. A plain link to `/zh`
 * would be simpler but dumps everyone back at the homepage, which is the one
 * thing that makes people stop using a language switcher.
 *
 * Deliberately a full navigation, not a client transition: the two locales sit
 * under separate root layouts so `lang` on <html> can differ, and Next reloads
 * across root layouts by design.
 */
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const { path } = stripLocale(pathname ?? "/");
  const other: Locale = locale === "en" ? "zh" : "en";

  return (
    <a
      href={localePath(other, path)}
      hrefLang={other === "zh" ? "zh-Hans" : "en"}
      aria-label={other === "zh" ? "切换到简体中文" : "Switch to English"}
      className="border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-rule-strong hover:text-foreground"
    >
      {t(locale).switchTo}
    </a>
  );
}
