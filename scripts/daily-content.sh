#!/bin/bash
# The daily content batch: write N pages, put them straight into the sitemap,
# and ship their illustrations. The copy and the `indexed` flag go live the
# moment they are written; the illustrations are static assets and only reach
# the Worker with a deploy, so the batch ends with a push to main.
#
#   scripts/daily-content.sh [N]        (default 5)
#
# Runs from launchd on the home Mac (~/Library/LaunchAgents/
# dev.dshmarketplace.content.plist). Text and images are on BeatAPI with
# their own capped token, `.dev.vars` VELOKEY_* / IMAGE_* (IMAGE_API_MODE=task).
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
N=${1:-5}

echo "== $(date '+%F %T') daily content, $N pages"
git pull --ff-only --quiet
# The push at the end ships whatever main holds. Someone's unpushed commits
# in this checkout are not this job's to publish.
if [ "$(git rev-list --count '@{u}..HEAD')" != 0 ]; then
  echo "main has unpushed commits — not writing today"
  exit 1
fi
pnpm tsx scripts/write-content.ts --limit "$N" --images --promote

new=$(git ls-files --others --exclude-standard -- 'public/plugins/*.jpg')
if [ -z "$new" ]; then
  echo "no new illustrations"
  exit 0
fi
git add -- $new
git commit --quiet -m "content: $(echo "$new" | wc -l | tr -d ' ') pages, $(date +%F)" -- $new
git pull --rebase --autostash --quiet
git push --quiet
echo "pushed $(git rev-parse --short HEAD)"
