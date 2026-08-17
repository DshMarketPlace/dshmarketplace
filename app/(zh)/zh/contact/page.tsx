import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { alternatesFor, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "联系 — DSH Marketplace",
  description:
    "报错、申请下架，或者就 DeepSeek Harness 插件索引站的其他事情联系我们。",
  alternates: alternatesFor("zh", "/contact"),
};

const ROUTES = [
  {
    subject: "某条记录写错了",
    to: "hello@dshmarketplace.dev",
    body: "记录是从公开的仓库元数据生成的，所以大部分错在上游——但如果确实是这边搞错了，把插件名和错在哪发过来。",
  },
  {
    subject: "把我的插件下架",
    to: "hello@dshmarketplace.dev",
    body: "不需要理由。用和项目相关的邮箱把仓库地址发过来，或者直接在仓库上开个 issue，记录就撤掉。",
  },
  {
    subject: "举报恶意插件",
    to: "security@dshmarketplace.dev",
    body: "如果某个已收录的插件在干它没声明过的事，走这个渠道最快。带上仓库地址和你观察到的现象。",
  },
  {
    subject: "隐私相关请求",
    to: "privacy@dshmarketplace.dev",
    body: "查询、删除或者退订——具体存了哪些东西，见隐私页。",
  },
];

export default function ContactPageZh() {
  return (
    <PageShell
      locale="zh"
      eyebrow="联系"
      title="联系我们"
      lede="这个站是一个人在维护。只有邮件这一个渠道，但每封都会看。"
    >
      <div className="not-prose space-y-px border border-border bg-border">
        {ROUTES.map((r) => (
          <div key={r.subject} className="space-y-2 bg-background p-5">
            <h2 className="text-base font-medium">{r.subject}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {r.body}
            </p>
            <a
              href={`mailto:${r.to}?subject=${encodeURIComponent(r.subject)}`}
              className="inline-block font-mono text-sm text-copper hover:underline"
            >
              {r.to}
            </a>
          </div>
        ))}
      </div>

      <h2>写信之前</h2>
      <p>
        如果你只是想让插件<em>被收录</em>
        ，其实用不着找我们——给仓库打个 topic 更快。见
        <Link href={localePath("zh", "/submit")}>「提交插件」</Link>。
      </p>
      <p>
        如果问题是关于 DeepSeek Harness 本身而不是这个索引站，去
        <a href="https://github.com/deepseek-ai/deepseek-harness" rel="noopener">
          官方仓库
        </a>
        更合适。
      </p>
    </PageShell>
  );
}
