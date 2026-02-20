'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { usePrizes, useEligibility } from '@/hooks/usePrizes';
import { WithdrawModal } from '@/components/modals/WithdrawModal';
import type { EligibilityCheckStatus, PrizeHistoryItem } from '@/types';

export default function PrizesPage() {
  const { isLoggedIn, setShowLoginModal, user } = useAuth();
  const router = useRouter();
  const prizesQuery = usePrizes({ userId: user?.walletAddress ?? user?.id });
  const eligibilityQuery = useEligibility({ userId: user?.walletAddress ?? user?.id });
  const prizes = prizesQuery.prizes;
  const eligibility = eligibilityQuery.data;
  const hasPrizeError = Boolean(prizesQuery.error);
  const [withdrawModal, setWithdrawModal] = useState<{ isOpen: boolean; prize?: PrizeHistoryItem }>({ isOpen: false });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (item: PrizeHistoryItem) => {
    if (item.type === 'withdrawal') {
      switch (item.status) {
        case 'completed':
          return <Badge type="default" className="bg-success/20 text-success border-success/30">Completed</Badge>;
        case 'processing':
          return <Badge type="default" className="bg-warning/20 text-warning border-warning/30">Processing</Badge>;
        case 'failed':
          return <Badge type="default" className="bg-error/20 text-error border-error/30">Failed</Badge>;
        default:
          return <Badge type="default">Pending</Badge>;
      }
    }

    switch (item.status) {
      case 'paid':
        return <Badge type="default" className="bg-success/20 text-success border-success/30">Paid</Badge>;
      case 'processing':
        return <Badge type="default" className="bg-warning/20 text-warning border-warning/30">Processing</Badge>;
      case 'forfeited':
        return <Badge type="default" className="bg-error/20 text-error border-error/30">Forfeited</Badge>;
      default:
        return <Badge type="default">Pending</Badge>;
    }
  };

  const totals = useMemo(() => {
    return {
      totalWinnings: prizesQuery.totalWinnings,
      pendingWithdrawals: prizesQuery.pendingWithdrawals,
    };
  }, [prizesQuery.totalWinnings, prizesQuery.pendingWithdrawals]);

  const isBlueCheckVerified = useMemo(() => {
    if (typeof user?.isBlueCheckVerified === 'boolean') return user.isBlueCheckVerified;
    return Boolean(eligibility?.isBlueCheckVerified);
  }, [eligibility?.isBlueCheckVerified, user?.isBlueCheckVerified]);

  const normalizedStatus = useCallback((status?: EligibilityCheckStatus) => {
    if (status === 'verified' || status === 'pending' || status === 'unverified') return status;
    return eligibility?.isVerified ? 'verified' : 'unverified';
  }, [eligibility?.isVerified]);

  const isEligible = useMemo(() => {
    if (!eligibility) return false;
    if (eligibility.isVerified) return true;
    const checks = [eligibility.kycStatus, eligibility.ageStatus, eligibility.regionStatus].map(normalizedStatus);
    return checks.every((status) => status === 'verified');
  }, [eligibility, normalizedStatus]);

  const canWithdrawPrizes = isEligible && isBlueCheckVerified;

  const renderEligibilityBadge = (status?: EligibilityCheckStatus) => {
    const normalized = normalizedStatus(status);
    if (normalized === 'verified') {
      return <Badge type="default" className="bg-success/20 text-success border-success/30">Verified</Badge>;
    }
    if (normalized === 'pending') {
      return <Badge type="default" className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
    }
    return <Badge type="default" className="bg-error/20 text-error border-error/30">Unverified</Badge>;
  };

  const verificationUrl = eligibility?.verificationUrl || '/verify';

  if (!isLoggedIn) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">Prizes</h1>
          <p className="text-text-secondary mb-6">
            View your prize history and eligibility status
          </p>
          <button onClick={() => setShowLoginModal(true)} className="btn-primary">
            Log In to View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Prizes</h1>
        <p className="text-text-secondary">View your winnings and eligibility status</p>
      </div>

      <Card className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Eligibility Status</h3>
            <div className="flex items-center gap-2 mb-1">
              {isEligible ? (
                <>
                  <span className="w-3 h-3 bg-success rounded-full" />
                  <span className="text-success font-medium">Verified ({eligibility?.season} Season)</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-warning rounded-full" />
                  <span className="text-warning font-medium">Verification Required</span>
                </>
              )}
            </div>
            <p className="text-text-muted text-sm">
              {isEligible
                ? 'Your eligibility allows SBS to issue prizes automatically when you win a contest.'
                : 'Complete verification to receive prize payouts.'}
            </p>
            {!isBlueCheckVerified && (
              <p className="text-text-muted text-sm mt-1">
                BlueCheck identity verification is required before withdrawals.
              </p>
            )}
          </div>

          {!canWithdrawPrizes && (
            <Button size="sm" onClick={() => router.push(verificationUrl)}>
              Verify Now
            </Button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center justify-between rounded-xl bg-bg-tertiary/60 border border-bg-tertiary px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">KYC</p>
              <p className="text-sm text-text-primary font-medium">Identity</p>
            </div>
            {renderEligibilityBadge(eligibility?.kycStatus)}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-bg-tertiary/60 border border-bg-tertiary px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">Age</p>
              <p className="text-sm text-text-primary font-medium">18+ Requirement</p>
            </div>
            {renderEligibilityBadge(eligibility?.ageStatus)}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-bg-tertiary/60 border border-bg-tertiary px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">Region</p>
              <p className="text-sm text-text-primary font-medium">Location</p>
            </div>
            {renderEligibilityBadge(eligibility?.regionStatus)}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-bg-tertiary/60 border border-bg-tertiary px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">BlueCheck</p>
              <p className="text-sm text-text-primary font-medium">ID + Selfie</p>
            </div>
            {isBlueCheckVerified ? (
              <Badge type="default" className="bg-success/20 text-success border-success/30">Verified</Badge>
            ) : (
              <Badge type="default" className="bg-error/20 text-error border-error/30">Required</Badge>
            )}
          </div>
        </div>

        {eligibility?.w9Completed && (
          <div className="mt-4 pt-4 border-t border-bg-tertiary">
            <div className="flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-text-secondary">W9 Completed</span>
            </div>
          </div>
        )}
      </Card>

      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Prize History</h2>

        {prizesQuery.isLoading && (
          <Card className="text-center py-12">
            <p className="text-text-muted">Loading prize history...</p>
          </Card>
        )}

        {hasPrizeError && (
          <Card className="text-center py-12">
            <p className="text-error font-semibold">Unable to load prize history</p>
            <p className="text-text-muted text-sm mt-2">Please refresh the page to try again.</p>
          </Card>
        )}

        {!prizesQuery.isLoading && !hasPrizeError && (
          <div className="space-y-4">
            {prizes.map((item) => (
              <Card key={`${item.type}-${item.id}`} className="p-0">
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.type === 'withdrawal' ? '💸' : '🏆'}</span>
                    <div>
                      <h4 className="font-medium text-text-primary">
                        {item.type === 'withdrawal'
                          ? `Withdrawal to ${item.method === 'bank' ? 'Bank' : 'USDC'}`
                          : item.contestName}
                      </h4>
                      <p className={`text-2xl font-bold mt-1 ${item.type === 'withdrawal' ? 'text-text-primary' : 'text-banana'}`}>
                        {item.type === 'withdrawal' ? `-${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    {getStatusBadge(item)}
                    {item.type === 'withdrawal' ? (
                      <p className="text-text-muted text-sm">Requested: {item.createdAt?.slice(0, 10)}</p>
                    ) : (
                      item.paidDate && (
                        <p className="text-text-muted text-sm">Paid on: {item.paidDate}</p>
                      )
                    )}
                    {item.type === 'win' && item.status === 'pending' && item.draftId && (
                      canWithdrawPrizes ? (
                        <button
                          onClick={() => setWithdrawModal({ isOpen: true, prize: item })}
                          className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-banana text-black hover:brightness-110 transition-all"
                        >
                          Withdraw
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(verificationUrl)}
                          className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-bg-tertiary text-text-secondary hover:bg-bg-elevated transition-all"
                        >
                          Verify to Withdraw
                        </button>
                      )
                    )}
                  </div>
                </div>

                {item.type === 'win' && item.status === 'forfeited' && item.forfeitReason && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                      <p className="text-error text-sm">
                        <strong>Reason:</strong> {item.forfeitReason}
                      </p>
                    </div>
                  </div>
                )}

                {item.type === 'win' && item.status === 'processing' && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-warning text-sm">
                        Payout scheduled automatically in the next payout run.
                      </p>
                    </div>
                  </div>
                )}

                {item.type === 'withdrawal' && item.status === 'failed' && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                      <p className="text-error text-sm">
                        Withdrawal failed. Please try again or contact support.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {!prizesQuery.isLoading && !prizesQuery.error && prizes.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-text-muted">No prizes yet. Start drafting to win!</p>
          </Card>
        )}
      </section>

      <Card className="mt-8 bg-gradient-to-br from-banana/10 to-bg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary mb-1">Total Winnings (Paid)</p>
            <p className="text-3xl font-bold text-banana">
              {formatCurrency(totals.totalWinnings)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-secondary mb-1">Pending Withdrawals</p>
            <p className="text-xl font-medium text-text-primary">
              {formatCurrency(totals.pendingWithdrawals)}
            </p>
          </div>
        </div>
      </Card>

      <WithdrawModal
        isOpen={withdrawModal.isOpen}
        onClose={() => setWithdrawModal({ isOpen: false })}
        amount={withdrawModal.prize?.amount ?? 0}
        draftId={withdrawModal.prize?.type === 'win' ? withdrawModal.prize.draftId : undefined}
        onWithdraw={prizesQuery.withdraw}
      />
    </div>
  );
}
