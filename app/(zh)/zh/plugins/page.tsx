import type { Metadata } from "next";

import {
  CatalogueView,
  type CatalogueParams,
} from "@/components/views/catalogue-view";
import { catalogueMetadata } from "@/lib/catalogue-meta";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogueParams>;
}): Promise<Metadata> {
  return catalogueMetadata("zh", await searchParams);
}

export const revalidate = 3600;

export default async function PluginsPageZh({
  searchParams,
}: {
  searchParams: Promise<CatalogueParams>;
}) {
  return <CatalogueView locale="zh" searchParams={await searchParams} />;
}
