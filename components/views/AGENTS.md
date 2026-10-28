# components/views/
> L2 | 父级: ../AGENTS.md

## 成员清单
- `home-view.tsx`: 首页编排，从目录数据生成推荐内容；Hero 后独立展示配置驱动的赞助区，不改变插件排序。
- `catalogue-view.tsx`: 插件浏览、筛选与分类入口。
- `plugin-view.tsx`: 插件详情与安装信息。
- `top-view.tsx`: 排行榜视图。
- `weekly-view.tsx`: 周报列表与单期视图，渲染 `weekly_reports` 里定稿的数据，并提供两类页面的 metadata 与 Article JSON-LD。
- `upgrade-view.tsx`: 升级前检查（/upgrade）：粘贴插件查 next/alpha 预览结果（客户端 `components/upgrade-check.tsx`），下方为服务端渲染的各 tag 统计与回归表。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
