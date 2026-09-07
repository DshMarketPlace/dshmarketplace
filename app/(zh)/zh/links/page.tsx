import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "友情链接 — DSH Marketplace",
  description: "DeepSeek Harness 生态里，与本站互挂链接的独立站点。",
  alternates: alternatesFor("zh", "/links"),
  // 出链页面不参与排名，存在只是为了让互换有个落脚地址；和 listed 插件页
  // 一样，刻意不进 sitemap。
  robots: { index: false, follow: true },
};

export default function LinksPageZh() {
  return (
    <PageShell
      locale="zh"
      eyebrow="链接"
      title="友情链接"
      lede="DeepSeek Harness 生态里，本站指过去、对方也指回来的独立站点。本页的出链都是 nofollow。"
    >
      <div className="not-prose my-6 border border-border">
        <a
          href="https://dpharness.com/"
          target="_blank"
          rel="noopener nofollow"
          className="block p-4 transition-colors hover:border-copper"
        >
          <div className="font-medium">DeepSeek Harness Hub</div>
          <div className="mt-1 text-sm text-muted-foreground">
            中文 DSH 插件库，带兼容性校验、风险标注和一键安装。
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            dpharness.com
          </div>
        </a>
      </div>

      <h2>互换友链</h2>
      <p>
        如果你也做 DeepSeek Harness、它的插件或周边工具的站点，到{" "}
        <a href="/zh/contact">联系页</a> 留个站名、网址和一句话描述就行。本页对外的链接都带{" "}
        <code>rel=&quot;nofollow&quot;</code>。
      </p>
    </PageShell>
  );
}
