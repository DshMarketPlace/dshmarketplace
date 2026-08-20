/**
 * The build-a-set cart.
 *
 * Deliberately not a context provider. Cards are server-rendered and the
 * catalogue is a server component, so wrapping the tree to share state would
 * turn the whole page into a client bundle for the sake of a list of strings.
 * Instead the cart lives in localStorage, and every reader subscribes to one
 * custom event — which also makes two tabs agree, for free, via `storage`.
 *
 * An item is the install *target* (`@liustack/modlens`), never a command. The
 * command is composed once, at the point it is shown, so a change to how we
 * install cannot leave a stale string sitting in someone's browser.
 */

export type CartItem = {
  target: string;
  fullName: string;
  /** The sandbox verdict at the time it was added, for the warning line. */
  installCheck: string | null;
};

/**
 * npm name or `github:owner/repo[#path:sub]`. Both are things `dsh plugin add`
 * takes, and gating on npm alone dropped two thirds of the catalogue's top
 * page — most high-star plugins install from source.
 */
const TARGET =
  /^(?:(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*|github:[\w.-]+\/[\w.-]+(?:#[\w.:/-]+)?)$/i;

const KEY = "dshm.cart.v1";
export const CART_EVENT = "dshm:cart";

/** Above this the command stops being something a person pastes. */
export const CART_MAX = 20;

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validated rather than trusted: this is user-writable storage that may
    // also hold an older shape of this key, and a malformed entry would
    // otherwise reach the command we tell someone to run.
    return parsed.filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).target === "string" &&
        TARGET.test((i as CartItem).target),
    );
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Private mode, or a full quota. The in-memory list still works for this
    // page view, so a failure to persist must not break adding to the cart.
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function toggleCartItem(item: CartItem): CartItem[] {
  const items = readCart();
  const next = items.some((i) => i.target === item.target)
    ? items.filter((i) => i.target !== item.target)
    : [...items, item].slice(0, CART_MAX);
  write(next);
  return next;
}

export function removeCartItem(target: string): CartItem[] {
  const next = readCart().filter((i) => i.target !== target);
  write(next);
  return next;
}

export function clearCart(): CartItem[] {
  write([]);
  return [];
}

/**
 * Our command first because it does what a paste cannot: it reads the profile
 * DeepSeek Harness actually created, drops anything the sandbox could not
 * install, and allowlists a blocked build script so nothing lands inert.
 */
export function cartCliCommand(items: CartItem[]): string {
  return `npx dshmarketplace-cli add ${items.map((i) => i.target).join(" ")}`;
}

/** The raw equivalent, shown too — hiding it would be the opposite of the point. */
export function cartRawCommand(items: CartItem[], profile = "web"): string {
  return `dsh plugin --profile ${profile} add ${items.map((i) => i.target).join(" ")}`;
}
