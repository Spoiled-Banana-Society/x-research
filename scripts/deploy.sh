#!/bin/bash
# Safe deploy script — only copies files that actually changed
# Usage: ./scripts/deploy.sh "commit message"

set -e

WORKSPACE="$HOME/sbs-claude-shared-workspace/repos/banana-fantasy"
DEPLOY_REPO="/tmp/sbs-frontend-v2"
MSG="${1:-Deploy from shared workspace}"

# 1. Ensure deploy repo exists and is up to date
if [ ! -d "$DEPLOY_REPO/.git" ]; then
  echo "Cloning sbs-frontend-v2..."
  git clone https://github.com/Spoiled-Banana-Society/sbs-frontend-v2.git "$DEPLOY_REPO"
fi

cd "$DEPLOY_REPO"
git pull origin main

# Touch sync marker for pre-push hook
touch "$HOME/sbs-claude-shared-workspace/.last-richard-sync"

# 2. Find which files changed in the shared workspace (compared to main)
cd "$HOME/sbs-claude-shared-workspace"
CHANGED=$(git diff origin/main~1 origin/main --name-only -- repos/banana-fantasy/ | sed 's|repos/banana-fantasy/||')

if [ -z "$CHANGED" ]; then
  echo "No banana-fantasy files changed. Nothing to deploy."
  exit 0
fi

echo "Changed files:"
echo "$CHANGED"
echo ""

# 3. Copy ONLY changed files
while IFS= read -r file; do
  src="$WORKSPACE/$file"
  dst="$DEPLOY_REPO/$file"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "  Copied: $file"
  else
    # File was deleted
    if [ -f "$dst" ]; then
      rm "$dst"
      echo "  Deleted: $file"
    fi
  fi
done <<< "$CHANGED"

# 4. Commit, push, and trigger deploy hook (NOT git-push auto-deploy)
cd "$DEPLOY_REPO"
git add -A
if git diff --cached --quiet; then
  echo "No differences after copy. Already up to date."
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
