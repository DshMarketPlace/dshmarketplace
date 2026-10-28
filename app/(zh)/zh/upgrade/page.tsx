import type { Metadata } from "next";

import { UpgradeView, upgradeVersion } from "@/components/views/upgrade-view";
import { getCompatSummary } from "@/lib/compat";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const d = t("zh").upgrade;
  return {
    title: d.metaTitle(upgradeVersion(await getCompatSummary())),
    description: d.metaDescription,
    alternates: alternatesFor("zh", "/upgrade"),
  };
}

export default function UpgradePage() {
  return <UpgradeView locale="zh" />;
}
