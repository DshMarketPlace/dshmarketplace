import { directory } from "@/directory.config";

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * The `lang` attribute and the hreflang key. `zh-Hans` rather than `zh-CN`:
 * the script subtag covers the mainland, Singapore and anyone reading
 * simplified characters, which is the whole audience here.
 */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

/**
 * English lives at the root and Chinese under `/zh`. English keeps the bare
 * URLs because that is where the existing links and the head term already
 * point; moving it to `/en` would forfeit both for nothing.
 */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? clean || "/" : `/zh${clean}`;
}

export function absoluteUrl(locale: Locale, path = "/"): string {
  const p = localePath(locale, path);
  return p === "/" ? directory.baseUrl : `${directory.baseUrl}${p}`;
}

/**
 * Both language versions of a page point at each other, and x-default points
 * at English. Google treats a one-sided hreflang as unconfirmed and drops it,
 * so this must be emitted on both sides — which it is, because every page
 * builds its alternates from the same shared path.
 */
export function alternatesFor(locale: Locale, path = "/") {
  return {
    canonical: absoluteUrl(locale, path),
    languages: {
      en: absoluteUrl("en", path),
      "zh-Hans": absoluteUrl("zh", path),
      "x-default": absoluteUrl("en", path),
    },
  };
}

/** Strips the `/zh` prefix so a path can be re-rendered in the other locale. */
export function stripLocale(pathname: string): {
  locale: Locale;
  path: string;
} {
  if (pathname === "/zh" || pathname.startsWith("/zh/")) {
    return { locale: "zh", path: pathname.slice(3) || "/" };
  }
  return { locale: "en", path: pathname || "/" };
}

/**
 * Relative dates are written out rather than pulled from Intl.RelativeTimeFormat:
 * the fully general formatter drags a chunk of ICU data into the Worker for
 * five strings, and the Worker size ceiling is the binding constraint here.
 */
export function relativeTime(date: Date | null, locale: Locale): string | null {
  if (!date) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  if (locale === "zh") {
    if (days <= 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 30) return `${days} 天前`;
    if (days < 365) return `${Math.floor(days / 30)} 个月前`;
    return `${Math.floor(days / 365)} 年前`;
  }

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * Risk flags are stored in English because that is what the sync writes. The
 * detector's vocabulary is closed, so a lookup is enough — an unknown flag
 * falls through untranslated rather than disappearing.
 */
const RISK_LABELS_ZH: Record<string, string> = {
  "install script": "安装脚本",
  "terminal surface": "终端执行",
  "requires credentials": "需要密钥",
};

export function riskLabel(flag: string, locale: Locale): string {
  return locale === "zh" ? (RISK_LABELS_ZH[flag] ?? flag) : flag;
}

/** Chinese enumerates with the ideographic comma, not the Latin one. */
export function riskList(flags: string[], locale: Locale): string {
  return flags
    .map((f) => riskLabel(f, locale))
    .join(locale === "zh" ? "、" : ", ");
}
