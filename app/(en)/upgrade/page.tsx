import type { Metadata } from "next";

import { UpgradeView, upgradeVersion } from "@/components/views/upgrade-view";
import { getCompatSummary } from "@/lib/compat";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

// The release in the title comes from the runs, never from this file: a
// version typed into a meta string goes stale the night the tag moves.
export async function generateMetadata(): Promise<Metadata> {
  const d = t("en").upgrade;
  return {
    title: d.metaTitle(upgradeVersion(await getCompatSummary())),
    description: d.metaDescription,
    alternates: alternatesFor("en", "/upgrade"),
  };
}

export default function UpgradePage() {
  return <UpgradeView locale="en" />;
}
