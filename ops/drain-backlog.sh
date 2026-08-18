#!/usr/bin/env bash
#
# Drains a backlog of unvalidated listings, unattended, on a long-lived host.
#
#   ssh oracle 'cd ~/dshm/dshmarketplace && nohup ops/drain-backlog.sh > ~/dshm/drain.log 2>&1 &'
#
# ## When this is the wrong tool
#
# Almost always. The routine work is `.github/workflows/sync.yml`, which runs
# nightly and needs nobody. This exists only for a one-time catch-up — after a
# bulk retraction, or after a probe fix invalidates a batch of verdicts — where
# the nightly's caps would take a fortnight to clear what one evening can.
#
# It writes to the live catalogue. There is no dry run.
#
# ## Why the stages are ordered rather than parallel
#
# A review needs a verdict, a verdict needs a command that runs, and both need
# a README. The install loop repeats because a round can leave candidates
# behind: a throttled run is discarded rather than published, which puts the
# listing straight back in the queue.
#
# ## Two things learned the hard way
#
# Ship this as a file. An earlier version was written to the host through a
# heredoc and waited on `pgrep -f "scripts/write-review.ts"` — which matched
# the shell that had authored it, because that shell's own argv still held
# every line of the script. It waited on the process that created it.
#
# And classify before reviewing. `failed` is the probe's catch-all, and three
# separate times the majority of it was our own fault rather than the plugin's.
# A review that cites a verdict outlives the verdict, so the retraction has to
# happen first.
set -u

SITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="${VALIDATOR_DIR:-$HOME/dsh-validator}"
ROUNDS="${ROUNDS:-8}"
BATCH="${BATCH:-400}"

cd "$SITE"
log() { echo "[$(date -u +%H:%M:%S)] $*"; }

if [ ! -d "$VALIDATOR" ]; then
  echo "no validator at $VALIDATOR — clone DshMarketPlace/dsh-plugin-validator there" >&2
  exit 1
fi

log "stage 1 — READMEs for listings that have never had one"
pnpm tsx scripts/sync-github.ts --missing-readme 2000 2>&1 | tail -6

log "stage 2 — install everything still unchecked, until nothing is left"
for round in $(seq 1 "$ROUNDS"); do
  pnpm tsx scripts/export-validation-specs.ts --limit "$BATCH" > "/tmp/specs-$round.jsonl" 2>/dev/null
  n=$(wc -l < "/tmp/specs-$round.jsonl")
  log "  round $round: $n to install"
  [ "$n" -eq 0 ] && break

  # Concurrency stays at 3. Going faster got a whole batch throttled once, and
  # every plugin in it came back looking broken — a measurement of our own
  # traffic, published under other people's names.
  ( cd "$VALIDATOR" && node run.mjs "/tmp/specs-$round.jsonl" "/tmp/results-$round.jsonl" 3 ) 2>&1 | tail -3
  pnpm tsx scripts/apply-validations.ts "/tmp/results-$round.jsonl" 2>&1 | tail -3
done

log "stage 3 — retract the failures that are ours, before a reader sees them"
pnpm tsx scripts/classify-failures.ts --write-ours=/tmp/ours.txt /tmp/results-*.jsonl 2>&1 | tail -20
if [ -s /tmp/ours.txt ]; then
  pnpm tsx scripts/retract-verdicts.ts /tmp/ours.txt 2>&1 | tail -2
fi

log "stage 4 — reviews, including every one whose verdict moved"
pnpm tsx scripts/write-review.ts --limit 5000 --concurrency 190 --rpm 100 2>&1 | tail -12

log "done"
