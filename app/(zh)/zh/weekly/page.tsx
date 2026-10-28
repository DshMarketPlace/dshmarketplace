import type { Metadata } from "next";

import { WeeklyListView, weeklyListMetadata } from "@/components/views/weekly-view";

export const revalidate = 3600;

export const metadata: Metadata = weeklyListMetadata("zh");

export default function WeeklyPage() {
  return <WeeklyListView locale="zh" />;
}
