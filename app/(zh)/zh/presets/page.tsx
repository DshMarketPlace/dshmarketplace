import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { PresetCard } from "@/components/preset-card";
import { getPresetsWithPlugins } from "@/lib/presets";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DeepSeek Harness 插件预设 — 整套装过才发 | DSH Marketplace",
  description:
    "挑好的 DeepSeek Harness 插件组合，每一套在发布前都整套装进沙箱验过。一条命令配好记忆、搜索、视觉，或者一整套工作区。",
  alternates: alternatesFor("zh", "/presets"),
};

export default async function PresetsPage() {
  const { presets, unresolved } = await getPresetsWithPlugins();

  return (
    <PageShell
      wide
      locale="zh"
      eyebrow="预设"
      title="整套一起装过的组合"
      lede="一条命令配好一个能用的 DeepSeek Harness。下面每一套都是当作一次安装、整体装进干净 profile 的，套里每个插件都确认注册上了 —— 不是一个一个分开测完，然后假设它们能相处。"
    >
      <h2>「一套」和「一个」不是同一个结论</h2>
      <p>
        目录里每条记录带的结论，来自把<em>那一个插件</em>装进空 profile。那是给单条记录用的
        测法，不是给一套用的 —— 组合会在零件不会失败的地方失败：
      </p>
      <ul>
        <li>两个插件要同一个 peer 的不兼容版本</li>
        <li>
          某个 build script 只有在另一个插件把它的宿主包拖进来之后，才会被 pnpm 拦下
        </li>
        <li>
          cordis 拒绝重复的 loader entry id —— 于是插件装上了、报告成功了、然后从来没被注册
        </li>
      </ul>
      <p>
        所以这里每一套都是<strong>整个列表一次装完</strong>跑的沙箱，用的就是旁边印的那条
        命令，跑完之后每个成员都必须出现在 profile 的 bundle 列表里。差一个就不发。
        <strong>一套预设悄悄漏掉一个插件，比没有这套预设更糟</strong> —— 你会以为自己有这个
        能力，其实没有。
      </p>
      <p>
        沙箱是{" "}
        <a href="https://github.com/DshMarketPlace/dsh-plugin-validator">开源的</a>，
        <a href="https://github.com/DshMarketPlace/dshmarketplace-cli">CLI</a> 也是。
        下面的日期和版本号就是那次跑出来的原始记录。
      </p>

      <div className="not-prose my-10 grid gap-8">
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            members={preset.members}
            locale="zh"
          />
        ))}
      </div>

      <h2>会继续加</h2>
      <p>
        先上三套，验一套加一套 —— 卡的是沙箱时间，不是点子。你想要的组合这儿没有，或者上面
        某套明显少了点什么，
        <Link href="/zh/contact">说一声</Link>，可以去测。
      </p>
      <p>
        想自己搭一套？<code>GET /api/v1/presets</code> 把这些连同验证信息一起发成 JSON，
        <Link href="/zh/api-docs">接口是公开的</Link> —— 不用 key，CORS 全开。
      </p>
      {unresolved.length ? (
        <p>
          <strong>说明：</strong>
          {unresolved.join("、")} —— 被某套预设点名，但目前在目录里解析不到。
        </p>
      ) : null}
    </PageShell>
  );
}
