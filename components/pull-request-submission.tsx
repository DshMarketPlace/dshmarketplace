import { ArrowUpRight, Check, GitPullRequest } from "lucide-react";

import type { Locale } from "@/lib/i18n";

const FEATURED_LIST_URL =
  "https://github.com/DshMarketPlace/awesome-dsh-plugin";

const copy = {
  en: {
    eyebrow: "Community review",
    title: "Want to be featured? Submit a pull request",
    body: (
      <>
        The form above is the quickest route into the full catalogue. For a
        place in the smaller Awesome DSH Plugins list maintained by DSH
        Marketplace, send a PR. Maintainers can review the plugin in public, and
        your contribution stays on GitHub.
      </>
    ),
    checklist: "Before you open it",
    manifest: (
      <>
        Keep the repository public and active, with a licence and clear install
        instructions.
      </>
    ),
    topic: (
      <>
        Add both <code>dsh-plugin</code> and <code>deepseek-harness</code>{" "}
        topics.
      </>
    ),
    readmes: (
      <>
        Add the repository under the right category in{" "}
        <code>data/curated.yml</code>, then run <code>npm test</code>.
      </>
    ),
    primary: "Read the guide and submit a PR",
    secondary: "See pull requests under review",
    newTab: "opens in a new tab",
  },
  zh: {
    eyebrow: "社区审核",
    title: "想进社区精选库？提交 PR",
    body: (
      <>
        上面的表单是进入完整目录最快的办法。如果你还希望插件进入 DSH Marketplace
        自己维护的 Awesome DSH Plugins 精选列表，可以提交
        PR。维护者能公开审核插件，你的贡献记录也会留在 GitHub。
      </>
    ),
    checklist: "提交前准备好",
    manifest: <>仓库保持公开且仍在维护，并提供开源协议和清楚的安装说明。</>,
    topic: (
      <>
        给仓库添加 <code>dsh-plugin</code> 和 <code>deepseek-harness</code> 两个
        topic。
      </>
    ),
    readmes: (
      <>
        在 <code>data/curated.yml</code> 的合适分类加入仓库，再运行{" "}
        <code>npm test</code>。
      </>
    ),
    primary: "查看贡献指南并提交 PR",
    secondary: "看看正在审核的 PR",
    newTab: "在新标签页打开",
  },
} as const;

export function PullRequestSubmission({ locale }: { locale: Locale }) {
  const d = copy[locale];

  return (
    <aside
      aria-labelledby="pull-request-submission-title"
      className="not-prose my-8 border-l-2 border-copper bg-paper-sunken p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <GitPullRequest
          className="mt-0.5 h-5 w-5 shrink-0 text-copper"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="eyebrow">{d.eyebrow}</p>
          <h2
            id="pull-request-submission-title"
            className="mt-2 text-lg font-semibold tracking-tight"
          >
            {d.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {d.body}
          </p>
        </div>
      </div>

      <div className="mt-5 border-y border-border py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {d.checklist}
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          {[d.manifest, d.topic, d.readmes].map((item, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-copper"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <a
          href={FEATURED_LIST_URL + "/blob/main/CONTRIBUTING.md"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={d.primary + " (" + d.newTab + ")"}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-ink bg-ink px-5 py-2.5 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          {d.primary}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
        <a
          href={FEATURED_LIST_URL + "/pulls"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={d.secondary + " (" + d.newTab + ")"}
          className="inline-flex min-h-12 items-center justify-center px-4 py-2.5 text-center text-sm text-copper underline-offset-4 hover:underline"
        >
          {d.secondary}
        </a>
      </div>
    </aside>
  );
}
