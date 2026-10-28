"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { encodeKey, parseNames } from "@/lib/compat-names";
import { PREVIEW_TAGS, type PreviewTag } from "@/lib/compat-summary";
import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

type Run = { dsh: string; verdict: string; detail: string | null; ranAt: string };
type Result = {
  query: string;
  fullName: string | null;
  url: string | null;
  current: { verdict: string | null; dsh: string | null } | null;
  preview: Partial<Record<PreviewTag, Run>>;
};
type Response = {
  tags: Partial<Record<PreviewTag, { dsh: string | null } | null>>;
  results: Result[];
  invalid: string[];
};

const CELL = "px-3 py-2 align-top";

/**
 * The paste-your-plugins half of /upgrade. Parsing happens here and again on
 * the server with the same module, so the request only ever carries names
 * that already passed the whitelist.
 */
export function UpgradeCheck({ locale }: { locale: Locale }) {
  const d = t(locale).upgrade;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [data, setData] = useState<Response | null>(null);

  async function check() {
    const parsed = parseNames(input);
    setError(null);
    setNotes([
      ...(parsed.overflow ? [d.overflow(parsed.overflow)] : []),
      ...(parsed.invalid.length ? [d.skipped(parsed.invalid.join(", "))] : []),
    ]);
    if (!parsed.keys.length) {
      setData(null);
      setError(d.nothingParsed);
      return;
    }
    setBusy(true);
    try {
      const names = encodeURIComponent(parsed.keys.map(encodeKey).join(","));
      const res = await fetch(`/api/v1/compat?names=${names}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setData(body as Response);
    } catch {
      setData(null);
      setError(d.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="not-prose space-y-4">
      <div className="space-y-2">
        <label htmlFor="upgrade-names" className="block text-sm font-medium">
          {d.label}
        </label>
        <p className="text-sm leading-relaxed text-muted-foreground">{d.help}</p>
        <textarea
          id="upgrade-names"
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={d.placeholder}
          spellCheck={false}
          className="w-full border border-border bg-paper-sunken p-3 font-mono text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-copper"
        />
        <button
          type="button"
          onClick={check}
          disabled={busy || input.trim().length === 0}
          className="flex h-11 items-center justify-center gap-2 border border-ink bg-ink px-5 text-sm text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          {d.check}
        </button>
      </div>

      {error ? (
        <p className="flex items-start gap-2 border-l-2 border-copper bg-paper-sunken p-3 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-copper" aria-hidden />
          {error}
        </p>
      ) : null}
      {notes.map((n) => (
        <p key={n} className="text-xs leading-relaxed text-muted-foreground">
          {n}
        </p>
      ))}

      {data ? <Results data={data} locale={locale} /> : null}
    </div>
  );
}

function Results({ data, locale }: { data: Response; locale: Locale }) {
  const d = t(locale).upgrade;
  const tags = PREVIEW_TAGS.filter((tag) => data.tags[tag]?.dsh);
  const listed = data.results.filter((r) => r.fullName);

  return (
    <div className="space-y-3" aria-live="polite">
      {tags.map((tag) => {
        const dsh = data.tags[tag]?.dsh as string;
        const broken = listed.filter((r) => {
          const run = r.preview[tag];
          return run && run.dsh === dsh && run.verdict !== "passed";
        }).length;
        return (
          <p key={tag} className="text-sm font-medium">
            {d.yours(tag, dsh, broken, listed.length)}
          </p>
        );
      })}
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-paper-sunken text-muted-foreground">
            <tr>
              <th className={`${CELL} font-medium`}>{d.plugin}</th>
              <th className={`${CELL} font-medium`}>{d.now}</th>
              {tags.map((tag) => (
                <th key={tag} className={`${CELL} font-medium`}>
                  {tag} · {data.tags[tag]?.dsh}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.results.map((r) => (
              <tr key={r.query}>
                <td className={`${CELL} font-mono`}>
                  {r.url ? (
                    <a href={r.url} className="hover:text-copper">
                      {r.fullName}
                    </a>
                  ) : (
                    r.query
                  )}
                </td>
                {r.fullName ? (
                  <>
                    <td className={CELL}>
                      <Verdict verdict={r.current?.verdict ?? null} locale={locale} />
                      {r.current?.dsh ? (
                        <span className="block font-mono text-muted-foreground">{r.current.dsh}</span>
                      ) : null}
                    </td>
                    {tags.map((tag) => (
                      <td key={tag} className={CELL}>
                        <PreviewCell run={r.preview[tag]} tagDsh={data.tags[tag]?.dsh ?? null} locale={locale} />
                      </td>
                    ))}
                  </>
                ) : (
                  <td colSpan={tags.length + 1} className={`${CELL} text-muted-foreground`}>
                    {d.notListed}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Verdict({ verdict, locale }: { verdict: string | null; locale: Locale }) {
  const labels = t(locale).upgrade.verdicts;
  const label = labels[verdict ?? "untested"] ?? verdict ?? labels.untested;
  return <span className={verdict && verdict !== "passed" ? "font-medium text-copper" : ""}>{label}</span>;
}

function PreviewCell({ run, tagDsh, locale }: { run?: Run; tagDsh: string | null; locale: Locale }) {
  const d = t(locale).upgrade;
  if (!run) return <span className="text-muted-foreground">{d.notRun}</span>;
  return (
    <>
      <Verdict verdict={run.verdict} locale={locale} />
      <span className="block font-mono text-muted-foreground">
        {run.dsh !== tagDsh ? d.ranOn(run.dsh) : run.ranAt.slice(0, 10)}
      </span>
      {run.detail && run.verdict !== "passed" ? (
        <span className="mt-1 block max-w-xs break-words text-muted-foreground">{run.detail}</span>
      ) : null}
    </>
  );
}
