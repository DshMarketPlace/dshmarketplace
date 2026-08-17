import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { alternatesFor, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "关于 — DSH Marketplace",
  description:
    "一个独立的 DeepSeek Harness 插件索引站。收录从哪来、风险提示是什么意思、以及这个站不是什么。",
  alternates: alternatesFor("zh", "/about"),
};

export default function AboutPageZh() {
  return (
    <PageShell
      locale="zh"
      eyebrow="关于"
      title="关于 DSH Marketplace"
      lede="一个独立的 DeepSeek Harness 插件索引站——建它是因为，找到对的那个插件，比装上它难多了。"
    >
      <h2>为什么要有这个站</h2>
      <p>
        DeepSeek Harness 默认几乎什么都不带——所有能力都是插件，连接模型的那一层也是。这个设计本身是它的立意，但也意味着你刚装完的那一份，在凑齐四五个合手的插件之前，基本干不了什么。
      </p>
      <p>
        而这些插件散在两个地方：一个上千仓库的 GitHub topic，和一份只覆盖其中一部分的社区精选库。名字没什么规律，描述中英文混着写，一个几千
        Star 的仓库出名的往往是别的东西，而不是它那个 DSH
        插件。这个站要做的，就是把这一堆变成能按<em>能力</em>搜的。
      </p>

      <h2>收录从哪来</h2>
      <p>两个来源，每条记录都注明自己来自哪一个：</p>
      <ul>
        <li>
          GitHub 上的{" "}
          <a href="https://github.com/topics/dsh-plugin" rel="noopener">
            <code>dsh-plugin</code> topic
          </a>
          ，任何作者都可以给自己的仓库打上。
        </li>
        <li>
          DeepSeek Harness
          自带插件市场所使用的那份社区精选库，进去要先过一遍人工审核。
        </li>
      </ul>
      <p>
        Star 数、开源协议、主语言、最近推送时间都从 GitHub API
        读取，按计划刷新。一条记录上除了编辑写的那段介绍（如果有的话），没有任何字段是手打的。
      </p>

      <h2>风险提示是什么意思</h2>
      <p>
        插件跑在你的 agent 里面，用的是你 agent
        的权限。凡是机器能识别出来的，都会在你安装之前标出来：
      </p>
      <ul>
        <li>
          <strong>安装脚本</strong> ——
          这个包在安装的时候就会执行脚本，那会儿你还没来得及看任何东西。
        </li>
        <li>
          <strong>终端执行</strong> —— 这个插件会执行 shell 命令。
        </li>
        <li>
          <strong>需要密钥</strong> —— 这个插件会要 API key 或者 token。
        </li>
      </ul>

      <h2>这个站不是什么</h2>
      <p>
        <strong>不是安全审计。</strong>
        识别是启发式的，只看仓库自己公开出来的东西。一条记录没有标记，不等于它干净；被收录了，也不等于我们推荐它。装之前先读源码——每条记录都直接链过去。
      </p>
      <p>
        <strong>和 DeepSeek 官方没有关系。</strong>这是一个独立项目。DeepSeek 和
        DeepSeek Harness
        是各自权利人的标识，出现在这里只是为了说明这些插件是干什么用的。
        <a href="https://github.com/deepseek-ai/deepseek-harness" rel="noopener">
          官方项目在 GitHub 上
        </a>
        。
      </p>

      <h2>纠错</h2>
      <p>
        记录是从公开元数据生成的，上游写错了这边就跟着错。如果哪条记录把你的插件说岔了，或者你压根不想被收录，
        <Link href={localePath("zh", "/contact")}>告诉我们</Link>
        ，改掉或者撤掉。
      </p>
    </PageShell>
  );
}
