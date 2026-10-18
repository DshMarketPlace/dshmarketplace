import type { Metadata } from "next";

import { TopView } from "@/components/views/top-view";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best DeepSeek Harness Plugins — Most Installed & Rising This Week",
  description:
    "The top DeepSeek Harness plugins ranked three ways: installs from inside the harness, this week's GitHub star gain, and stars among plugins our sandbox installed on the current release.",
  alternates: alternatesFor("en", "/top"),
};

export default function TopPage() {
  return <TopView locale="en" />;
}
