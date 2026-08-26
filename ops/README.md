# Where the automation actually runs

Four places, and confusing them is how the catalogue gets damaged. Read this
before running anything in `scripts/`.

| What | Where | Who starts it |
| --- | --- | --- |
| The nightly chain | GitHub Actions, `.github/workflows/sync.yml` | Schedule, 03:00 Asia/Shanghai |
| Deploy | GitHub Actions, `.github/workflows/deploy.yml` | Every push to `main` |
| The install sandbox | Oracle ARM VPS, ssh alias `oracle` | Called by the two above |
| One-time backlog drains | The same VPS, `ops/drain-backlog.sh` | A person, deliberately |

**The nightly is the system.** No human: discover → README for anything new →
refresh metadata → verify every npm claim → re-apply the admission bar →
snapshot daily stats → export unchecked → install in a sandbox → record
verdicts (current state, plus an append into `install_runs`) → retract the
failures that are ours → write reviews → deploy. The snapshot lives in the
`sync` job on purpose: `apply` is skipped on nights with nothing to validate,
and a trend series with holes reads as movement that never happened.

`ops/drain-backlog.sh` is not part of it. It exists for a catch-up the
nightly's caps would take a fortnight to clear, and it writes to the live
catalogue with no dry run.

## The credential boundary

`sync.yml` is three jobs split on one line that must not be crossed: **the job
that runs other people's install scripts holds no secrets at all.** A
`postinstall` that can reach `TURSO_AUTH_TOKEN` owns the catalogue, so there
is nothing in that job to reach.

- `sync` — has Turso and a GitHub token. Decides what needs running, hands the
  answer over as an artifact.
- `validate` — **no `env:` block whatsoever.** Runs the containers.
- `apply` — has Turso and the review key. Reads results back, never runs a plugin.

If you add a step, put it in the job that already holds the credentials it
needs. Never add `env:` to `validate`.

## The two hosts

**GitHub Actions** holds `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
`REVIEW_API_BASE`, `REVIEW_API_KEY`, `CLOUDFLARE_API_TOKEN`. The GitHub API
calls use the default `GITHUB_TOKEN`, which is capped at **1,000 requests an
hour** — an order of magnitude below a personal token, and the reason the first
scheduled run never finished.

**The VPS (`oracle`)** runs the user's real production services alongside ours.
Keep container limits modest and never take the box down.

```
~/dsh-validator/        a checkout of DshMarketPlace/dsh-plugin-validator
~/dshm/dshmarketplace/  a checkout of this repo, with .env (chmod 600)
```

`~/dsh-validator` **must stay a git checkout.** It spent a day as a loose copy
of the files, which meant a probe fix in the repo did not exist on the machine
running it, and two rounds of verdicts were produced by a version of the code
that no longer existed. Update it with `git pull`, then
`docker build -t dsh-validator:latest .` — the runner uses the image, not the
working tree, so pulling without rebuilding changes nothing.

**Never swap the probe while a batch is running.** Doing that once produced 18
verdicts nobody could account for, since the first half of the file was judged
by different code from the second. Stop the run, rebuild, start again.

## A rate limit ends a step, never a night

`scripts/lib/github.ts` is the only GitHub client. Past a two-minute wait it
surrenders, marks the run exhausted, and lets the remaining steps proceed.

This matters because discovery is step one of nine. The first scheduled run
slept 109 of its 120 minutes inside it and was cancelled having done nothing:
the sandbox, the reviews and the deploy were all queued behind a sleep.

**When `exhausted()` is true, an absence is not an answer.** A spent quota
returns the same `null` a missing repository does, and the callers read that as
"no marker", "no commits", "the repo is gone" — the last of which sets
`isArchived`. Ask `exhausted()` before believing any absence.
