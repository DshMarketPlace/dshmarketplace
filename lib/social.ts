import type { Metadata } from "next";

import { t } from "@/lib/dict";
import { absoluteUrl, type Locale } from "@/lib/i18n";
import { directory } from "@/directory.config";

/**
 * The social card, declared explicitly rather than through the
 * `app/opengraph-image.jpg` file convention.
 *
 * That convention resolves per route segment, and with two root layouts there
 * is no shared segment above them to hang it on — a file at the `app/` root
 * silently stops producing `og:image` once `app/layout.tsx` is gone. Declaring
 * it is one line longer and cannot break invisibly.
 */
/** One card per language — a share on a Chinese forum should land in Chinese. */
export const OG_COVER: Record<Locale, string> = {
  en: "/og-cover.jpg",
  zh: "/og-cover-zh.jpg",
};

const cover = (locale: Locale) => ({
  url: OG_COVER[locale],
  width: 1200,
  height: 630,
});

const OG_LOCALE: Record<Locale, string> = { en: "en_US", zh: "zh_CN" };

export function socialMetadata(locale: Locale): Metadata {
  const d = t(locale);
  const other: Locale = locale === "en" ? "zh" : "en";

  return {
    // All four are rendered from public/brand/mark.svg — see
    // scripts/build-brand.ts. The .ico in particular has to be regenerated
    // rather than inherited: the scaffold shipped its own, and a stale one
    // here is invisible in code review but the first thing a visitor sees.
    icons: {
      icon: [
        { url: "/brand/mark.svg", type: "image/svg+xml" },
        { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      siteName: directory.name,
      url: absoluteUrl(locale),
      title: d.meta.title,
      description: d.meta.description,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[other]],
      images: [{ ...cover(locale), alt: d.meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: d.meta.title,
      description: d.meta.description,
      images: [OG_COVER[locale]],
    },
  };
}
