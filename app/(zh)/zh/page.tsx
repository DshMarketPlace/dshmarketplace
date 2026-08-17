import type { Metadata } from "next";

import { HomeView } from "@/components/views/home-view";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

const d = t("zh");

export const metadata: Metadata = {
  title: d.meta.title,
  description: d.meta.description,
  alternates: alternatesFor("zh", "/"),
};

export const revalidate = 3600;

export default async function HomeZh() {
  return <HomeView locale="zh" />;
}
