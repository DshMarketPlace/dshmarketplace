<p align="center">
  <img src=".github/assets/banner.jpg" alt="DSH Marketplace —— 每个 DeepSeek Harness 插件都有一页值得读的介绍" width="100%">
</p>

<p align="center">
  <a href="https://dshmarketplace.dev"><img src="https://img.shields.io/badge/site-dshmarketplace.dev-c0561d?style=flat-square&labelColor=241f1a" alt="线上站点"></a>
  <a href="https://github.com/DshMarketPlace/dshmarketplace/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/DshMarketPlace/dshmarketplace/deploy.yml?style=flat-square&color=c0561d&labelColor=241f1a&label=deploy" alt="部署"></a>
  <a href="#收录情况"><img src="https://img.shields.io/badge/plugins-1%2C004-c0561d?style=flat-square&labelColor=241f1a" alt="1004 个插件"></a>
  <a href="#公开-api"><img src="https://img.shields.io/badge/API-public-c0561d?style=flat-square&labelColor=241f1a" alt="公开 API"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-c0561d?style=flat-square&labelColor=241f1a" alt="MIT"></a>
  <a href="https://linux.do"><img src="https://img.shields.io/badge/LINUX%20DO-community-c0561d?style=flat-square&labelColor=241f1a" alt="LINUX DO"></a>
</p>

<p align="center">
  <a href="README.md">English</a> · <b>简体中文</b>
</p>

---

**DeepSeek Harness（DSH）插件**目录，中英双语。英文在 `/`，中文在 `/zh`，
背后是同一份数据。

线上地址：**<https://dshmarketplace.dev>**

## 为什么做这个

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 是
DeepSeek 开源的 agent harness，所有能力都以插件形式提供。上线几周，社区插件
就过千了。

已经有好几个目录站在收这些插件，但基本都是一堵卡片墙：仓库名、Star 数、一个
直接跳去 GitHub 的链接。那是目录，不是资料——想知道一个插件到底动了什么，还是
得自己去读源码。

所以这个站的区别在于**写过的内容**。被推上来的插件有自己一页，包含中英文的
介绍、文档段落和一张插图。这东西产出很慢，也爬不走，这正是重点。

现在还很早：**1,004 条记录里，有这一页的是 28 个。**其余的先挂着元数据和一条
手写的中英文简介，等文章补上。没有为了让数字好看去灌生成的水文。

## 收录情况

| | |
| --- | --- |
| 收录总数 | **1,004** —— 未归档的 1,002 |
| 分类 | 14 个，从 Memory、Vision 到 Themes |
| 中文简介 | **1,004** —— 每一条都有，手写 |
| 写过的详情页 | 28 个，中英双语 · 25 个配图 |
| 一行装得上 | **960** · 另外 44 个装不上，页面直说 |
| LINUX DO 认证 | 6 个 |

**认证**指作者本人在 [LINUX DO](https://linux.do) 上实名发过这个插件，并且在
帖子里答疑。这是来源可查，不是安全审计。

## 三个入口，一份数据

所有入口读的都是同一套 API，所以同一条记录不会在浏览器里是一个说法、在
harness 里是另一个说法。

| | |
| --- | --- |
| **网页** | <https://dshmarketplace.dev> |
| **CLI** | [`dshmarketplace-cli`](https://github.com/DshMarketPlace/dshmarketplace-cli) —— 给 DSH 之外的 coding agent 用 |
| **Python** | [`dshmarketplace`](https://github.com/DshMarketPlace/dshmarketplace-py) —— 零依赖，`dshm` CLI，agent tools |
| **DSH 里** | [`dshmarketplace-plugin`](https://github.com/DshMarketPlace/dsh-plugins-store) —— 在 harness 里打 `/store` |
| **浏览器里** | [DSH Plugin Radar](https://github.com/DshMarketPlace/dsh-plugin-radar) —— 油猴脚本，在 GitHub 和 npm 上标出插件 |

## 公开 API

不用 key，不用注册，CORS 全开。

```bash
curl -s 'https://dshmarketplace.dev/api/v1/plugins?q=memory&limit=5'
```

| 参数 | |
| --- | --- |
| `q` | 在名称、简介、描述里做全文搜索 |
| `category` | 14 个分类 id 之一 |
| `limit` | 1–100，默认 20 |
| `page` | 从 1 开始 |

每条结果都带中英两份简介、解析好的安装命令、识别到的风险标记和源码地址：

```jsonc
{
  "fullName": "Anionex/dsh-vision-toolkit",
  "summary": "…",
  "summaryZh": "…",
  "stars": 128,
  "npmPackage": "dsh-vision-toolkit",
  "install": "dsh plugin --profile web add dsh-vision-toolkit",
  "installable": true,
  "riskFlags": ["install script"],
  "repoUrl": "https://github.com/Anionex/dsh-vision-toolkit",
  "url": "https://dshmarketplace.dev/plugins/anionex-dsh-vision-toolkit"
}
```

没有命令能装得上的时候，`install` 是 `null`，不是一个占位串。会直接执行这个
字段的调用方，不能拿到一条跑不通的命令——原因见下面 `--profile` 那段。

### 一个请求拿整份目录

```bash
curl -s 'https://dshmarketplace.dev/api/v1/index'
```

给那种需要知道"一千个仓库里哪些是插件"的调用方用 —— 浏览器扩展要给一整页
GitHub topic 打标记，不可能一个一个问。为了小，行是位置数组，大概 113 KB，
压过去 22 KB，列名跟着 payload 一起发：

```jsonc
{
  "fields": ["fullName", "category", "install", "path", "npm"],
  "plugins": [
    ["Anionex/dsh-vision-toolkit", "vision", "dsh plugin --profile web add dsh-vision-toolkit", "/plugins/anionex-dsh-vision-toolkit", "dsh-vision-toolkit"]
  ]
}
```

条目还没有独立页面的时候 `path` 是 `null`，插件没发包的时候 `npm` 是 `null`。

## 装 DSH 插件要知道的两件事

这两件事都花了不少时间才搞明白，也都不是这个项目造成的。

**`--profile` 是必填的。** `dsh plugin` 是把参数转发给 profile 目录里的
pnpm，所以 `dsh plugin add x` 会直接报 *required option '--profile
&lt;name&gt;' not specified*，什么都不装。这个目录给出的每条命令都带上了。

**`github:owner/repo#subpath` 不可能成立**——pnpm 会把 `#` 后面的东西当 git
ref 读。所以那 44 个没发 npm 的 monorepo 子目录插件没有一行安装命令，页面上
如实说明，而不是印一条跑不通的命令。

## 本地跑起来

```bash
pnpm install
cp .dev.vars.example .dev.vars     # 至少要填 Turso 那两个
pnpm dev                           # localhost:3177
```

| | |
| --- | --- |
| `pnpm build` | 推之前必须过 |
| `pnpm preview` | 用 workerd 跑，和线上一致 |
| `pnpm tsx scripts/sync-github.ts` | 刷新 GitHub 元数据 |
| `pnpm tsx scripts/write-content.ts --limit 10 --images` | 生成详情页 |
| `pnpm tsx scripts/promote.ts --limit 10` | 把页面放进 sitemap |

生成内容走的是 OpenAI 格式的网关，换成你自己的就行——`.dev.vars` 里的
`IMAGE_API_BASE` 和 `VELOKEY_*`。Worker 不读这些，只有生成脚本用。

推到 `main` 会自动部署到 Cloudflare Workers，大概 80 秒。

## 架构

```
app/(en)/            英文路由 —— root layout 设 lang="en"
app/(zh)/zh/         中文路由 —— root layout 设 lang="zh-Hans"
components/views/    页面本体，按语言参数化，两边共用
lib/dict.ts          所有会显示出来的文案，中英各一份
db/schema.ts         plugins、categories、plugin_stats、submissions
scripts/             生成期任务：seed、sync、write、promote
```

Next.js 16，通过 [OpenNext](https://opennext.js.org/) 跑在 Cloudflare
Workers 上，存储用 Turso，样式用 Tailwind。`CLAUDE.md` 是工程约定，
`STATUS.md` 是当前清点和踩坑记录，动大改之前都值得先看一眼。

有两条约束对这份代码的影响比什么都大：

- **Worker 体积上限。** 为了压到线以下，砍掉了二十个依赖和整套 auth
  middleware。加包之前先看体积。
- **Markdown 在生成期渲染，不在请求期。** `marked` 和 `sanitize-html` 不能
  进 Worker，sync 会把结果写进 `*Html` 列。

## 中文是写的，不是翻的

`lib/dict.ts` 里每一条都按两条规矩来：

产品名和生态名词保持英文——DeepSeek Harness、DSH、topic、npm、Star、commit、
agent、token、API，命令、文件名、配置项也一样。中文开发者就是用英文搜这些的，
而且「线束」这个同音词会把搜索结果搞坏。

其余的按中文开发者自己说话的方式写。「装之前先看一眼」，不是「安装前请仔细
阅读」。不用「让您」「轻松」「强大」「赋能」。往 `lib/dict.ts` 里塞机翻是不
接受的。

## 参与

插件没收到、分类错了、简介写得不对——<https://dshmarketplace.dev/submit>，
或者开个 issue。提交都是人工看过才会上。

如果插件是你写的，而且在 LINUX DO 发过帖，把帖子链接一起附上，可以挂认证标记。

## 安全

插件是第三方代码，跑起来带的是你 agent 的权限。**被这个目录收录不代表通过了
安全审计。**风险标记（安装脚本、终端执行、需要密钥）是自动识别的，会在安装
命令之前显示出来。没有标记不能证明任何事。源码地址始终会给出——装之前读一眼。

## 联系

- **社区** —— [LINUX DO](https://linux.do)
- **问题反馈** —— [GitHub Issues](https://github.com/DshMarketPlace/dshmarketplace/issues)

## 致谢

- [**LINUX DO**](https://linux.do) —— DSH 生态实际上是在这里被讨论的，这个
  项目也在这里发布和收反馈。
- [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
  （CC0-1.0）—— 目录最初的收录种子来自这里。
- [9d8dev/directory](https://github.com/9d8dev/directory)（MIT）—— 项目最初
  的应用脚手架。详见 [NOTICE](NOTICE)。

## 开源协议

MIT。插件元数据归各自仓库所有者，遵循它们各自的协议。

独立项目，与 DeepSeek 官方无隶属关系。DeepSeek 与 DeepSeek Harness 是各自
权利人的标识，此处仅用于说明这些插件是做什么用的。
