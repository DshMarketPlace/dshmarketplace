import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { CopyCommand } from "@/components/copy-command";
import { SubmitForm } from "@/components/submit-form";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "提交 DeepSeek Harness 插件 — DSH Marketplace",
  description:
    "让你的 DeepSeek Harness 插件被收录。给仓库打上 dsh-plugin topic，或者直接提交。",
  alternates: alternatesFor("zh", "/submit"),
};

export default function SubmitPageZh() {
  return (
    <PageShell
      locale="zh"
      eyebrow="面向作者"
      title="提交插件"
      lede="大部分插件是自动发现的。如果你的还没被收录，这一页说明为什么，以及怎么在一分钟内解决。"
    >
      <h2>提交一个仓库</h2>
      <p>
        把仓库地址贴进来，这边会先读一遍它的公开信息给你看——topic、开源协议、描述，以及是不是已经被收录了。提交之后要人工过一遍才会发布。
      </p>
      <SubmitForm locale="zh" />

      <h2>更快的办法：给仓库打 topic</h2>
      <p>
        本站同步 GitHub 上的 <code>dsh-plugin</code> topic。给你的仓库加上它，
        下一轮同步就会收录，不用提交——顺带一提，这也会让你被其他所有 DSH
        插件市场发现，包括 DeepSeek Harness 自带的那个。
      </p>
      <p>
        在 GitHub 上打开你的仓库，点 <em>About</em> 旁边那个齿轮，把{" "}
        <code>dsh-plugin</code> 加进 Topics。或者用命令行：
      </p>
      <CopyCommand
        size="lg"
        locale="zh"
        command="gh repo edit --add-topic dsh-plugin"
        className="not-prose my-4"
      />

      <h2>怎样的记录看着体面</h2>
      <p>
        记录是根据你仓库公开的内容生成的，所以下面这几个字段值得花点时间填：
      </p>
      <ul>
        <li>
          <strong>仓库描述</strong> ——
          它会变成你卡片上那句摘要。写一句这插件能干什么，别写它是怎么实现的。
        </li>
        <li>
          <strong>协议文件</strong> ——
          没有协议的仓库默认保留全部权利，记录上会照实写出来。
        </li>
        <li>
          <strong>带安装说明的 README</strong> ——
          它会渲染在你的详情页上，等于你在这边的落地页。
        </li>
        <li>
          <strong>npm 包</strong>，如果你发了的话。安装时直接拉 tarball
          而不是克隆整个仓库，用户那边能明显感觉到快。
        </li>
      </ul>

      <h2>怎么进社区精选库</h2>
      <p>
        标着「已进入精选库」的记录，是通过了那个社区项目的审核——DeepSeek Harness
        自带的插件市场就是从那儿装的。那是另一个项目，不归这个站管，去给{" "}
        <a
          href="https://github.com/awesome-dsh-plugin/awesome-dsh-plugin"
          rel="noopener"
        >
          awesome-dsh-plugin
        </a>{" "}
        提 PR。
      </p>

      <h2>纠错和下架</h2>
      <p>
        如果哪条记录把你的插件写错了，或者你不想被收录，说一声就行，不用给理由。把仓库上的
        topic 去掉，下一轮同步也会自动掉出去。
      </p>
      <p>
        联系方式：
        <a href="mailto:hello@dshmarketplace.dev">hello@dshmarketplace.dev</a>。
      </p>
    </PageShell>
  );
}
