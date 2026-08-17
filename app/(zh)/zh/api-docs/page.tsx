import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { getCatalogStats } from "@/lib/data";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DeepSeek Harness 插件 API — 免费、无需 key | DSH Marketplace",
  description:
    "DeepSeek Harness 插件的公开 JSON API：搜索单个插件，或者一个请求拉走整份目录。不用 key，不用注册，CORS 全开。安装命令是验过的，不是猜的。",
  alternates: alternatesFor("zh", "/api-docs"),
};

export default async function ApiDocsPage() {
  const stats = await getCatalogStats();
  const total = stats.total.toLocaleString();

  return (
    <PageShell
      wide
      locale="zh"
      eyebrow="API"
      title="DSH Marketplace API"
      lede={`${total} 个 DeepSeek Harness 插件的公开 JSON API。不用 key，不用注册，CORS 全开 —— 本站、CLI、Python 包和 harness 内嵌插件读的都是这两个接口。`}
    >
      <h2>两个接口</h2>
      <table>
        <thead>
          <tr>
            <th>接口</th>
            <th>回答什么</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>GET /api/v1/plugins</code>
            </td>
            <td>这个插件是干嘛的。</td>
          </tr>
          <tr>
            <td>
              <code>GET /api/v1/index</code>
            </td>
            <td>这一千个仓库里，哪些才是插件。</td>
          </tr>
        </tbody>
      </table>
      <p>
        两个都开了 CORS，不需要鉴权。你要做目录站、做聊天工具、或者写一个会自己装插件的
        agent，直接拿去用——它们就是为这个存在的，比你再爬一遍 GitHub topic 划算。
      </p>

      <h2>
        <code>GET /api/v1/plugins</code>
      </h2>
      <pre>
        <code>
          curl -s
          &apos;https://dshmarketplace.dev/api/v1/plugins?q=memory&amp;limit=5&apos;
        </code>
      </pre>
      <table>
        <thead>
          <tr>
            <th>参数</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>q</code>
            </td>
            <td>自由文本，匹配仓库名、中英文摘要和描述</td>
          </tr>
          <tr>
            <td>
              <code>category</code>
            </td>
            <td>14 个分类 id 之一</td>
          </tr>
          <tr>
            <td>
              <code>limit</code>
            </td>
            <td>1–100，默认 20</td>
          </tr>
          <tr>
            <td>
              <code>page</code>
            </td>
            <td>从 1 开始</td>
          </tr>
        </tbody>
      </table>
      <p>
        每条结果都带中英文摘要、解析好的安装命令、检测到的风险项和源码仓库：
      </p>
      <pre>
        <code>{`{
  "fullName": "liustack/modlens",
  "summary": "…",
  "summaryZh": "…",
  "category": "vision",
  "stars": 2325,
  "license": "MIT",
  "npmPackage": "@liustack/modlens",
  "installKind": "npm",
  "install": "dsh plugin --profile web add @liustack/modlens",
  "installable": true,
  "installOptions": [{ "label": "npm", "cmd": "…", "note": "…" }],
  "riskFlags": ["terminal surface"],
  "repoUrl": "https://github.com/liustack/modlens",
  "url": "https://dshmarketplace.dev/plugins/liustack-modlens"
}`}</code>
      </pre>

      <h3>
        <code>install</code> 这个字段的约定
      </h3>
      <p>
        <strong>
          没有命令能装得上的时候，<code>install</code> 是 <code>null</code>
          ，不是一个占位串。
        </strong>{" "}
        写 agent 的话这段值得看两遍。会直接执行这个字段的调用方，不能拿到一条跑不通的命令，
        所以宁可留空——<code>installable</code> 这个布尔值说的是同一件事。
      </p>
      <p>两种情况会出现，而且都是真实存在的：</p>
      <ul>
        <li>
          <strong>插件在 monorepo 的子目录里。</strong>
          <code>dsh plugin add</code> 是转发给 pnpm 的，而 pnpm 把{" "}
          <code>#</code> 后面的东西当 git ref，所以{" "}
          <code>github:owner/repo#packages/thing</code>{" "}
          根本解析不了。没有一行命令能装，那就不给命令。
        </li>
        <li>
          <strong>插件哪儿都没发。</strong>既没有 npm 包，仓库根目录也装不了。
        </li>
      </ul>
      <p>
        凡是返回了的命令，都带着 <code>--profile web</code>。
        <code>dsh plugin</code> 只是把参数转发给 profile
        目录里的 pnpm，所以这个 flag 是必填的——不带它 CLI 会直接报{" "}
        <code>required option &apos;--profile &lt;name&gt;&apos; not specified</code>
        ，什么都装不上。你用的是别的 profile，把 <code>web</code> 换掉即可。
      </p>

      <h2>
        <code>GET /api/v1/index</code>
      </h2>
      <pre>
        <code>curl -s &apos;https://dshmarketplace.dev/api/v1/index&apos;</code>
      </pre>
      <p>
        一个请求拿走整份目录。给那种需要判断"这一页仓库里有没有插件"、又不可能一个一个问的调用方用。
        为了小，行是位置数组，压过去大概 22&nbsp;KB，列名跟着 payload 一起发：
      </p>
      <pre>
        <code>{`{
  "generated": "2026-08-17T09:12:44.108Z",
  "count": ${stats.total},
  "site": "https://dshmarketplace.dev",
  "fields": ["fullName", "category", "install", "path", "npm"],
  "plugins": [
    ["liustack/modlens", "vision", "dsh plugin --profile web add @liustack/modlens", "/plugins/liustack-modlens", "@liustack/modlens"]
  ]
}`}</code>
      </pre>
      <p>
        条目还没有独立页面的时候 <code>path</code> 是 <code>null</code>
        ，插件没发包的时候 <code>npm</code> 是 <code>null</code>。和{" "}
        <code>install</code> 一样，这几个字段永远不会塞占位符。
      </p>

      <h2>目录里收了什么</h2>
      <p>
        {total} 条，来自社区精选库和{" "}
        <a href="https://github.com/topics/dsh-plugin" rel="noopener">
          GitHub 上的 <code>dsh-plugin</code> topic
        </a>
        。topic 不是注册表，所以收录有门槛——门槛写在这里，因为一道没人能核对的筛选不算筛选：
      </p>
      <ul>
        <li>
          <strong>它得声明自己是 DSH 插件。</strong>
          <code>package.json</code> 里有 <code>dsh</code> manifest、依赖了{" "}
          <code>@deepseek-ai/*</code> 或 cordis、或者有{" "}
          <code>cordis.patch.yml</code>。别的 harness、agent 客户端也会挂{" "}
          <code>dsh-plugin</code> 标签蹭曝光，那些在这里装不上，也就不收。
        </li>
        <li>
          <strong>提交数不少于 10 次。</strong>这个数不是我们定的，取自{" "}
          <a
            href="https://github.com/awesome-dsh-plugin/awesome-dsh-plugin"
            rel="noopener"
          >
            awesome-dsh-plugin
          </a>{" "}
          自己的收录门槛，所以这条标准你可以拿别人的规则来核对。脚手架在第一次提交时
          manifest 就是合法的，能把它和真活分开的是提交数。
        </li>
        <li>
          <strong>它得说清自己干嘛的。</strong>
          一句描述都没有的仓库，收进来就只是一个链接，而链接每家目录都能给你。
        </li>
      </ul>
      <p>
        这道门槛跑下来一次删掉了 1,415 条，其中 754 条提交数不到 5 次。
        <strong>一个目录的价值在于它排除了什么。</strong>
      </p>

      <h2>缓存与合理使用</h2>
      <p>
        响应带 <code>Cache-Control</code>，走 Cloudflare 边缘缓存。没有限流也没有
        key，这件事能成立的前提是调用方守规矩：把 index 缓存起来，别每次页面渲染都拉一遍；
        能用一次 <code>/api/v1/index</code> 解决的，别打一千次{" "}
        <code>/api/v1/plugins</code>。下面那个油猴脚本最多六小时刷新一次，那就是我们期望的用法。
      </p>

      <h2>四个参考实现</h2>
      <p>
        下面每一个读的都是上面那两个接口，而且全部 MIT 开源在{" "}
        <a href="https://github.com/DshMarketPlace">GitHub</a>
        。你要接进自己的东西，大概率其中一个已经踩过你要踩的坑：
      </p>
      <table>
        <thead>
          <tr>
            <th>客户端</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a href="https://github.com/DshMarketPlace/dshmarketplace-cli">
                npm
              </a>
            </td>
            <td>
              <code>npx dshmarketplace-cli find memory</code> —— 给 agent 用的稳定{" "}
              <code>--json</code> 契约
            </td>
          </tr>
          <tr>
            <td>
              <a href="https://github.com/DshMarketPlace/dshmarketplace-py">
                PyPI
              </a>
            </td>
            <td>
              <code>pip install dshmarketplace</code> —— 零依赖，同步异步都有
            </td>
          </tr>
          <tr>
            <td>
              <a href="https://github.com/DshMarketPlace/dsh-plugins-store">
                DSH 里
              </a>
            </td>
            <td>
              <code>dsh plugin --profile web add dshmarketplace-plugin</code> ——{" "}
              <code>/store</code>，另带两个可供 agent 调用的工具
            </td>
          </tr>
          <tr>
            <td>
              <a href="https://greasyfork.org/scripts/591735-dsh-plugin-radar">
                油猴脚本
              </a>
            </td>
            <td>逛 GitHub 和 npm 时标出插件 —— 一个文件，无构建，无依赖</td>
          </tr>
        </tbody>
      </table>

      <h2>使用条款</h2>
      <p>
        免费，商用也可以。不用 key，不用注册，不强制署名——留个链接我们会很高兴，但从不作为条件。
        数据是公开的仓库元信息加上这里写的摘要，不提供任何担保，收录也不等于做过安全审查。见{" "}
        <Link href="/zh/about">这个站不是什么</Link>。
      </p>
      <p>
        发现哪条收录错了，或者想把自己的撤下来，
        <Link href="/zh/contact">说一声</Link>就会改。
      </p>
    </PageShell>
  );
}
