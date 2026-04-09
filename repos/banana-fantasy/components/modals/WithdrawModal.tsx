'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { PersonaVerificationModal } from './PersonaVerificationModal';
import type { PrizeWithdrawal } from '@/types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  draftId?: string;
  userId?: string;
  walletAddress?: string;
  onWithdraw: (draftId: string, amount: number, method: PrizeWithdrawal['method']) => Promise<unknown>;
}

type Step = 'form' | 'processing' | 'success' | 'error';

const TEMPLATE_BASIC = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID_BASIC || '';
const TEMPLATE_KYC = process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID_KYC || '';

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function WithdrawModal({ isOpen, onClose, amount, draftId, userId, walletAddress, onWithdraw }: WithdrawModalProps) {
  const [destinationAddress, setDestinationAddress] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState<'basic' | 'kyc' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDestinationAddress(walletAddress || '');
      setStep('form');
      setErrorMessage(null);
      setIsSubmitting(false);
      setShowVerification(null);
    }
  }, [isOpen, walletAddress]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleVerificationComplete = useCallback(async (_inquiryId: string, status: string) => {
    setShowVerification(null);
    if (status === 'completed') {
      handleConfirm();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async () => {
    if (!draftId) {
      setErrorMessage('This prize is not yet eligible for withdrawal.');
      setStep('error');
      return;
    }

    if (!isValidAddress(destinationAddress)) {
      setErrorMessage('Please enter a valid wallet address (0x...)');
      return;
    }

    setIsSubmitting(true);
    setStep('processing');
    setErrorMessage(null);

    try {
      await onWithdraw(draftId, amount, 'usdc');
      setStep('success');
    } catch (err) {
      if (err && typeof err === 'object' && 'requiresVerification' in err) {
        const verErr = err as { requiresVerification: 'basic' | 'kyc' };
        setShowVerification(verErr.requiresVerification);
        setStep('form');
        setIsSubmitting(false);
        return;
      }
      const message = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.';
      setErrorMessage(message);
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'processing') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw" size="md">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <svg className="animate-spin h-10 w-10 text-banana" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-text-secondary text-lg">Sending USDC...</p>
        </div>
      </Modal>
    );
  }

  if (step === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw" size="md">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary">Withdrawal Sent!</h3>
          <p className="text-text-secondary text-center text-sm">
            {formatCurrency(amount)} USDC has been sent to your wallet on Base.
          </p>
          <div className="w-full p-3 rounded-lg bg-bg-tertiary/60 border border-bg-tertiary">
            <p className="text-text-muted text-xs mb-1">Sent to</p>
            <p className="text-text-primary text-sm font-mono break-all">{destinationAddress}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-lg bg-banana text-black hover:brightness-110 transition-all mt-2"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  if (step === 'error') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw" size="md">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-error/10 border border-error/30">
            <p className="text-error font-semibold">Withdrawal failed</p>
            <p className="text-text-secondary text-sm mt-2">{errorMessage || 'Please try again in a moment.'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('form'); setErrorMessage(null); }}
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

  const canWithdraw = amount > 0 && !!draftId && isValidAddress(destinationAddress);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw" size="md">
      <div className="space-y-5">
        {/* Amount */}
        <div className="text-center">
          <p className="text-text-muted text-sm mb-1">Withdrawal Amount</p>
          <p className="text-4xl font-bold text-banana">{formatCurrency(amount)}</p>
          <p className="text-text-muted text-xs mt-1">USDC on Base</p>
        </div>

        {/* Wallet Address Input */}
        <div>
          <label className="text-sm font-semibold text-text-primary mb-2 block">Send to wallet address</label>
          <input
            type="text"
            value={destinationAddress}
            onChange={e => { setDestinationAddress(e.target.value); setErrorMessage(null); }}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-bg-elevated text-text-primary text-sm font-mono placeholder-text-muted focus:outline-none focus:border-banana/50 transition-colors"
          />
          {destinationAddress && !isValidAddress(destinationAddress) && (
            <p className="text-error text-xs mt-1.5">Enter a valid wallet address (0x followed by 40 hex characters)</p>
          )}
          {errorMessage && step === 'form' && (
            <p className="text-error text-xs mt-1.5">{errorMessage}</p>
          )}
        </div>

        {/* Info */}
        <div className="p-3 rounded-xl bg-bg-tertiary/60 border border-bg-tertiary space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Network</span>
            <span className="text-text-primary font-medium">Base</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Token</span>
            <span className="text-text-primary font-medium">USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Speed</span>
            <span className="text-text-primary font-medium">Instant</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Fee</span>
            <span className="text-success font-medium">Free</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!canWithdraw || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canWithdraw && !isSubmitting
              ? 'bg-banana text-black hover:brightness-110 hover:scale-[1.01]'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Withdraw USDC'}
        </button>
      </div>

      {/* Persona Verification Modal */}
      {showVerification && userId && (
        <PersonaVerificationModal
          isOpen={true}
          onClose={() => setShowVerification(null)}
          templateId={showVerification === 'basic' ? TEMPLATE_BASIC : TEMPLATE_KYC}
          userId={userId}
          onComplete={handleVerificationComplete}
        />
      )}
    </Modal>
  );
}
