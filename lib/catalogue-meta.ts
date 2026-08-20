import type { Metadata } from "next";

import { getAllCategories, getCatalogStats } from "@/lib/data";
import { t } from "@/lib/dict";
import { absoluteUrl, type Locale } from "@/lib/i18n";

export type CatalogueMetaParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
  linuxdo?: string;
  per?: string;
};

/**
 * Canonical and title for the catalogue, including its category facets.
 *
 * Everything used to canonicalise to `/plugins` while the sitemap listed all
 * fourteen `?category=` URLs as things to index. Google obeys the canonical, so
 * it filed every one under "alternate page with proper canonical" — twenty-eight
 * of the sitemap's one hundred and sixty-six entries were instructions we
 * ourselves contradicted, and they can never index no matter how long we wait.
 *
 * A category page is not a duplicate: different plugins, different count,
 * different reason to land there. So it points at itself and says which
 * category it is. `sort`, `page` and `q` are genuinely the same set reordered
 * or sliced, so those keep pointing at `/plugins` and stay out of the sitemap.
 */
export async function catalogueMetadata(
  locale: Locale,
  params: CatalogueMetaParams,
): Promise<Metadata> {
  const d = t(locale);
  const base = "/plugins";

  const isFacetOnly =
    Boolean(params.category) &&
    !params.q &&
    !params.sort &&
    !params.page &&
    !params.linuxdo;

  if (isFacetOnly) {
    const categories = await getAllCategories();
    const match = categories.find((c) => c.id === params.category);
    // An unknown id renders the unfiltered list, so it must not claim a
    // canonical of its own — that would mint an indexable URL for any string
    // anyone appends.
    if (match) {
      const path = `${base}?category=${match.id}`;
      const name = (locale === "zh" ? match.nameZh : match.name) ?? match.name;
      return {
        title: d.featured.categoryMetaTitle(name),
        description: d.featured.categoryMetaDescription(name),
        alternates: {
          canonical: absoluteUrl(locale, path),
          languages: {
            en: absoluteUrl("en", path),
            "zh-Hans": absoluteUrl("zh", path),
            "x-default": absoluteUrl("en", path),
          },
        },
      };
    }
  }

  const stats = await getCatalogStats();
  return {
    title: d.featured.metaTitle(stats.total.toLocaleString()),
    description: d.featured.metaDescription,
    alternates: {
      canonical: absoluteUrl(locale, base),
      languages: {
        en: absoluteUrl("en", base),
        "zh-Hans": absoluteUrl("zh", base),
        "x-default": absoluteUrl("en", base),
      },
    },
  };
}
