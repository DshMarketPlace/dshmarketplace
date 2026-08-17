"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

/**
 * The AI review, behind a button on the card.
 *
 * A native `<dialog>` rather than a dialog library: focus trapping, Esc, inert
 * background and the top layer all come with the element, and the Worker has a
 * size ceiling that a headless-UI package would eat into for behaviour the
 * platform already ships.
 *
 * The content is pre-generated and sanitised at author time — the same rule
 * README markdown follows. Nothing here calls a model at request time: the
 * same plugin would produce the same paragraph for every reader, and a modal
 * that spins for twenty seconds is worse than one that opens.
 */
export function ReviewDialog({
  name,
  html,
  model,
  sourceUrl,
  locale = "en",
}: {
  name: string;
  html: string;
  model: string | null;
  sourceUrl: string;
  locale?: Locale;
}) {
  const d = t(locale).review;
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // `showModal()` is the only way into the top layer, and it cannot be
  // expressed as a prop — the element has to be told.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1 border border-copper px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-copper transition-colors hover:bg-copper hover:text-paper"
      >
        <Sparkles className="h-2.5 w-2.5" aria-hidden />
        {d.badge}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        // A backdrop click lands on the dialog itself, never on its contents.
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        // `open:flex`, never a bare `flex`. A closed <dialog> is hidden by a UA
        // rule of lower specificity than any class, so `display: flex` from a
        // utility overrides it and every dialog on the page renders inline —
        // which is exactly what shipped, stacking six panels down the homepage.
        className="max-h-[85vh] w-[min(34rem,calc(100vw-2rem))] flex-col overflow-hidden border border-rule-strong bg-card p-0 text-foreground backdrop:bg-ink/40 open:flex"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-1.5 text-copper">
              <Sparkles className="h-3 w-3" aria-hidden />
              {d.title}
            </p>
            <p className="mt-1 truncate font-mono text-sm">{name}</p>
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

        <div
          className="prose prose-sm dark:prose-invert min-h-0 max-w-none overflow-y-auto px-5 py-4 prose-p:my-2.5 prose-strong:text-copper prose-code:before:content-none prose-code:after:content-none prose-code:font-normal"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="flex shrink-0 items-start justify-between gap-4 border-t border-border px-5 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
          <span className="min-w-0 flex-1">
            {model ? d.disclaimerWithModel(model) : d.disclaimer}
          </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener"
            className="shrink-0 text-foreground transition-colors hover:text-copper"
          >
            {d.readSource}
          </a>
        </div>
      </dialog>
    </>
  );
}
