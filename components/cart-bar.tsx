"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import { CopyCommand } from "@/components/copy-command";
import {
  CART_EVENT,
  CART_MAX,
  cartCliCommand,
  cartRawCommand,
  clearCart,
  readCart,
  removeCartItem,
  type CartItem,
} from "@/lib/cart";
import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

/**
 * The bar only exists once something is in it, so an empty cart costs the page
 * a hidden element and nothing else. Mounted in the site frame rather than the
 * catalogue, because a selection survives navigating to a detail page and back.
 */
export function CartBar({ locale = "en" }: { locale?: Locale }) {
  const d = t(locale).cart;
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!items.length) return null;

  // Stated, not silently dropped. The sandbox verdict travelled with the item
  // when it was added, and a set that quietly contains something known not to
  // install is exactly what this catalogue exists not to publish.
  const broken = items.filter((i) =>
    i.installCheck ? ["failed", "timeout"].includes(i.installCheck) : false,
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-shell px-5 sm:px-8">
        <div className="flex items-center gap-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium"
            aria-expanded={open}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronUp className="h-4 w-4" aria-hidden />
            )}
            {d.count(items.length)}
          </button>

          {items.length >= CART_MAX ? (
            <span className="text-xs text-copper">{d.full(CART_MAX)}</span>
          ) : null}

          <button
            type="button"
            onClick={() => setItems(clearCart())}
            className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {d.clear}
          </button>
        </div>

        {open ? (
          <div className="border-t border-border py-4">
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {items.map((i) => (
                <li key={i.target}>
                  <button
                    type="button"
                    onClick={() => setItems(removeCartItem(i.target))}
                    className="inline-flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-xs transition-colors hover:border-copper hover:text-copper"
                    aria-label={`${d.remove} ${i.target}`}
                  >
                    {i.target}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            {broken.length ? (
              <p className="mt-3 mb-0 text-xs text-copper">
                {d.brokenWarning(broken.map((b) => b.target).join(", "))}
              </p>
            ) : null}

            <p className="mt-4 mb-1 text-xs font-semibold">{d.recommended}</p>
            <CopyCommand command={cartCliCommand(items)} locale={locale} />
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              {d.recommendedWhy}
            </p>

            <p className="mt-0 mb-1 text-xs font-semibold">{d.manual}</p>
            <CopyCommand command={cartRawCommand(items)} locale={locale} />
          </div>
        ) : (
          <div className="pb-3">
            <CopyCommand command={cartCliCommand(items)} locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}
