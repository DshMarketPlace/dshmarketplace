import type { Metadata } from "next";

import {
  CatalogueView,
  type CatalogueParams,
} from "@/components/views/catalogue-view";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

const d = t("zh");

export const metadata: Metadata = {
  title: d.featured.metaTitle,
  description: d.featured.metaDescription,
  alternates: alternatesFor("zh", "/plugins"),
};

export const revalidate = 3600;

export default async function PluginsPageZh({
  searchParams,
}: {
  searchParams: Promise<CatalogueParams>;
}) {
  return <CatalogueView locale="zh" searchParams={await searchParams} />;
}
