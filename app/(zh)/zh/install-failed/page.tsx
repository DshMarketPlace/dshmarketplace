import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { RefusalTable } from "@/components/refusal-table";
import { getRefusalReport } from "@/lib/data";
import { t } from "@/lib/dict";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DSH 插件安装失败怎么办：incompatible with dsh 报错原因和解决",
  description:
    "DeepSeek Harness 0.2 装插件报 installation rejected、incompatible with dsh 是怎么回事，四种解决办法，外加被拒插件在当前 dsh 上能装的版本——都是 sandbox 实测出来的。",
  alternates: alternatesFor("zh", "/install-failed"),
};

const ERROR = `dsh: installation rejected: Plugin dsh-better-sidebar@0.28.0 is incompatible with dsh 0.2.0-rc.2: peerDependencies {"@deepseek-ai/dsh-tools":"^0.2.1-rc.1", …}. Running it may cause crashes or data loss. …
dsh: nothing was installed.`;

export default async function InstallFailedPage() {
  const report = await getRefusalReport();
  const dsh = report.dsh ?? "0.2";

  return (
    <PageShell
      wide
      eyebrow="排错"
      title="DSH 插件安装失败：incompatible with dsh"
      lede="dsh plugin add 报 installation rejected … is incompatible with dsh，插件本身多半没坏。DeepSeek Harness 0.2 会拒装为别的版本写的插件，而大多数插件都有能装上的旧版本。"
    >
      <h2>这个报错是什么意思</h2>
      <pre>
        <code>{ERROR}</code>
      </pre>
      <p>
        从 0.2.0-rc.1（2026 年 9 月 28 日发布）起，DeepSeek Harness 装插件之前会先核对它声明的
        dsh 版本范围：先看插件 <code>package.json</code> 里的 <code>engines.dsh</code>，没写的话就逐个看
        <code>@deepseek-ai/dsh*</code> 的 peer 依赖。当前的 dsh 不在范围里，就直接拒装，并把 profile
        还原。8 月写的插件大多声明的是 <code>^0.1.0-rc.6</code> 这类范围，一个 0.2 版本都不包含。
      </p>
      <p>有两点最容易踩：</p>
      <ul>
        <li>
          <strong>整条命令一起被拒。</strong><code>dsh plugin add a b c</code>{" "}
          里只要有一个不在范围内，三个都装不上——一组明明各自能用的插件，合在一起就是装不上，原因就在这。
        </li>
        <li>
          <strong>这是版本问题，不是质量问题。</strong>同一个插件，在这一版 DeepSeek Harness
          上能装，到下一版可能就被拒。升级 harness 可能触发它，升级 harness 也可能解决它。
        </li>
      </ul>

      <h2>有多常见</h2>
      {report.tested > 0 ? (
        <p>
          目前我们在 DeepSeek Harness {dsh} 上实测了 {report.tested.toLocaleString()}{" "}
          个插件，每个都在一次性 sandbox 的干净 profile 里装。其中 {report.refused.toLocaleString()}{" "}
          个在这一步被拒，被拒的里面有 {report.rescued.toLocaleString()} 个，换成旧版之后在同一个
          dsh 上装得干干净净。目录里其余的插件正在重跑，数字会跟着更新。
        </p>
      ) : (
        <p>整个目录正在用当前的 DeepSeek Harness 重跑，结果出来之后数字会显示在这里。</p>
      )}

      <h2>解决办法，从省事的开始</h2>
      <ol>
        <li>
          <strong>让 CLI 自己挑版本。</strong>
          <code>npx dshmarketplace-cli add &lt;插件&gt;</code> 会先读你本机的 dsh 版本，再装
          harness 能接受的最新一版，判断规则和 harness 自己的一样。一次装多个也行，
          <Link href="/zh/presets">预设套装</Link>也是这么装的。
        </li>
        <li>
          <strong>自己钉版本。</strong>我们在当前 dsh 上跑过的每条记录，都写着实际装上的那一版和对应命令，
          比如 <code>dsh plugin --profile web add dsh-better-sidebar@0.26.1</code>。下面的表列了 Star
          最多的那些。
        </li>
        <li>
          <strong>明知有风险，硬装。</strong>报错里自己就给了按版本豁免的命令：
          <code>
            dsh plugin --profile web allow-version &lt;包名&gt;@&lt;版本&gt; --dsh-version &lt;你的
            dsh&gt; --accept-risk
          </code>
          。harness 自己的警告照样成立——可能崩溃或丢数据——所以只留给没有兼容版本、而且你读过源码的插件。
        </li>
        <li>
          <strong>升级，或者等。</strong>有时候是最新版要的 dsh 比你装的新：dsh-better-sidebar
          0.28.0 要求 <code>^0.2.1-rc.1</code>，升级 DeepSeek Harness 就好了。其余情况只能等作者把范围放宽。
        </li>
      </ol>
      <p>
        <Link href="/zh/upgrade">{t("zh").upgrade.fromInstallFailed}</Link>
      </p>

      <h2>如果你是插件作者</h2>
      <p>
        在 <code>package.json</code> 里写上 <code>engines.dsh</code>，把你测过的 DeepSeek Harness
        版本都覆盖进去。从 0.2.1 起 harness 会先看它、再看 peer 范围，而且写了{" "}
        <code>engines.dsh</code> 就只看它——它是决定插件能不能装的那一个字段。你的插件在本站的记录里写着我们的
        sandbox 在当前 dsh 上看到了什么，<Link href="/zh/api-docs#install-check">实测说明</Link>
        讲了是怎么跑的。
      </p>

      <h2>其他装不上的情况</h2>
      <ul>
        <li>
          <strong>显示装好了，但什么都没出现。</strong><code>dsh plugin</code> 是往某个 profile
          里装，不带 <code>--profile</code> 就没有地方可装。本站每条命令都带{" "}
          <code>--profile web</code>，你用别的 profile 就换成它的名字。
        </li>
        <li>
          <strong>pnpm 拦了构建脚本。</strong>没进白名单的构建脚本 pnpm 不会跑，在那之前 harness
          可能根本不注册这个插件。把 pnpm 打印出来的 key 加进 profile 里 <code>pnpm-workspace.yaml</code>{" "}
          的 <code>allowBuilds</code>，再跑一次——或者交给 <code>dshmarketplace-cli</code>。
        </li>
        <li>
          <strong>从 GitHub 装，卡在 prepare 脚本。</strong>源码安装要在你机器上构建，pnpm
          一样会拦。办法同上；记录里有 npm 包的话，直接装 npm 包更省事。
        </li>
      </ul>

      <h2>在 DeepSeek Harness {dsh} 上被拒、Star 最多的插件</h2>
      <RefusalTable report={report} locale="zh" />
    </PageShell>
  );
}
