'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { usePrivy } from '@privy-io/react-auth';

interface BankWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  walletAddress: string;
  onSuccess: () => void;
}

type Step = 'checking' | 'tos' | 'kyc' | 'bank' | 'confirm' | 'processing' | 'success' | 'error';

interface BridgeAccount {
  id: string;
  bank_name?: string;
  account_owner_name?: string;
}

export function BankWithdrawModal({ isOpen, onClose, amount, walletAddress, onSuccess }: BankWithdrawModalProps) {
  const { getAccessToken } = usePrivy();
  const [step, setStep] = useState<Step>('checking');
  const [error, setError] = useState('');
  const [savedAccount, setSavedAccount] = useState<BridgeAccount | null>(null);

  // KYC form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [ssn, setSsn] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Bank form state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, [getAccessToken]);

  // Check if user has completed Bridge setup
  useEffect(() => {
    if (!isOpen) return;
    setStep('checking');
    setError('');

    (async () => {
      try {
        const headers = await authHeaders();

        // Check KYC status
        const kycRes = await fetch('/api/bridge/kyc', { headers });
        if (kycRes.ok) {
          const kyc = await kycRes.json();
          if (kyc.status === 'approved') {
            // KYC done — check for bank account
            const accRes = await fetch('/api/bridge/accounts', { headers });
            if (accRes.ok) {
              const accData = await accRes.json();
              const accounts = accData.accounts || accData || [];
              if (Array.isArray(accounts) && accounts.length > 0) {
                setSavedAccount(accounts[0]);
                setStep('confirm');
                return;
              }
            }
            setStep('bank');
            return;
          }
        }
        // KYC not done — start with ToS
        setStep('tos');
      } catch {
        setStep('tos');
      }
    })();
  }, [isOpen, authHeaders]);

  const handleToS = async () => {
    setIsSubmitting(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/bridge/tos', {
        method: 'POST',
        headers,
        body: JSON.stringify({ redirectUri: window.location.href }),
      });
      if (!res.ok) throw new Error('Failed to get ToS URL');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
        // After user accepts ToS, move to KYC
        setStep('kyc');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load terms');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKyc = async () => {
    if (!firstName || !lastName || !email || !dob || !ssn || !street || !city || !state || !zip) {
      setError('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/bridge/kyc', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: {
            type: 'individual',
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phone || undefined,
            birth_date: dob,
            residential_address: {
              street_line_1: street,
              city,
              subdivision: state,
              postal_code: zip,
              country: 'USA',
            },
            signed_agreement_id: 'accepted',
            identifying_information: [{
              type: 'ssn',
              number: ssn,
              issuing_country: 'USA',
            }],
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'KYC submission failed');
      }
      setStep('bank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KYC failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankAccount = async () => {
    if (!bankName || !accountNumber || !routingNumber) {
      setError('Please fill in all bank details');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/bridge/accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountOwnerName: `${firstName} ${lastName}`.trim() || 'Account Owner',
          bankName,
          accountNumber,
          routingNumber,
          accountType,
          firstName: firstName || 'User',
          lastName: lastName || 'Account',
          address: {
            street_line_1: street || '123 Main St',
            city: city || 'New York',
            state: state || 'NY',
            postal_code: zip || '10001',
            country: 'USA',
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to register bank account');
      }
      const account = await res.json();
      setSavedAccount(account);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bank registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfframp = async () => {
    if (!savedAccount?.id) return;
    setIsSubmitting(true);
    setStep('processing');
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/bridge/offramp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          fromAddress: walletAddress,
          externalAccountId: savedAccount.id,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Offramp failed');
      }
      setStep('success');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-bg-tertiary border border-bg-elevated text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-banana/50';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cash Out to Bank" size="md">
      {/* Checking status */}
      {step === 'checking' && (
        <div className="flex flex-col items-center py-12 space-y-3">
          <div className="w-10 h-10 border-2 border-banana border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Checking account status...</p>
        </div>
      )}

      {/* Step 1: Terms of Service */}
      {step === 'tos' && (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            To withdraw to a bank account, you need to accept the terms of service and verify your identity. This is a one-time setup.
          </p>
          <button
            onClick={handleToS}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold bg-banana text-black hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? 'Loading...' : 'Accept Terms & Continue'}
          </button>
        </div>
      )}

      {/* Step 2: KYC */}
      {step === 'kyc' && (
        <div className="space-y-3">
          <p className="text-text-secondary text-sm mb-2">Verify your identity (one-time)</p>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input className={inputClass} placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <input className={inputClass} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className={inputClass} type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
          <input className={inputClass} type="date" placeholder="Date of birth" value={dob} onChange={e => setDob(e.target.value)} />
          <input className={inputClass} placeholder="Social Security Number" value={ssn} onChange={e => setSsn(e.target.value)} />
          <input className={inputClass} placeholder="Street address" value={street} onChange={e => setStreet(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <input className={inputClass} placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
            <input className={inputClass} placeholder="State" value={state} onChange={e => setState(e.target.value)} maxLength={2} />
            <input className={inputClass} placeholder="ZIP" value={zip} onChange={e => setZip(e.target.value)} />
          </div>
          <button
            onClick={handleKyc}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold bg-banana text-black hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Identity'}
          </button>
          <p className="text-text-muted text-xs text-center">Your information is securely processed by Bridge (Stripe).</p>
        </div>
      )}

      {/* Step 3: Bank Account */}
      {step === 'bank' && (
        <div className="space-y-3">
          <p className="text-text-secondary text-sm mb-2">Add your bank account (one-time)</p>
          {error && <p className="text-error text-sm">{error}</p>}
          <input className={inputClass} placeholder="Bank name (e.g. Chase, Wells Fargo)" value={bankName} onChange={e => setBankName(e.target.value)} />
          <input className={inputClass} placeholder="Account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
          <input className={inputClass} placeholder="Routing number" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} />
          <div className="flex gap-3">
            <button
              onClick={() => setAccountType('checking')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${accountType === 'checking' ? 'border-banana bg-banana/10 text-banana' : 'border-bg-elevated text-text-secondary'}`}
            >
              Checking
            </button>
            <button
              onClick={() => setAccountType('savings')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${accountType === 'savings' ? 'border-banana bg-banana/10 text-banana' : 'border-bg-elevated text-text-secondary'}`}
            >
              Savings
            </button>
          </div>
          <button
            onClick={handleBankAccount}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold bg-banana text-black hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Bank Account'}
          </button>
        </div>
      )}

      {/* Step 4: Confirm withdrawal */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-banana">{formatCurrency(amount)}</p>
            <p className="text-text-muted text-sm mt-2">to {savedAccount?.bank_name || 'your bank account'}</p>
          </div>
          <div className="p-3 rounded-xl bg-bg-tertiary/60 border border-bg-tertiary">
            <p className="text-text-muted text-xs">Estimated arrival</p>
            <p className="text-text-primary text-sm font-medium">1-3 business days via ACH</p>
          </div>
          <button
            onClick={handleOfframp}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-lg bg-banana text-black hover:brightness-110 disabled:opacity-50"
          >
            Confirm Withdrawal
          </button>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="flex flex-col items-center py-12 space-y-4">
          <div className="w-10 h-10 border-2 border-banana border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Processing your withdrawal...</p>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary">Withdrawal Initiated!</h3>
          <p className="text-text-secondary text-center">Your funds will arrive in 1-3 business days.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-banana text-black hover:brightness-110">Done</button>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-error/10 border border-error/30">
            <p className="text-error font-semibold">Something went wrong</p>
            <p className="text-text-secondary text-sm mt-1">{error}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('tos')} className="flex-1 py-3 rounded-xl font-bold bg-bg-tertiary text-text-primary">Try Again</button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-banana text-black">Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
