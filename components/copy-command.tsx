"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

/**
 * Command line with a copy affordance. The whole strip is the button — a
 * command is one thing to copy, so splitting it into a text region plus a
 * separate icon target only halves the hit area.
 */
export function CopyCommand({
  command,
  className,
  size = "default",
  locale = "en",
}: {
  command: string;
  className?: string;
  size?: "default" | "lg";
  locale?: Locale;
}) {
  const d = t(locale).copy;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is unavailable over plain HTTP and in some embedded views;
      // the command stays selectable either way.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? d.done : `${d.idle}: ${command}`}
      className={cn(
        "group/cmd flex w-full items-center gap-3 border border-border bg-paper-sunken text-left font-mono transition-colors hover:border-rule-strong",
        size === "lg" ? "px-4 py-3 text-sm" : "px-3 py-2 text-xs",
        className,
      )}
    >
      <span aria-hidden className="select-none text-copper">
        $
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground">{command}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-copper" aria-hidden />
      ) : (
        <Copy
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/cmd:text-foreground"
          aria-hidden
        />
      )}
    </button>
  );
}
