#!/usr/bin/env bash
set -euo pipefail

# Canonical staging deploy path:
# 1) push current commit to main
# 2) verify Vercel auto-deploy started+completed for pushed commit
# 3) fallback hook auto-triggered once by verifier when needed

REMOTE="${DEPLOY_REMOTE:-origin}"
BRANCH="${DEPLOY_BRANCH:-main}"
VERIFY_TIMEOUT_SEC="${DEPLOY_VERIFY_TIMEOUT_SEC:-240}"
VERIFY_POLL_SEC="${DEPLOY_VERIFY_POLL_SEC:-8}"

SHA="$(git rev-parse HEAD)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "${CURRENT_BRANCH}" != "${BRANCH}" ]]; then
  echo "[deploy-main] WARNING: current branch is '${CURRENT_BRANCH}', target branch is '${BRANCH}'"
fi

echo "[deploy-main] pushing ${SHA} to ${REMOTE}/${BRANCH}"
git push "${REMOTE}" "HEAD:${BRANCH}"

echo "[deploy-main] verifying deploy for ${SHA}"
node scripts/staging-deploy-verify.mjs \
  --sha "${SHA}" \
  --branch "${BRANCH}" \
  --timeout-sec "${VERIFY_TIMEOUT_SEC}" \
  --poll-sec "${VERIFY_POLL_SEC}"
