import type { Metadata } from "next";

import {
  CatalogueView,
  type CatalogueParams,
} from "@/components/views/catalogue-view";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

const d = t("en");

export const metadata: Metadata = {
  title: d.featured.metaTitle,
  description: d.featured.metaDescription,
  alternates: alternatesFor("en", "/plugins"),
};

export const revalidate = 3600;

export default async function PluginsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogueParams>;
}) {
  return <CatalogueView locale="en" searchParams={await searchParams} />;
}
