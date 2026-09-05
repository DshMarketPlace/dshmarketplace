// Reviewed catalogue copy takes precedence over imported descriptions.
// Revisit these entries when the author changes the documented capabilities.
const corrections: Record<string, { summary: string; summaryZh: string; source: string }> = {
  "moguiyu/dsh-tavily#packages/dsh-tavily": {
    summary: "Opt-in Tavily search, extract, map, and crawl tools with multi-key rotation and failover, a usage gauge, and a settings card, without replacing the built-in web_search.",
    summaryZh: "可选启用的 Tavily 搜索、内容提取、站点地图与爬取工具，支持多密钥轮换与故障转移、用量仪表盘和设置卡片，保留内置 web_search。",
    source: "https://github.com/DshMarketPlace/dshmarketplace/issues/2",
  },
  "moguiyu/dsh-tavily#packages/dsh-tool-tavily-search": {
    summary: "Headless Tavily search, extract, map, and crawl tools with multi-key rotation and failover on 401/429. No settings card; install @moguiyu/dsh-tavily for the card. The built-in web_search is preserved.",
    summaryZh: "无界面版 Tavily 搜索、内容提取、站点地图与爬取工具，支持多密钥轮换及 401/429 故障转移。不含设置卡片，需要卡片请安装 @moguiyu/dsh-tavily；保留内置 web_search。",
    source: "https://github.com/DshMarketPlace/dshmarketplace/issues/2",
  },
};

export function correctedSummary(fullName: string) {
  const correction = corrections[fullName.toLowerCase()];
  return correction
    ? { summary: correction.summary, summaryZh: correction.summaryZh }
    : {};
}
