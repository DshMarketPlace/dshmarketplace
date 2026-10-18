import type { Metadata } from "next";

import { TopView } from "@/components/views/top-view";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DeepSeek Harness 插件推荐：安装量排行与本周热门",
  description:
    "DeepSeek Harness 插件三个榜：在 harness 里实际被安装的次数、本周新增的 GitHub Star，以及在当前版本上 sandbox 实测装得上的插件按 Star 排。DSH 插件推荐，装哪个先看这里。",
  alternates: alternatesFor("zh", "/top"),
};

export default function TopPage() {
  return <TopView locale="zh" />;
}
