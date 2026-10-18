"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";

import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";
import {
  channelsFor,
  composeShare,
  shareHref,
  type ShareChannel,
  type ShareTarget,
} from "@/lib/share";
import { cn } from "@/lib/utils";

type Copied = "body" | "link" | "wechat" | null;

/**
 * Share the directory, or one listing, as a composed paragraph — not a naked
 * URL. Native `<dialog>` on purpose: the Worker size ceiling already forbids
 * pulling a popover library for Esc, focus and a backdrop.
 */
export function ShareDialog({
  locale,
  target,
  variant = "nav",
}: {
  locale: Locale;
  target: ShareTarget;
  variant?: "nav" | "link" | "meta";
}) {
  const d = t(locale).share;
  const payload = composeShare(locale, target);
  const channels = channelsFor(locale);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<Copied>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [canSystemShare, setCanSystemShare] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    setCanSystemShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy(kind: Exclude<Copied, null>, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFailed(false);
      setCopied(kind);
    } catch {
      setCopyFailed(true);
    }
  }

  async function systemShare() {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.body,
        url: payload.url,
      });
      setOpen(false);
    } catch {
      // AbortError from dismissing the sheet is not a failure worth reporting.
    }
  }

  const triggerLabel =
    variant === "meta" || target.kind === "plugin" ? d.listing : d.nav;
  const triggerAria =
    target.kind === "plugin" ? d.pluginAria(target.name) : d.navAria;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerAria}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors",
          variant === "nav" &&
            "border border-border px-2 py-1 text-xs text-muted-foreground hover:border-rule-strong hover:text-foreground",
          variant === "link" &&
            "text-sm text-foreground hover:text-copper",
          variant === "meta" &&
            "hover:text-foreground hover:underline",
        )}
      >
        <Share2
          className={variant === "nav" ? "h-3 w-3" : "h-3.5 w-3.5"}
          aria-hidden
        />
        {triggerLabel}
      </button>

      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        className="max-h-[85vh] w-[min(36rem,calc(100vw-2rem))] flex-col overflow-hidden border border-rule-strong bg-card p-0 text-foreground backdrop:bg-ink/40 open:flex"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow text-copper">
              {target.kind === "plugin" ? d.pluginEyebrow : d.siteEyebrow}
            </p>
            <h2 id={titleId} className="display mt-1 text-lg tracking-tight">
              {target.kind === "plugin"
                ? d.pluginShareHeading(target.name)
                : d.siteHeading}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {target.kind === "plugin" ? d.pluginLede : d.siteLede}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={d.close}
            className="-mr-1 -mt-1 p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <p className="eyebrow mb-2">{d.previewLabel}</p>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words border border-border bg-paper-sunken px-4 py-3 font-sans text-sm leading-relaxed text-foreground">
              {payload.body}
            </pre>
          </div>

          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            <CopyAction
              label={copied === "body" ? d.copied : d.copyBody}
              done={copied === "body"}
              onClick={() => copy("body", payload.body)}
            />
            <CopyAction
              label={copied === "link" ? d.copied : d.copyLink}
              done={copied === "link"}
              onClick={() => copy("link", payload.url)}
            />
          </div>

          {copyFailed ? (
            <p className="text-xs leading-relaxed text-copper">{d.copyFailed}</p>
          ) : null}

          {canSystemShare ? (
            <button
              type="button"
              onClick={systemShare}
              className="flex w-full flex-col gap-0.5 border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-paper-sunken"
            >
              <span className="text-sm">{d.system}</span>
              <span className="text-xs text-muted-foreground">
                {d.systemHint}
              </span>
            </button>
          ) : null}

          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {locale === "zh" ? (
              <button
                type="button"
                onClick={() => copy("wechat", payload.body)}
                className="flex flex-col gap-0.5 bg-background px-4 py-3 text-left transition-colors hover:bg-paper-sunken sm:col-span-2"
              >
                <span className="text-sm">
                  {copied === "wechat" ? d.copied : d.wechat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.wechatHint}
                </span>
              </button>
            ) : null}

            {channels.map((channel) => (
              <ChannelLink
                key={channel}
                channel={channel}
                href={shareHref(channel, payload)}
                locale={locale}
                featured={channel === "linuxdo"}
              />
            ))}

            {locale === "en" ? (
              <button
                type="button"
                onClick={() => copy("wechat", payload.body)}
                className="flex flex-col gap-0.5 bg-background px-4 py-3 text-left transition-colors hover:bg-paper-sunken"
              >
                <span className="text-sm">
                  {copied === "wechat" ? d.copied : d.wechat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.wechatHint}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}

function CopyAction({
  label,
  done,
  onClick,
}: {
  label: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 bg-background px-4 py-3 text-sm transition-colors hover:bg-paper-sunken"
    >
      {done ? (
        <Check className="h-3.5 w-3.5 text-copper" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      )}
      {label}
    </button>
  );
}

function ChannelLink({
  channel,
  href,
  locale,
  featured,
}: {
  channel: ShareChannel;
  href: string;
  locale: Locale;
  featured: boolean;
}) {
  const d = t(locale).share;
  const labels: Record<ShareChannel, { name: string; hint: string }> = {
    linuxdo: { name: d.linuxdo, hint: d.linuxdoHint },
    x: { name: d.x, hint: d.xHint },
    weibo: { name: d.weibo, hint: d.weiboHint },
    telegram: { name: d.telegram, hint: d.telegramHint },
    reddit: { name: d.reddit, hint: d.redditHint },
    linkedin: { name: d.linkedin, hint: d.linkedinHint },
    whatsapp: { name: d.whatsapp, hint: d.whatsappHint },
  };
  const { name, hint } = labels[channel];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col gap-0.5 bg-background px-4 py-3 transition-colors hover:bg-paper-sunken",
        featured && "border-l-2 border-copper sm:col-span-2",
      )}
    >
      <span className="text-sm">{name}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </a>
  );
}
