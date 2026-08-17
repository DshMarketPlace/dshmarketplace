import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "隐私 — DSH Marketplace",
  description: "这个站收集什么、不收集什么，以及数据会经过哪些第三方。",
  alternates: alternatesFor("zh", "/privacy"),
  robots: { index: true, follow: true },
};

export default function PrivacyPageZh() {
  return (
    <PageShell
      locale="zh"
      eyebrow="条款"
      title="隐私"
      updated="2026 年 8 月 17 日"
      updatedLabel="最后更新"
      lede="很短，因为这个站几乎不拿你的数据做什么。"
    >
      <h2>不需要账号</h2>
      <p>
        浏览本站不需要账号，也不需要注册。本站自己设置的 cookie
        只有一个，用于后台管理区的登录会话，普通访客不会拿到它。
      </p>

      <h2>收集了什么</h2>
      <ul>
        <li>
          <strong>Google Analytics。</strong>本站用 Google Analytics 4
          统计哪些页面被访问、访客从哪里来。Google 会设置它自己的 cookie，并处理你的
          IP
          地址。这些数据只是让我们知道这个站整体上被怎么用，不用于识别你个人，也不会和其他任何数据关联。
        </li>
        <li>
          <strong>服务器日志。</strong>托管服务商会按标准记录请求数据——IP
          地址、User-Agent、请求路径、时间戳——用于内容分发、安全和防滥用。保留时间很短，不会用来给你建画像。
        </li>
        <li>
          <strong>邮箱地址</strong>
          ，只有你提交插件时自己在联系方式那一栏填了才会有，这一栏可以不填。只用来回复这条提交，不做别的，没有邮件列表。
        </li>
        <li>
          <strong>往来信件</strong>，如果你就某条记录写信过来。
        </li>
      </ul>

      <h2>没有收集什么</h2>
      <p>
        没有会话录制，没有广告或再营销受众，没有跨站广告标识；不出售，也不共享给数据经纪商。
      </p>

      <h2>不想被统计</h2>
      <p>
        任何能拦住 Google Analytics
        的浏览器设置、扩展或者跟踪保护功能，在这里都有效；没有它这个站照样能用。Google
        自己也提供了一个
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          rel="noopener nofollow"
        >
          浏览器退出插件
        </a>
        。
      </p>

      <h2>命令行工具</h2>
      <p>
        <code>dshmarketplace</code> CLI 会把你输入的搜索词发到本站的公开目录
        API，因为它要靠这个回答你。它不发送任何标识符，不上报遥测，也不读取你机器上的任何东西。
      </p>

      <h2>第三方</h2>
      <ul>
        <li>
          <strong>Google Analytics</strong> 按上文所述接收页面浏览数据，适用{" "}
          <a href="https://policies.google.com/privacy" rel="noopener nofollow">
            Google 的隐私政策
          </a>
          。
        </li>
        <li>
          <strong>Cloudflare</strong> 负责本站的分发，并按上文所述处理请求数据。
        </li>
        <li>
          <strong>Turso</strong>{" "}
          托管目录数据库。里面装的是公开仓库的元数据，不是访客数据。
        </li>
        <li>
          <strong>GitHub</strong> 是插件元数据的来源。详情页上的图片和链接可能从
          GitHub 的服务器加载，也就是说 GitHub 会看到这些请求。
        </li>
      </ul>

      <h2>你的权利</h2>
      <p>
        你可以询问本站持有你的哪些信息、要求删除，或者随时退订，写信到{" "}
        <a href="mailto:privacy@dshmarketplace.dev">
          privacy@dshmarketplace.dev
        </a>
        。
      </p>

      <h2>变更</h2>
      <p>如果本政策有实质性变更，上方日期会随之更新。</p>
    </PageShell>
  );
}
