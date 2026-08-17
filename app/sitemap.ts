import type { MetadataRoute } from "next";

import { getIndexedPlugins, getAllCategories } from "@/lib/data";
import { absoluteUrl } from "@/lib/i18n";

export const revalidate = 3600;

/**
 * Only `indexed` plugins appear here. `listed` pages exist and are crawlable
 * but are deliberately withheld from the sitemap until their copy is worth
 * submitting; `hidden` plugins have no page at all.
 *
 * Every URL carries its own `alternates.languages` block. Google wants the
 * hreflang cluster declared in one place per URL, and a sitemap that lists
 * both language versions without linking them reads as duplicate content.
 */
function entry(
  path: string,
  rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages = {
    en: absoluteUrl("en", path),
    "zh-Hans": absoluteUrl("zh", path),
  };

  return [
    { url: languages.en, alternates: { languages }, ...rest },
    { url: languages["zh-Hans"], alternates: { languages }, ...rest },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [plugins, categories] = await Promise.all([
    getIndexedPlugins(),
    getAllCategories(),
  ]);

  const now = new Date();
  const STATIC_PAGES = ["about", "submit", "contact", "terms", "privacy"];

  return [
    ...entry("/", { lastModified: now, changeFrequency: "daily", priority: 1 }),
    ...entry("/plugins", {
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    }),
    ...STATIC_PAGES.flatMap((slug) =>
      entry(`/${slug}`, {
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.4,
      }),
    ),
    ...categories.flatMap((c) =>
      entry(`/plugins?category=${c.id}`, {
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
      }),
    ),
    ...plugins.flatMap((p) =>
      entry(`/plugins/${p.slug}`, {
        lastModified: p.updatedAt ?? p.indexedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    ),
  ];
}
