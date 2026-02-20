#!/usr/bin/env node

/**
 * Verifies that a push-to-main deploy was actually picked up by Vercel.
 * If auto-deploy is missing or fails, triggers fallback deploy hook ONCE.
 * Emits a #dev-ready alert payload with reason + action.
 */

import process from 'node:process';

const DEFAULT_PROJECT_ID = 'prj_9jUv1YcDvcOoHXsWjKzLCKjrFLX8';
const DEFAULT_FALLBACK_HOOK =
  'https://api.vercel.com/v1/integrations/deploy/prj_9jUv1YcDvcOoHXsWjKzLCKjrFLX8/ei6DpZis1m';

function parseArgs(argv) {
  const out = {
    sha: process.env.DEPLOY_SHA || '',
    branch: process.env.DEPLOY_BRANCH || 'main',
    timeoutSec: Number(process.env.DEPLOY_VERIFY_TIMEOUT_SEC || 240),
    pollSec: Number(process.env.DEPLOY_VERIFY_POLL_SEC || 8),
    fallbackOnlyOnMissing: false,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--sha') out.sha = argv[++i] || out.sha;
    else if (a === '--branch') out.branch = argv[++i] || out.branch;
    else if (a === '--timeout-sec') out.timeoutSec = Number(argv[++i] || out.timeoutSec);
    else if (a === '--poll-sec') out.pollSec = Number(argv[++i] || out.pollSec);
    else if (a === '--fallback-only-on-missing') out.fallbackOnlyOnMissing = true;
    else if (a === '--dry-run') out.dryRun = true;
  }

  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shortSha(sha) {
  return sha ? sha.slice(0, 8) : 'unknown';
}

function buildAlertPayload({ status, reason, action, sha, branch, deploymentUrl, deploymentState }) {
  const lines = [
    '🚨 **STAGING DEPLOY GUARDRAIL ALERT**',
    `- status: ${status}`,
    `- branch: ${branch}`,
    `- commit: ${shortSha(sha)}`,
    `- reason: ${reason}`,
    `- action: ${action}`,
    `- deployment_state: ${deploymentState || 'n/a'}`,
    `- deployment_url: ${deploymentUrl || 'n/a'}`,
    `- utc: ${new Date().toISOString()}`,
  ];
  return lines.join('\n');
}

async function vercelApi(pathname, token) {
  const res = await fetch(`https://api.vercel.com${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel API ${pathname} failed (${res.status}): ${body}`);
  }
  return res.json();
}

function pickDeploymentForCommit(deployments, sha, branch) {
  if (!Array.isArray(deployments)) return null;
  const exact = deployments.find((d) => d?.meta?.githubCommitSha === sha);
  if (exact) return exact;

  // fallback heuristic for cases where sha metadata is delayed/missing
  return deployments.find(
    (d) =>
      d?.meta?.githubCommitRef === branch &&
      typeof d?.meta?.githubCommitSha === 'string' &&
      d.meta.githubCommitSha.startsWith(sha.slice(0, 7)),
  );
}

async function triggerFallbackHook(hookUrl, dryRun) {
  if (dryRun) {
    return { ok: true, dryRun: true, response: 'dry-run: hook not invoked' };
  }

  const res = await fetch(hookUrl, { method: 'POST' });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Fallback hook failed (${res.status}): ${body}`);
  }
  return { ok: true, dryRun: false, response: body || 'ok' };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.sha) {
    throw new Error('Missing commit sha. Pass --sha <commit> or set DEPLOY_SHA.');
  }

  const projectId = process.env.VERCEL_PROJECT_ID || DEFAULT_PROJECT_ID;
  const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN || '';
  const fallbackHookUrl = process.env.SBS_STAGING_FALLBACK_DEPLOY_HOOK_URL || DEFAULT_FALLBACK_HOOK;

  const startedDeadline = Date.now() + args.timeoutSec * 1000;
  let matchedDeployment = null;

  if (!vercelToken && !args.dryRun) {
    throw new Error('VERCEL_TOKEN (or VERCEL_API_TOKEN) is required unless --dry-run is used.');
  }

  console.log(`[guardrail] verify start sha=${args.sha} branch=${args.branch} timeout=${args.timeoutSec}s dryRun=${args.dryRun}`);

  // 1) Verify deployment started for commit
  while (Date.now() < startedDeadline) {
    if (args.dryRun) {
      break;
    }

    const query = `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=20&meta-githubCommitRef=${encodeURIComponent(args.branch)}`;
    const json = await vercelApi(query, vercelToken);
    matchedDeployment = pickDeploymentForCommit(json?.deployments || [], args.sha, args.branch);

    if (matchedDeployment) {
      console.log(`[guardrail] deployment detected id=${matchedDeployment.uid} state=${matchedDeployment.state}`);
      break;
    }

    console.log('[guardrail] waiting for auto-deploy signal...');
    await sleep(args.pollSec * 1000);
  }

  if (args.dryRun) {
    const alert = buildAlertPayload({
      status: 'DEGRADED',
      reason: 'dry-run simulation of missing auto-deploy signal',
      action: 'fallback deploy hook would be triggered exactly once',
      sha: args.sha,
      branch: args.branch,
      deploymentUrl: null,
      deploymentState: null,
    });

    console.log('ALERT_PAYLOAD_START');
    console.log(alert);
    console.log('ALERT_PAYLOAD_END');
    console.log(JSON.stringify({ ok: true, dryRun: true, simulated: true }, null, 2));
    return;
  }

  if (!matchedDeployment) {
    const fallback = await triggerFallbackHook(fallbackHookUrl, false);
    const alert = buildAlertPayload({
      status: 'DEGRADED',
      reason: `no Vercel auto-deploy detected for commit ${shortSha(args.sha)} within ${args.timeoutSec}s`,
      action: `fallback hook triggered once (${fallback.dryRun ? 'dry-run' : 'live'})`,
      sha: args.sha,
      branch: args.branch,
      deploymentUrl: null,
      deploymentState: null,
    });

    console.log('ALERT_PAYLOAD_START');
    console.log(alert);
    console.log('ALERT_PAYLOAD_END');
    console.log(JSON.stringify({ ok: false, fallbackTriggered: true, reason: 'missing_auto_deploy' }, null, 2));
    process.exitCode = 2;
    return;
  }

  // 2) Verify deployment completed READY (not just started)
  const completionDeadline = Date.now() + args.timeoutSec * 1000;
  let latestState = matchedDeployment.state;
  let latestUrl = matchedDeployment.url ? `https://${matchedDeployment.url}` : null;

  while (Date.now() < completionDeadline) {
    const detail = await vercelApi(`/v13/deployments/${matchedDeployment.uid}`, vercelToken);
    latestState = detail?.readyState || detail?.state || latestState;
    latestUrl = detail?.url ? `https://${detail.url}` : latestUrl;

    if (latestState === 'READY') {
      console.log(JSON.stringify({ ok: true, deploymentId: matchedDeployment.uid, state: latestState, url: latestUrl }, null, 2));
      return;
    }

    if (['ERROR', 'CANCELED'].includes(String(latestState).toUpperCase())) {
      break;
    }

    console.log(`[guardrail] deployment in progress state=${latestState}`);
    await sleep(args.pollSec * 1000);
  }

  // completion failure => fallback once (unless missing-only mode)
  let fallbackAction = 'fallback skipped (missing-only mode enabled)';
  let fallbackTriggered = false;
  if (!args.fallbackOnlyOnMissing) {
    await triggerFallbackHook(fallbackHookUrl, false);
    fallbackAction = 'fallback hook triggered once due to failed/incomplete auto-deploy';
    fallbackTriggered = true;
  }

  const alert = buildAlertPayload({
    status: 'DEGRADED',
    reason: `auto-deploy for commit ${shortSha(args.sha)} ended in state=${latestState}`,
    action: fallbackAction,
    sha: args.sha,
    branch: args.branch,
    deploymentUrl: latestUrl,
    deploymentState: latestState,
  });

  console.log('ALERT_PAYLOAD_START');
  console.log(alert);
  console.log('ALERT_PAYLOAD_END');
  console.log(
    JSON.stringify(
      {
        ok: false,
        fallbackTriggered,
        reason: 'deployment_not_ready',
        deploymentId: matchedDeployment.uid,
        deploymentState: latestState,
        deploymentUrl: latestUrl,
      },
      null,
      2,
    ),
  );
  process.exitCode = 3;
}

main().catch((err) => {
  console.error('[guardrail] fatal:', err?.message || err);
  process.exit(1);
});
