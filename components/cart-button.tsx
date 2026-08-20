"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";

import { CART_EVENT, readCart, toggleCartItem, type CartItem } from "@/lib/cart";
import { t } from "@/lib/dict";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

/**
 * Per-card toggle. Reads its own state from the shared store on mount and on
 * every cart event, so a card added from the bar's remove button updates here
 * without either component knowing about the other.
 */
export function CartButton({
  item,
  locale = "en",
  className,
}: {
  item: CartItem;
  locale?: Locale;
  className?: string;
}) {
  const d = t(locale).cart;
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const sync = () => setInCart(readCart().some((i) => i.target === item.target));
    sync();
    window.addEventListener(CART_EVENT, sync);
    // Keeps a second tab honest — localStorage fires this cross-document.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.target]);

  return (
    <button
      type="button"
      onClick={() => setInCart(toggleCartItem(item).some((i) => i.target === item.target))}
      aria-pressed={inCart}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.6875rem] transition-colors",
        inCart
          ? "border-copper bg-copper/10 text-copper"
          : "border-border text-muted-foreground hover:border-copper hover:text-copper",
        className,
      )}
    >
      {inCart ? (
        <Check className="h-3 w-3" aria-hidden />
      ) : (
        <Plus className="h-3 w-3" aria-hidden />
      )}
      {inCart ? d.added : d.add}
    </button>
  );
}
