# components/
> L2 | 父级: ../AGENTS.md

共享展示层；业务数据由 views 获取，赞助活动配置与插件数据保持隔离。

## 成员清单
- `sponsor-banner.tsx`: 非首页公开页面的可关闭顶部公告，配置驱动，向现有 GA 队列发送曝光、点击与关闭事件，链接标识 top_banner。
- `sponsor.tsx`: 配置驱动的首页赞助区与页脚普通资源外链，共享双语文案、投放开关和 UTM 归因；页脚不展示赞助标题。
- `site-frame.tsx`: 双语页面外壳，编排导航、页脚、主题及购物栏。
- `analytics.tsx`: 站点分析接入。
- `cart-bar.tsx`: 已选插件的批量安装操作栏。
- `cart-button.tsx`: 单个插件的选择操作。
- `copy-command.tsx`: 安装命令复制交互。
- `craft.tsx`: 通用内容布局原语。
- `install-check.tsx`: 插件安装检查结果展示。
- `language-switch.tsx`: 双语路由切换。
- `page-shell.tsx`: 内容页面公共布局。
- `plugin-card.tsx`: 插件目录条目展示。
- `preset-card.tsx`: 预设插件组合展示。
- `pull-request-submission.tsx`: Pull Request 提交引导。
- `refusal-table.tsx`: 拒绝安装结果列表。
- `review-dialog.tsx`: 插件评测对话框。
- `security-panel.tsx`: 详情页「安全」区块：沙箱被拦的构建脚本、package.json 安装钩子、README 关键词，每行注明来源，不是审计。
- `submit-form.tsx`: 插件投稿表单。
- `theme-provider.tsx`: 主题上下文。
- `theme-toggle.tsx`: 明暗主题切换。
- `views/`: 页面内容编排，详见 views/AGENTS.md。
- `ui/`: 通用交互基础组件。
- `admin/`: 管理界面组件。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
