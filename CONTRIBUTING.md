# Working on this repo

Read this before running anything in `scripts/`. Most of it is about the
catalogue, because **the code is replaceable and the data is not**: 2,500
listings carry install commands people copy, and verdicts and reviews published
under other people's names.

`CLAUDE.md` holds the design rules. `ops/README.md` says what runs where.
`STATUS.md` is the live inventory and the full trap list.

## The four rules that exist because they were broken

**1. Never publish a claim that a plugin is broken without an install.**

The sandbox verdicts are `passed`, `needs-approval`, `not-a-layer`, `failed`,
`timeout` — and **only the last two are defects**. `needs-approval` is one
`allowBuilds` entry away from working; `not-a-layer` is the harness saying the
package installed and simply is not a bundle.

`failed` is the catch-all, so it collects whatever no earlier branch claimed.
Three separate times the majority of it was our own fault: a registry
throttling us, a probe edited mid-run, a package the harness took as a plain
dependency on purpose. **Run `scripts/classify-failures.ts` before any batch of
reviews.** The nightly does; you must too.

The tell is uniformity. Dozens of unrelated repositories do not fail the same
way, so one detail string across many listings is evidence about the classifier.

**2. Retracting a verdict retracts the review built on it.**

A review that says "the sandbox saw it fail" outlives the measurement unless
something deletes it. Clearing only `installStatus` is *worse* than leaving it:
`write-review.ts` rewrites when `reviewedAt < installCheckedAt`, so a null
timestamp means the false sentence is never revisited. Use
`scripts/retract-verdicts.ts`, which clears both.

**3. A gate that refuses to write a bad value does not remove one already written.**

Adding the guard is half the fix. Sweeping what it would have caught is the
other half. 31 rows kept a `failed` from before a gate existed while every
later run of the same plugin was correctly discarded.

**4. When a request fails, an absence is not an answer.**

A spent API quota returns the same `null` a deleted repository does. Callers
read that as "no marker", "no commits", "the repo is gone" — and the last sets
`isArchived`. Ask `exhausted()` from `scripts/lib/github.ts` before believing
any absence. `commitCount` returns `number | null` for this reason; do not
round `null` down to `0`.

## Scripts, by how much damage they can do

**Safe — read-only or additive.**
`verify-catalog.ts`, `classify-failures.ts` (without `--write-ours`),
`export-validation-specs.ts`, `build-brand.ts`.

**Writes the catalogue. Run `--dry` or `--dry-run` first, always.**
`sync-github.ts`, `ingest-topic.ts`, `repair-npm-claims.ts`,
`apply-validations.ts`, `write-review.ts`, `repair-reviews.ts`,
`repair-content.ts`, `link-linuxdo.ts`.

**Destructive. Read the file before you run it.**

- `prune-topic.ts` — **deletes rows.** It only touches `provenance = 'topic'`
  listings with no page and no written copy, and that predicate is the only
  thing standing between it and content that cannot be regenerated. Do not
  widen it.
- `retract-verdicts.ts` — clears verdicts *and* reviews by name.
- `promote.ts` — puts pages into the sitemap. See below.

## Things that look like improvements and are not

- **Do not automate `promote.ts`.** It is the quality gate. `scoreContent`
  caps a page with no writing of its own at 20 against a threshold of 70;
  automating promotion pushes empty pages into the sitemap, which costs the
  whole domain, not the page.
- **Do not automate `write-content.ts`.** The per-plugin writing is the only
  thing sixteen competitors cannot scrape. It is the product.
- **Do not add a dependency without checking the bundle.** The Worker size
  ceiling is the binding constraint here; getting under it cost twenty
  dependencies, twelve components and the auth middleware.
- **Do not `db.select()` in a list view.** It returns all 62 columns, and the
  stored README is ~30 KB a row — one page of cards used to drag 750 KB out of
  Turso to render summaries. Use `listColumns` in `lib/data.ts`.
- **Do not re-investigate the npm 403.** `npm publish` is refused for
  `dshmarketplace-plugin` from every environment and credential while a raw
  `PUT` of the same tarball succeeds. It is settled; the workaround is in that
  repo's `scripts/publish.mjs`.
- **Do not machine-translate into `lib/dict.ts`.** The Chinese is written, not
  translated. If you cannot write it, say so and leave the slot.
- **Do not restate a rule that already has a home — import it.** A script grew
  its own copy of the install-command rule instead of calling
  `lib/install.ts`, and the copy silently rotted into both shapes we already
  know are broken. Nothing failed and nothing warned; it was found by reading.
  If you are about to write the same logic twice, the second one is a bug with
  a delay on it.
- **Do not quote a number from these docs without checking it.** The catalogue
  grew from 1,004 to 2,851 in two days. Counts here are true on their date and
  stale soon after — `STATUS.md` carries one at the top.

## Before you push

```bash
pnpm build          # must pass — it type-checks as well as compiles
```

**Fetch first.** More than one person pushes to `main`, and a deploy runs on
every push. Rebase onto `origin/main`, then re-run `pnpm build` — you are
shipping your change combined with theirs, which is not what either of you
tested alone.

**Beware `cmd | tail` when you are checking whether something passed.** The
pipeline reports `tail`'s status, not the command's. This has produced a
confident "PASS" for a failing lint and hidden a rejected `git push` in the
same session.

**If you touched `lib/install.ts` or the API shape, re-run every client against
live data.** This project's recurring bug is producer/consumer drift and
fixtures have never caught it: 1,002 install commands shipped without
`--profile`, and later the in-DSH plugin's own guard rejected every command the
API actually sent. Five surfaces read one API — the site, `dshmarketplace-cli`
(npm), `dshmarketplace` (PyPI), `dshmarketplace-plugin` (npm) and the
`dsh-plugin-radar` userscript. The Python package's `pytest -m live` exists
exactly for this.

Push to `main` deploys automatically. Never commit `.dev.vars` or `.env`.

## The failure family worth recognising

Most defects here have not been logic errors. They were a **correct rule applied
to the wrong scope**, and not one raised an error, failed a build or logged a
warning:

- a guard that ran only on the 400 rows a nightly refresh touched, so the 412
  bad claims it existed to prevent accumulated anyway
- a review gate requiring a sandbox verdict, which permanently excluded the
  monorepo subpaths at the top of the catalogue, since they can never have one
- new listings stamped "synced" without a README, refreshed oldest-first, so
  the freshest content was the emptiest
- a diagnostic printing at the same indentation callers strip with `grep -v`

They hide because nothing breaks. Some subset never gets its turn, and coverage
looks fine because the excluded rows are excluded from the denominator too.

**Of any new filter, gate, sort order or batch limit, ask: which rows does this
exclude, and can they ever come back?** If the answer is never, that is the bug
— not the logic. And check the *scope* separately from the *rule*: a correct
check that runs on 17% of the data is not a check.
