import type { Metadata } from "next";

import "../globals.css";
import { SiteFrame } from "@/components/site-frame";
import { Analytics } from "@/components/analytics";
import { fontVars } from "@/lib/fonts";
import { t } from "@/lib/dict";
import { socialMetadata } from "@/lib/social";
import { alternatesFor, HTML_LANG } from "@/lib/i18n";
import { directory } from "@/directory.config";

const d = t("en");

export const metadata: Metadata = {
  ...socialMetadata("en"),
  title: d.meta.title,
  description: d.meta.description,
  metadataBase: new URL(directory.baseUrl),
  applicationName: directory.name,
  alternates: alternatesFor("en", "/"),
  other: {
    "stackscope-claim": "g03FScl3",
  },

  // Next omits <meta name="robots"> when the value is undefined. Google reads
  // absence as index,follow, so nothing is blocked — but max-snippet and
  // max-image-preview are opt-in, and silence forfeits both. Per-page metadata
  // overrides this; the plugin pages set their own index flag.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export default function EnglishRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={HTML_LANG.en} suppressHydrationWarning>
      <head>
        <Analytics />
      </head>
      <body className={`${fontVars} font-sans antialiased`}>
        <SiteFrame locale="en">{children}</SiteFrame>
      </body>
    </html>
  );
}
