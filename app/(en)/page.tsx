import type { Metadata } from "next";

import { HomeView } from "@/components/views/home-view";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

const d = t("en");

export const metadata: Metadata = {
  title: d.meta.title,
  description: d.meta.description,
  alternates: alternatesFor("en", "/"),
};

export const revalidate = 3600;

export default async function Home() {
  return <HomeView locale="en" />;
}
