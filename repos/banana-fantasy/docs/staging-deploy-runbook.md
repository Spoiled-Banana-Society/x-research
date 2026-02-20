# Staging Deploy Runbook (Task #5 Guardrail)

## Canonical path (primary)

**Push to `main` is the primary deploy trigger** for staging validation.

### One-command path
```bash
npm run deploy:staging:main
```

This does:
1. `git push origin HEAD:main`
2. verifies Vercel saw the pushed commit and started deployment
3. verifies deployment reaches `READY`
4. if missing/failing signal, triggers fallback deploy hook exactly once
5. prints a #dev-ready alert payload with reason + action

---

## Verifier-only path

If commit is already pushed:
```bash
npm run deploy:staging:verify -- --sha <commit_sha> --branch main
```

Useful flags:
- `--timeout-sec 240`
- `--poll-sec 8`
- `--fallback-only-on-missing` (skip fallback for non-READY completion failures)
- `--dry-run` (local validation, no external mutation)

---

## Fallback path (canonical)

Canonical fallback hook env var:
- `SBS_STAGING_FALLBACK_DEPLOY_HOOK_URL`

Default canonical URL used by verifier if env var is unset:
- `https://api.vercel.com/v1/integrations/deploy/prj_9jUv1YcDvcOoHXsWjKzLCKjrFLX8/EJwMNKrwIw`

Manual fallback trigger:
```bash
curl -s -X POST "$SBS_STAGING_FALLBACK_DEPLOY_HOOK_URL"
```

> Guardrail behavior: fallback is triggered **once per failed verification run**.

---

## Verification checklist (live build / commit)

1. Get commit SHA that was pushed:
   ```bash
   git rev-parse HEAD
   ```
2. Run verifier:
   ```bash
   npm run deploy:staging:verify -- --sha <sha> --branch main
   ```
3. Confirm output includes:
   - `deploymentId`
   - `state: READY`
   - `url: https://...vercel.app`
4. If verifier emits `ALERT_PAYLOAD_START/END`, post that payload to `#dev`.

---

## Hook ambiguity cleanup notes

Audit found multiple historical hook IDs in workspace notes.

- **Canonical fallback hook**: `.../EJwMNKrwIw`
- **Deprecated/stale**: historical IDs (example: `.../ei6DpZis1m`) must not be used.

Single source-of-truth for automation:
- verifier script: `scripts/staging-deploy-verify.mjs`
- env var override: `SBS_STAGING_FALLBACK_DEPLOY_HOOK_URL`
