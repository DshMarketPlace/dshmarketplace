"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { InstallHost } from "@/lib/install";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dshm:install-host";

/**
 * Web or Desktop, for the install commands on a detail page.
 *
 * Both panels are rendered on the server and one is hidden, so the default
 * page — and every crawler — gets the `web` commands with no script at all.
 * The choice is remembered per browser; a reader on Desktop wants it on the
 * next plugin too. Storage can throw (private mode, blocked site data), and
 * then the switch simply forgets.
 */
export function InstallHostSwitch({
  label,
  hosts,
}: {
  label: string;
  hosts: { id: InstallHost; name: string; body: ReactNode }[];
}) {
  const [host, setHost] = useState<InstallHost>("web");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && hosts.some((h) => h.id === saved)) setHost(saved as InstallHost);
    } catch {
      // Unreadable storage leaves the default, which is what a first visit gets.
    }
  }, [hosts]);

  function choose(id: InstallHost) {
    setHost(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Not remembering is fine; the switch still works for this page.
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="eyebrow" id="install-host-label">
          {label}
        </span>
        <div
          role="radiogroup"
          aria-labelledby="install-host-label"
          className="inline-flex border border-border"
        >
          {hosts.map((h, i) => (
            <button
              key={h.id}
              type="button"
              role="radio"
              aria-checked={h.id === host}
              onClick={() => choose(h.id)}
              className={cn(
                "px-2.5 py-1 text-[0.6875rem] transition-colors",
                i > 0 && "border-l border-border",
                h.id === host
                  ? "bg-copper/10 text-copper"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>
      {hosts.map((h) => (
        <div key={h.id} hidden={h.id !== host} className="space-y-4">
          {h.body}
        </div>
      ))}
    </div>
  );
}
