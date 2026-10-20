/**
 * [INPUT]: 依赖 sponsor.config.json 的活动配置和 i18n 的语言类型。
 * [OUTPUT]: 提供首页 SponsorFeature 与页脚 SponsorFooter 资源链接，共用配置和归因链接。
 * [POS]: 展示层推广与资源入口；首页标识赞助，页脚保留普通资源外链，不参与插件排名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { ArrowUpRight, Check } from "lucide-react";
import campaign from "@/sponsor.config.json";
import type { Locale } from "@/lib/i18n";

function sponsorHref(placement: keyof typeof campaign.placements) {
  const url = new URL(campaign.destination);
  for (const [key, value] of Object.entries(campaign.tracking)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("utm_content", placement);
  return url.toString();
}

export function SponsorFeature({ locale }: { locale: Locale }) {
  if (!campaign.enabled || !campaign.placements.home) return null;
  const copy = campaign.copy[locale];

  return (
    <section
      aria-label={`${copy.label} · ${campaign.brand}`}
      className="sponsor-feature border-b border-border"
    >
      <div className="mx-auto grid max-w-shell gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:py-9">
        <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-start lg:gap-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.logo}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-md"
            />
            <span className="text-lg font-semibold tracking-normal">
              {campaign.brand}
            </span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-normal text-muted-foreground">
            {copy.label}
          </span>
        </div>

        <div className="min-w-0 space-y-3 lg:border-l lg:border-border lg:pl-10">
          <p className="text-[11px] font-medium uppercase tracking-normal text-[var(--sponsor-accent)]">
            {copy.category}
          </p>
          <h2 className="text-pretty text-2xl font-semibold leading-tight tracking-normal sm:text-[28px]">
            {copy.title}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {copy.benefits.map((benefit) => (
              <li
                key={benefit}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-[var(--sponsor-accent)]"
                  aria-hidden
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-3 lg:max-w-[210px] lg:items-end">
          <a
            href={sponsorHref("home")}
            target="_blank"
            rel="sponsored noopener"
            className="sponsor-cta inline-flex min-h-11 items-center justify-center gap-3 rounded px-5 py-3 text-sm font-medium transition-colors"
          >
            {copy.cta}
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

export function SponsorFooter({ locale }: { locale: Locale }) {
  if (!campaign.enabled || !campaign.placements.footer) return null;
  const copy = campaign.copy[locale];
  return (
    <div className="pt-1 text-sm">
      <a
        href={sponsorHref("footer")}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1.5 hover:text-copper"
      >
        {copy.footer}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
