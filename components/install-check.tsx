import { CircleCheck, CircleAlert, CircleX, Clock } from "lucide-react";

import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * What the sandbox saw, printed against the command it ran.
 *
 * It sits under the command rather than in the card's metadata row on purpose:
 * the claim is about that exact line, not about the plugin in general. The
 * same coupling is enforced in `apply-validations.ts`, which drops a verdict
 * once the command it was measured against has changed.
 */
export function InstallCheck({
  status,
  locale = "en",
  className,
}: {
  status: string | null;
  locale?: Locale;
  className?: string;
}) {
  const d = t(locale).installCheck;

  // `rejected` means the runner declined to execute the string at all, which
  // is a fact about our sandbox and not about the plugin. It stays unshown.
  // `not-a-layer` reads as neutral ink rather than copper: the command works,
  // and the only news is which kind of package arrived.
  const shape = {
    passed: { icon: CircleCheck, label: d.passed, tone: "text-ink-faint" },
    "needs-approval": { icon: CircleAlert, label: d.needsApproval, tone: "text-copper" },
    "not-a-layer": { icon: CircleCheck, label: d.notALayer, tone: "text-ink-faint" },
    failed: { icon: CircleX, label: d.failed, tone: "text-copper" },
    timeout: { icon: Clock, label: d.timeout, tone: "text-copper" },
  }[status ?? ""];

  if (!shape) return null;
  const Icon = shape.icon;

  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-[0.6875rem] leading-relaxed",
        shape.tone,
        className,
      )}
    >
      <Icon className="mt-[0.15rem] h-3 w-3 shrink-0" aria-hidden />
      <span>{shape.label}</span>
    </p>
  );
}
