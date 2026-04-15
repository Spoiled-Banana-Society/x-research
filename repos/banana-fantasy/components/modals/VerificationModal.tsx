'use client';

import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { usePrivy } from '@privy-io/react-auth';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onComplete: () => void;
}

type Step = 'form' | 'verifying' | 'success' | 'error';

export function VerificationModal({ isOpen, onClose, userId: _userId, onComplete }: VerificationModalProps) {
  const { getAccessToken } = usePrivy();
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-bg-tertiary border border-bg-elevated text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-banana/50';

  const handleSubmit = useCallback(async () => {
    if (!firstName || !lastName || !dateOfBirth || !address || !city || !state || !zip) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setStep('verifying');

    try {
      const token = await getAccessToken();
      const fullAddress = `${address}, ${city}, ${state} ${zip}`;

      const res = await fetch('/api/verify/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ firstName, lastName, dateOfBirth, address: fullAddress }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to start verification');
      }

      const data = await res.json();

      if (data.sessionUrl) {
        // Launch Veriff InContext SDK
        const { createVeriffFrame } = await import('@veriff/incontext-sdk');
        createVeriffFrame({
          url: data.sessionUrl,
          onEvent: (msg: string) => {
            if (msg === 'FINISHED') {
              setStep('success');
              onComplete();
            } else if (msg === 'CANCELED') {
              setStep('form');
              setIsSubmitting(false);
            }
          },
        });
      }
    } catch (err) {
      console.error('[Verification] Error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStep('error');
      setIsSubmitting(false);
    }
  }, [firstName, lastName, dateOfBirth, address, city, state, zip, getAccessToken, onComplete]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Identity Verification" size="md">
      {/* Form Step */}
      {step === 'form' && (
        <div className="space-y-3">
          <p className="text-text-secondary text-sm mb-2">
            Quick verification required for your first withdrawal. This only takes a moment.
          </p>
          {error && <p className="text-error text-sm">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input className={inputClass} placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <input className={inputClass} type="date" placeholder="Date of birth" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          <input className={inputClass} placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <input className={inputClass} placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
            <input className={inputClass} placeholder="State" value={state} onChange={e => setState(e.target.value)} maxLength={2} />
            <input className={inputClass} placeholder="ZIP" value={zip} onChange={e => setZip(e.target.value)} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold bg-banana text-black hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
          <p className="text-text-muted text-xs text-center">Your info is securely verified by Veriff. We don&apos;t store sensitive data.</p>
        </div>
      )}

      {/* Verifying Step */}
      {step === 'verifying' && (
        <div className="flex flex-col items-center py-12 space-y-3">
          <div className="w-10 h-10 border-2 border-banana border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Verifying your information...</p>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary">Verified!</h3>
          <p className="text-text-secondary text-center text-sm">You&apos;re all set. You can now withdraw your winnings.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-banana text-black hover:brightness-110">Continue</button>
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-error/10 border border-error/30">
            <p className="text-error font-semibold">Verification failed</p>
            <p className="text-text-secondary text-sm mt-1">{error || 'Please try again.'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep('form'); setError(''); }} className="flex-1 py-3 rounded-xl font-bold bg-bg-tertiary text-text-primary">Try Again</button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-banana text-black">Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
