"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Check, AlertTriangle, Loader2 } from "lucide-react";

import { t } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";
import type { RepoPreview } from "@/lib/github-inspect";

type State =
  | { step: "idle" }
  | { step: "checking" }
  | { step: "checked"; repo: RepoPreview }
  | { step: "sending"; repo: RepoPreview }
  | { step: "sent"; repo: RepoPreview; duplicate: boolean };

/**
 * Two steps on purpose. Inspecting first means an author sees the archived
 * repository, the missing licence or the listing that already exists before
 * they submit — rather than after a week of silence.
 */
export function SubmitForm({ locale }: { locale: Locale }) {
  const d = t(locale).submitForm;
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ step: "idle" });

  const busy = state.step === "checking" || state.step === "sending";

  async function post(action: "inspect" | "submit") {
    setError(null);
    setState(action === "inspect" ? { step: "checking" } : (s) => s);

    try {
      const res = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, url, note, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? d.genericError);
        setState({ step: "idle" });
        return;
      }

      setState(
        action === "inspect"
          ? { step: "checked", repo: data.repo }
          : { step: "sent", repo: data.repo, duplicate: Boolean(data.duplicate) },
      );
    } catch {
      setError(d.networkError);
      setState({ step: "idle" });
    }
  }

  if (state.step === "sent") {
    return (
      <div className="not-prose space-y-3 border-l-2 border-copper bg-paper-sunken p-5">
        <p className="flex items-center gap-2 font-medium">
          <Check className="h-4 w-4 text-copper" aria-hidden />
          {state.duplicate ? d.alreadyQueued : d.received}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {d.receivedBody(state.repo.fullName)}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {d.fasterRoute}
        </p>
      </div>
    );
  }

  return (
    <div className="not-prose space-y-4">
      <div className="space-y-2">
        <label htmlFor="repo-url" className="block text-sm font-medium">
          {d.urlLabel}
        </label>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {d.urlHelp}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="repo-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/dsh-plugin"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 border border-border bg-paper-sunken px-3 font-mono text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-copper"
          />
          <button
            type="button"
            onClick={() => post("inspect")}
            disabled={busy || url.trim().length === 0}
            className="flex h-11 shrink-0 items-center justify-center gap-2 border border-ink bg-ink px-5 text-sm text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {state.step === "checking" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            {d.inspect}
          </button>
        </div>
      </div>

      {error ? (
        <p className="flex items-start gap-2 border-l-2 border-copper bg-paper-sunken p-3 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-copper" aria-hidden />
          {error}
        </p>
      ) : null}

      {state.step === "checked" || state.step === "sending" ? (
        <>
          <RepoPanel repo={state.repo} locale={locale} />

          <div className="space-y-2">
            <label htmlFor="note" className="block text-sm font-medium">
              {d.noteLabel}
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder={d.notePlaceholder}
              className="w-full border border-border bg-paper-sunken p-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-copper"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              {d.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full border border-border bg-paper-sunken px-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-copper"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {d.emailHelp}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setState({ step: "sending", repo: state.repo });
              post("submit");
            }}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 border border-copper bg-copper px-5 text-sm text-paper transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
          >
            {state.step === "sending" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            {d.submit}
          </button>
        </>
      ) : null}
    </div>
  );
}

function RepoPanel({ repo, locale }: { repo: RepoPreview; locale: Locale }) {
  const d = t(locale).submitForm;

  return (
    <div className="space-y-3 border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-sm font-medium">{repo.fullName}</p>
        <span className="tabular flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3" aria-hidden />
          {repo.stars.toLocaleString()}
        </span>
      </div>

      {repo.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {repo.description}
        </p>
      ) : (
        <p className="text-sm italic text-ink-faint">{d.noDescription}</p>
      )}

      <ul className="space-y-1.5 text-xs leading-relaxed">
        <Row ok={repo.hasDshTopic} yes={d.topicYes} no={d.topicNo} />
        <Row
          ok={Boolean(repo.license)}
          yes={d.licenceYes(repo.license ?? "")}
          no={d.licenceNo}
        />
        <Row
          ok={Boolean(repo.description)}
          yes={d.descriptionYes}
          no={d.descriptionNo}
        />
      </ul>

      {repo.alreadyListed ? (
        <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {d.alreadyListed}{" "}
          {repo.listedSlug ? (
            <Link
              href={localePath(locale, `/plugins/${repo.listedSlug}`)}
              className="text-copper underline"
            >
              {d.viewListing}
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function Row({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-copper" aria-hidden />
      ) : (
        <AlertTriangle
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint"
          aria-hidden
        />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{ok ? yes : no}</span>
    </li>
  );
}
