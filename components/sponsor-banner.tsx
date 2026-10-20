/**
 * [INPUT]: 依赖活动 JSON、当前路由和语言，复用现有 GA 事件队列。
 * [OUTPUT]: 提供可关闭的 SponsorBanner，仅在非首页公开页面展示。
 * [POS]: 导航前的轻量推广入口；不吸顶，不改变目录业务和页面标题。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import campaign from "@/sponsor.config.json";
import type { Locale } from "@/lib/i18n";

export function SponsorBanner({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const visible =
    campaign.enabled &&
    campaign.placements.top_banner &&
    !dismissed &&
    pathname !== "/" &&
    pathname !== "/zh" &&
    !pathname.startsWith("/admin");
  const copy = campaign.copy[locale];
  const url = new URL(campaign.destination);
  for (const [key, value] of Object.entries(campaign.tracking))
    url.searchParams.set(key, value);
  url.searchParams.set("utm_content", "top_banner");

  function track(event: string) {
    const analytics = window as Window & {
      gtag?: (
        command: string,
        event: string,
        fields: Record<string, string>,
      ) => void;
    };
    analytics.gtag?.("event", event, {
      campaign_id: campaign.tracking.utm_campaign,
      placement_id: "top_banner",
      locale,
      source_path: pathname,
    });
  }

  useEffect(() => {
    if (!visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          track("outbound_impression");
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
    // 每次路由进入时重新统计一次可见曝光，不随普通重渲染重复发送。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pathname, locale]);

  if (!visible) return null;
  return (
    <aside
      ref={ref}
      aria-label={`${copy.label} · ${campaign.brand}`}
      className="sponsor-banner border-b"
    >
      <div className="relative mx-auto flex min-h-10 max-w-shell items-center justify-center gap-x-3 gap-y-1 py-2 pl-5 pr-12 text-xs sm:px-12">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center leading-relaxed">
          <span className="font-semibold">{campaign.brand}</span>
          <span aria-hidden className="opacity-40">
            /
          </span>
          <span>{copy.banner}</span>
          <a
            href={url.toString()}
            target="_blank"
            rel="sponsored noopener"
            onClick={() => track("outbound_click")}
            className="decoration-current/30 inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:decoration-current"
          >
            {copy.bannerCta}
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        </p>
        <button
          type="button"
          aria-label={copy.dismiss}
          title={copy.dismiss}
          onClick={() => {
            track("outbound_dismiss");
            setDismissed(true);
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:right-5"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
