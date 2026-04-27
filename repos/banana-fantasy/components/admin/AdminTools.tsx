'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthHeaders } from '@/hooks/admin/useAdminApi';

interface WalletStatus {
  address: string;
  healthy: boolean;
  balanceWei: string | null;
  bytecode: string;
  isDelegated: boolean;
  delegate: string | null;
}

interface RevokeResponse {
  success: boolean;
  alreadyRevoked?: boolean;
  address?: string;
  previousDelegate?: string;
  txHash?: string;
  codeBefore?: string;
  codeAfter?: string;
  cleared?: boolean;
  note?: string;
  error?: string;
  requestId?: string;
}

const BASE_RPC = 'https://mainnet.base.org';

async function fetchWalletStatus(): Promise<WalletStatus | null> {
  // Public endpoint — no auth needed.
  const walletInfoRes = await fetch('/api/purchases/admin-wallet');
  if (!walletInfoRes.ok) return null;
  const walletInfo = (await walletInfoRes.json()) as {
    address?: string;
    healthy?: boolean;
    balanceWei?: string | null;
  };
  if (!walletInfo.address) return null;

  // Read bytecode directly from public Base RPC. No admin auth needed for an
  // eth_getCode read — chain data is public anyway.
  const codeRes = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getCode',
      params: [walletInfo.address, 'latest'],
    }),
  });
  const codeBody = (await codeRes.json()) as { result?: string };
  const bytecode = (codeBody.result ?? '0x').toLowerCase();
  const isDelegated = bytecode.startsWith('0xef0100');
  const delegate = isDelegated ? `0x${bytecode.slice(8, 48)}` : null;

  return {
    address: walletInfo.address,
    healthy: walletInfo.healthy ?? true,
    balanceWei: walletInfo.balanceWei ?? null,
    bytecode,
    isDelegated,
    delegate,
  };
}

function formatEth(wei: string | null): string {
  if (!wei) return '—';
  const big = BigInt(wei);
  const eth = Number(big) / 1e18;
  return `${eth.toFixed(6)} ETH`;
}

export function AdminTools({ enabled }: { enabled: boolean }) {
  const getHeaders = useAdminAuthHeaders();
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeResult, setRevokeResult] = useState<RevokeResponse | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const next = await fetchWalletStatus();
      if (!next) {
        setStatusError('Failed to load wallet status');
        return;
      }
      setStatus(next);
    } catch (err) {
      setStatusError((err as Error).message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const handleRevoke = useCallback(async () => {
    if (revoking) return;
    setRevoking(true);
    setRevokeError(null);
    setRevokeResult(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/admin/revoke-7702', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
      const body = (await res.json()) as RevokeResponse;
      if (!res.ok || !body.success) {
        setRevokeError(body.error || `Request failed (${res.status})`);
      } else {
        setRevokeResult(body);
      }
      // Always refresh status afterwards so the badge reflects reality.
      await refresh();
    } catch (err) {
      setRevokeError((err as Error).message);
    } finally {
      setRevoking(false);
    }
  }, [getHeaders, refresh, revoking]);

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Admin Tools</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          One-off operational utilities. Use sparingly and remove the endpoints after they have served their purpose.
        </p>
      </div>

      {/* Wallet status card */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Admin Wallet Status</h4>
          <button
            onClick={() => void refresh()}
            disabled={statusLoading}
            className="text-[11px] text-gray-400 hover:text-white underline underline-offset-2 disabled:opacity-50"
          >
            {statusLoading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {statusError && (
          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
            {statusError}
          </div>
        )}

        {status && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-gray-400">Address</dt>
            <dd className="text-white font-mono break-all">{status.address}</dd>

            <dt className="text-gray-400">ETH balance</dt>
            <dd className={status.healthy ? 'text-emerald-300' : 'text-red-300'}>
              {formatEth(status.balanceWei)} {status.healthy ? '✓' : '⚠ low'}
            </dd>

            <dt className="text-gray-400">Bytecode</dt>
            <dd>
              {status.isDelegated ? (
                <div>
                  <span className="text-amber-300 font-semibold">⚠ EIP-7702 delegated</span>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-mono break-all">
                    delegate: {status.delegate}
                  </div>
                </div>
              ) : (
                <span className="text-emerald-300">✓ plain EOA</span>
              )}
            </dd>
          </dl>
        )}
      </div>

      {/* Revoke EIP-7702 tool */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Revoke EIP-7702 Delegation</h4>
        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
          Removes the smart-account upgrade from the admin wallet, restoring it to a plain EOA. Required when viem
          rejects mint transactions with &ldquo;insufficient funds for gas * price + value&rdquo; because the
          delegation makes viem ignore our pinned gas params. Reversible at any time. Costs ~$0.05 in Base gas,
          paid by the admin wallet&apos;s own ETH.
        </p>

        <button
          onClick={() => void handleRevoke()}
          disabled={revoking || !status?.isDelegated}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {revoking
            ? 'Revoking…'
            : !status
              ? 'Loading status…'
              : !status.isDelegated
                ? 'Already plain EOA — nothing to revoke'
                : 'Revoke EIP-7702 delegation'}
        </button>

        {revokeError && (
          <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {revokeError}
          </div>
        )}

        {revokeResult && (
          <div className="mt-3 text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 space-y-1">
            <p className="text-emerald-300 font-semibold">
              {revokeResult.alreadyRevoked
                ? '✓ Already plain EOA — no tx sent'
                : revokeResult.cleared
                  ? '✓ Revoke confirmed — wallet is now plain EOA'
                  : '⚠ Revoke tx sent but bytecode unchanged — investigate'}
            </p>
            {revokeResult.txHash && (
              <p className="text-gray-300 font-mono break-all">
                tx:{' '}
                <a
                  href={`https://basescan.org/tx/${revokeResult.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  {revokeResult.txHash}
                </a>
              </p>
            )}
            {revokeResult.previousDelegate && (
              <p className="text-gray-400">
                previous delegate: <span className="font-mono">{revokeResult.previousDelegate}</span>
              </p>
            )}
            {revokeResult.note && <p className="text-gray-400 italic">{revokeResult.note}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
