import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WeeklyIssueView, weeklyIssueMetadata } from "@/components/views/weekly-view";
import { getWeeklyIssue, listWeeklyIssues } from "@/lib/weekly";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const issues = await listWeeklyIssues();
  return issues.map(({ day }) => ({ day }));
}

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }): Promise<Metadata> {
  const issue = await getWeeklyIssue((await params).day);
  return issue ? weeklyIssueMetadata(issue, "en") : {};
}

export default async function WeeklyIssuePage({ params }: { params: Promise<{ day: string }> }) {
  const issue = await getWeeklyIssue((await params).day);
  if (!issue) notFound();

  return <WeeklyIssueView issue={issue} locale="en" />;
}
