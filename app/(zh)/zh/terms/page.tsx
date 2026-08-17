import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { alternatesFor, localePath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "使用条款 — DSH Marketplace",
  description: "DSH Marketplace 的使用条款，包括「被收录」到底意味着什么。",
  alternates: alternatesFor("zh", "/terms"),
};

export default function TermsPageZh() {
  return (
    <PageShell
      locale="zh"
      eyebrow="条款"
      title="使用条款"
      updated="2026 年 8 月 17 日"
      updatedLabel="最后更新"
      lede="使用本站即表示接受以下条款。真正要紧的是第 3 条。"
    >
      <h2>1. 这个服务是什么</h2>
      <p>
        DSH Marketplace 是一份与 DeepSeek Harness
        相关的公开代码仓库索引。本站不托管任何插件代码，所有安装命令指向的都是发布它的第三方来源。
      </p>

      <h2>2. 无隶属关系</h2>
      <p>
        这是一个独立项目，与 DeepSeek
        之间不存在隶属、赞助或背书关系。文中出现的产品名称与标识归各自权利人所有，此处仅用于说明被索引的软件是做什么的。
      </p>

      <h2>3. 收录不等于推荐、审核或担保</h2>
      <p>
        一条记录只说明「存在这样一个仓库，并且命中了本站的来源」。它不说明这个插件安全、能用、有人维护，或者适合任何特定用途。风险提示是启发式的，并不完整；没有提示什么也证明不了。
      </p>
      <p>
        插件在你的 agent 内部执行，用的是你 agent
        的权限。运行任何代码之前，审阅它是你自己的责任。在法律允许的最大范围内，对于你通过本站找到的软件所造成的损失或损害，本站不承担责任。
      </p>

      <h2>4. 第三方内容</h2>
      <p>
        仓库描述、README
        内容和截图的著作权归各自作者所有，本站按作者所选择的协议转载。作者可以随时要求更正或删除——见
        <Link href={localePath("zh", "/submit")}>「提交插件」</Link>。
      </p>

      <h2>5. 可接受的使用方式</h2>
      <p>
        目录 API 是公开的，不需要鉴权。请把请求量控制在合理范围内，并用
        User-Agent
        标明你的客户端。对于影响他人正常使用的流量，本站可能会限流或者封禁。
      </p>
      <p>
        不要用本站分发恶意软件、冒充他人作品，或者提交你没有权利提交的仓库。
      </p>

      <h2>6. 可用性</h2>
      <p>
        本服务按「现状」提供，不附带任何形式的担保。它可能变更、故障，或者不经通知就停止服务。
      </p>

      <h2>7. 变更</h2>
      <p>
        本条款可能更新，上方日期即为当前版本。变更之后继续使用，视为接受变更。
      </p>

      <h2>8. 联系</h2>
      <p>
        <a href="mailto:hello@dshmarketplace.dev">hello@dshmarketplace.dev</a>
      </p>
    </PageShell>
  );
}
