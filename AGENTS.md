# dshmarketplace - DeepSeek Harness 插件双语目录站
> L2 | 父级: ../AGENTS.md

Next.js 16.3.1 + React 19 + TypeScript + Tailwind CSS 3 + Drizzle ORM + OpenNext Cloudflare。

## 局部地图
- `app/`: App Router 页面与服务端路由，承载英文与中文目录入口。
- `components/`: 页面组合与共享 UI 组件。
- `lib/`: 目录业务能力与外部服务集成。
- `db/`、`migrations/`: 数据模型与数据库迁移记录。
- `scripts/`: 目录同步、种子数据与维护脚本。
- `public/`: 公开静态资源。
- `docs/`、`ops/`: 项目文档与运维资料。
- `package.json`、`pnpm-lock.yaml`: 项目命令、依赖声明与锁定版本。
- `next.config.mjs`、`open-next.config.ts`、`wrangler.jsonc`: Next.js 构建与 Cloudflare 运行部署配置。
- `directory.config.ts`、`drizzle.config.ts`: 目录站与数据库工具配置。
- `sponsor.config.json`: 赞助活动唯一配置源，集中维护开关、位置、品牌资源、落地链接、UTM 与中英文文案；由 components/sponsor.tsx 消费，不接入插件排序。
- `README.md`、`README.zh-CN.md`、`CONTRIBUTING.md`、`STATUS.md`、`CLAUDE.md`: 上游说明、贡献约定与开发状态。

## 本地接入边界
- 2026-10-20 从 `https://github.com/DshMarketPlace/dshmarketplace.git` 完整克隆，保留独立 `.git` 与 `origin`，不与其他子项目共享业务代码。
- 初次接入保留上游源码；后续已安装锁定依赖并增加推广展示层，本地预览使用隔离临时数据库，未配置生产密钥或手动部署。
- 后续开发遵循原有 pnpm 工作流；修改模块时再维护对应局部地图与文件契约，不批量改写未修改的上游源码。

## 赞助位维护
- 内页导航上方展示可关闭、非吸顶的轻量公告；首页和管理区不展示。开关与双语文案由 sponsor.config.json 管理，组件状态仅在当前挂载周期保存关闭选择。
- 顶部公告通过现有 GA 队列记录 outbound_impression / outbound_click / outbound_dismiss，字段为 campaign_id、placement_id、locale、source_path；曝光以至少 50% 进入视口为准。链接使用 utm_content=top_banner，不代表已接通 BeatAPI 注册或调用转化。
- 首页 Hero 下方展示赞助入口，保留赞助标签与 sponsored 外链关系；页脚品牌区仅显示「免费 DeepSeek API」普通资源链接，使用 noopener，不展示赞助标题。
- 更换活动或暂停展示仅修改 sponsor.config.json；链接归因保留免费模型 variant 和页面锚点。
- 免费入口不宣称无限额度、永久可用或已经验证的 DSH 兼容性；使用限制以落地页为准。
- 本地 UI 预览可使用临时 Turso 数据库执行现有 migrations，空目录不代表生产内容；不得为预览修改生产数据。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
