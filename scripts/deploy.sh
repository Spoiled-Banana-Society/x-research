#!/bin/bash
# Safe deploy script — mirrors the workspace banana-fantasy tree into
# sbs-frontend-v2 by content checksum, so it picks up EVERY divergence
# (not just the last commit's files).
# Usage: ./scripts/deploy.sh "commit message"

set -e

WORKSPACE="$HOME/sbs-claude-shared-workspace/repos/banana-fantasy"
DEPLOY_REPO="/tmp/sbs-frontend-v2"
MSG="${1:-Deploy from shared workspace}"

# Files/dirs that must NEVER sync workspace → deploy.
# - .git/, node_modules/, build artifacts: not source code
# - .env.local, .env.*.local: developer-local secrets
# - .env.production, .env.vercel-check: deploy-side prod secrets, must not be
#   overwritten or deleted by --delete
# - playwright-report/, test-results/, coverage/: local test artifacts
# - .last-richard-sync: deploy-side sync marker
# Mirrors deploy repo's .gitignore plus deploy-only files.
RSYNC_EXCLUDES=(
  --exclude='.git/'
  --exclude='node_modules/'
  --exclude='.pnp' --exclude='.pnp.js' --exclude='.yarn/'
  --exclude='coverage/'
  --exclude='.next/' --exclude='.next-old/' --exclude='out/' --exclude='build/'
  --exclude='.DS_Store' --exclude='*.pem'
  --exclude='*-debug.log*' --exclude='yarn-error.log*'
  --exclude='.env' --exclude='.env.local' --exclude='.env.*.local'
  --exclude='.env.production' --exclude='.env.vercel-check'
  --exclude='.vercel'
  --exclude='*.tsbuildinfo' --exclude='next-env.d.ts'
  --exclude='artifacts/' --exclude='cache/' --exclude='typechain-types/'
  --exclude='playwright-report/' --exclude='test-results/' --exclude='blob-report/'
  --exclude='package-lock.json' --exclude='yarn.lock'
  --exclude='.last-richard-sync'
)

# 1. Ensure deploy repo exists and is up to date.
if [ ! -d "$DEPLOY_REPO/.git" ] || [ ! -f "$DEPLOY_REPO/.git/HEAD" ]; then
  echo "Cloning sbs-frontend-v2..."
  rm -rf "$DEPLOY_REPO"
  git clone https://github.com/Spoiled-Banana-Society/sbs-frontend-v2.git "$DEPLOY_REPO"
fi

cd "$DEPLOY_REPO"
git pull origin main

# Write sync marker with Boris's latest commit hash (for pre-push hook)
BORIS_HASH=$(cd "$HOME/sbs-claude-shared-workspace" && git fetch origin --quiet 2>/dev/null && git rev-parse origin/boris 2>/dev/null)
if [ -n "$BORIS_HASH" ]; then
  echo "$BORIS_HASH" > "$HOME/sbs-claude-shared-workspace/.last-richard-sync"
fi

# 2. Show what would change (dry run, content-checksum based).
echo "Computing diff (workspace → deploy)..."
DRY_RUN=$(rsync -rcin --delete "${RSYNC_EXCLUDES[@]}" "$WORKSPACE/" "$DEPLOY_REPO/" 2>&1)
CHANGES=$(echo "$DRY_RUN" | awk '/^[<>][fdLs]|^\*deleting/ {print}')

if [ -z "$CHANGES" ]; then
  echo "No banana-fantasy changes detected. Nothing to deploy."
  exit 0
fi

echo "Files that will sync:"
echo "$CHANGES"
echo ""

# 3. Apply for real.
rsync -rc --delete "${RSYNC_EXCLUDES[@]}" "$WORKSPACE/" "$DEPLOY_REPO/" >/dev/null

# 4. Commit, push, and trigger deploy hook (NOT git-push auto-deploy).
cd "$DEPLOY_REPO"
git add -A
if git diff --cached --quiet; then
  echo "No tracked-file differences after sync. Already up to date."
  exit 0
fi

echo ""
git diff --cached --stat
echo ""
git commit -m "$MSG"
git push origin main

# Trigger deploy via hook — the git push auto-deploy gets blocked by Vercel
# deployment protection, so the hook is what actually deploys.
echo ""
echo "Triggering Vercel deploy hook..."
curl -s -X POST "https://api.vercel.com/v1/integrations/deploy/prj_laojah7E1rx3bwkFOPcOAsumG0DO/MjJcGpoznH" | cat
echo ""
echo "Deploy triggered!"
