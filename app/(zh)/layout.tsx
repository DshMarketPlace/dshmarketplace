import type { Metadata } from "next";

import "../globals.css";
import { SiteFrame } from "@/components/site-frame";
import { Analytics } from "@/components/analytics";
import { fontVars } from "@/lib/fonts";
import { t } from "@/lib/dict";
import { socialMetadata } from "@/lib/social";
import { alternatesFor, HTML_LANG } from "@/lib/i18n";
import { directory } from "@/directory.config";

const d = t("zh");

export const metadata: Metadata = {
  ...socialMetadata("zh"),
  title: d.meta.title,
  description: d.meta.description,
  metadataBase: new URL(directory.baseUrl),
  applicationName: directory.name,
  alternates: alternatesFor("zh", "/"),
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

/**
 * A second root layout, not a nested one. `<html lang>` can only be set by a
 * root layout, and serving Chinese under lang="en" costs real search
 * visibility — Google uses it to decide which language version to surface.
 * The trade-off is that switching language is a full page load rather than a
 * client transition, which is the correct behaviour anyway.
 */
export default function ChineseRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={HTML_LANG.zh} suppressHydrationWarning>
      <head>
        <Analytics />
      </head>
      <body className={`${fontVars} font-sans antialiased`}>
        <SiteFrame locale="zh">{children}</SiteFrame>
      </body>
    </html>
  );
}
