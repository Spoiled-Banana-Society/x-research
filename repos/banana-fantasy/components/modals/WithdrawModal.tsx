'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import type { PrizeWithdrawal } from '@/types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  draftId?: string;
  onWithdraw: (draftId: string, amount: number, method: PrizeWithdrawal['method']) => Promise<unknown>;
}

type Step = 'select' | 'processing' | 'success' | 'error';

export function WithdrawModal({ isOpen, onClose, amount, draftId, onWithdraw }: WithdrawModalProps) {
  const [payoutMethod, setPayoutMethod] = useState<PrizeWithdrawal['method']>('bank');
  const [step, setStep] = useState<Step>('select');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPayoutMethod('bank');
      setStep('select');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleConfirm = async () => {
    if (!draftId) {
      setErrorMessage('This prize is not yet eligible for withdrawal.');
      setStep('error');
      return;
    }

    setIsSubmitting(true);
    setStep('processing');
    setErrorMessage(null);

    try {
      await onWithdraw(draftId, amount, payoutMethod);
      setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.';
      setErrorMessage(message);
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'processing') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Winnings" size="md">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <svg className="animate-spin h-10 w-10 text-banana" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-text-secondary text-lg">Processing your withdrawal...</p>
        </div>
      </Modal>
    );
  }

  if (step === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Winnings" size="md">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary">Withdrawal Initiated!</h3>
          <p className="text-text-secondary text-center">
            Your funds will be transferred to your {payoutMethod === 'bank' ? 'bank account' : 'wallet'}.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-lg bg-banana text-black hover:brightness-110 transition-all mt-4"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  if (step === 'error') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Winnings" size="md">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-error/10 border border-error/30">
            <p className="text-error font-semibold">Withdrawal failed</p>
            <p className="text-text-secondary text-sm mt-2">{errorMessage || 'Please try again in a moment.'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('select')}
              className="w-full py-3 rounded-xl font-bold text-lg bg-bg-tertiary text-text-primary hover:bg-bg-elevated transition-all"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-lg bg-banana text-black hover:brightness-110 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const canWithdraw = amount > 0 && !!draftId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Winnings" size="md">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-banana">{formatCurrency(amount)}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Payout Method</h3>
          <div className="space-y-3">
            <button
              onClick={() => setPayoutMethod('bank')}
              className={`
                w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all
                ${payoutMethod === 'bank'
                  ? 'border-banana bg-banana/5'
                  : 'border-bg-elevated bg-bg-tertiary hover:border-bg-elevated/80'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payoutMethod === 'bank' ? 'bg-banana/20' : 'bg-bg-elevated'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${payoutMethod === 'bank' ? 'text-banana' : 'text-text-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className={`font-semibold text-sm ${payoutMethod === 'bank' ? 'text-text-primary' : 'text-text-secondary'}`}>Cash out to Bank</p>
                <p className="text-text-muted text-xs">ACH transfer · 1-3 business days</p>
              </div>
            </button>

            <button
              onClick={() => setPayoutMethod('usdc')}
              className={`
                w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all
                ${payoutMethod === 'usdc'
                  ? 'border-banana bg-banana/5'
                  : 'border-bg-elevated bg-bg-tertiary hover:border-bg-elevated/80'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payoutMethod === 'usdc' ? 'bg-banana/20' : 'bg-bg-elevated'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${payoutMethod === 'usdc' ? 'text-banana' : 'text-text-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <p className={`font-semibold text-sm ${payoutMethod === 'usdc' ? 'text-text-primary' : 'text-text-secondary'}`}>Withdraw USDC</p>
                <p className="text-text-muted text-xs">Direct to wallet on Base · Instant</p>
              </div>
            </button>
          </div>
        </div>

        {!canWithdraw && (
          <div className="text-center text-text-muted text-sm">
            This prize is not yet eligible for withdrawal.
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canWithdraw || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canWithdraw && !isSubmitting
              ? 'bg-banana text-black hover:brightness-110 hover:scale-[1.01]'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
        </button>

        {payoutMethod === 'bank' && (
          <p className="text-center text-text-muted text-xs">Powered by Coinbase Offramp</p>
        )}
      </div>
    </Modal>
  );
}
