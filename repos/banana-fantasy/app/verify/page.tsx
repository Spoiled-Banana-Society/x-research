'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { AppApiError, fetchJson } from '@/lib/appApiClient';

const BLUECHECK_SCRIPT_URL =
  'https://verify.bluecheck.me/platforms/customintegration/js/AgeVerification-V2.js?domain_token=1qCJNPFNI6DxVwoSM7gu';

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'];
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
];

type BlueCheckCallbacks = {
  onReady?: () => void;
  scrapeUserData?: () => void;
  onUserDataChanged?: () => void;
  onClose?: () => void;
  onQuit?: () => void;
  onSuccess?: () => void;
};

type BlueCheckGlobal = {
  platformCallbacks: BlueCheckCallbacks;
  requiredFields: string[];
  userData: Record<string, string>;
  verificationType?: string;
  validateAndDisplayModal: () => boolean;
  initialize: () => void;
};

declare global {
  interface Window {
    BlueCheck?: BlueCheckGlobal;
  }
}

interface EligibilitySubmission {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  country: string;
  region: string;
}

export default function VerifyPage() {
  const { isLoggedIn, setShowLoginModal, user, updateUser } = useAuth();
  const userId = useMemo(() => user?.walletAddress ?? user?.id ?? '', [user]);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('CA');

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlueCheckVerified, setIsBlueCheckVerified] = useState(Boolean(user?.isBlueCheckVerified));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const formDataRef = useRef({ email: '', firstName: '', lastName: '', country: 'United States', region: 'CA' });
  const isLoggedInRef = useRef(isLoggedIn);
  const userIdRef = useRef(userId);
  const isBlueCheckVerifiedRef = useRef(isBlueCheckVerified);
  const isScriptLoadedRef = useRef(isScriptLoaded);
  const isWidgetReadyRef = useRef(isWidgetReady);

  useEffect(() => {
    formDataRef.current = { email, firstName, lastName, country, region };
  }, [email, firstName, lastName, country, region]);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    setIsBlueCheckVerified(Boolean(user?.isBlueCheckVerified));
  }, [user?.isBlueCheckVerified]);

  useEffect(() => {
    isBlueCheckVerifiedRef.current = isBlueCheckVerified;
  }, [isBlueCheckVerified]);

  useEffect(() => {
    isScriptLoadedRef.current = isScriptLoaded;
  }, [isScriptLoaded]);

  useEffect(() => {
    isWidgetReadyRef.current = isWidgetReady;
  }, [isWidgetReady]);

  useEffect(() => {
    if (country === 'United States') {
      if (!US_STATES.includes(region)) {
        setRegion('CA');
      }
      return;
    }

    if (region !== 'N/A') {
      setRegion('N/A');
    }
  }, [country, region]);

  const submitEligibilityBackup = useCallback(async () => {
    const payload: EligibilitySubmission = {
      userId,
      firstName: formDataRef.current.firstName.trim(),
      lastName: formDataRef.current.lastName.trim(),
      fullName: `${formDataRef.current.firstName.trim()} ${formDataRef.current.lastName.trim()}`.trim(),
      email: formDataRef.current.email.trim(),
      dateOfBirth: 'N/A',
      country: formDataRef.current.country,
      region: formDataRef.current.region,
    };

    await fetchJson('/api/eligibility', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }, [userId]);

  const wireBlueCheckCallbacks = useCallback(() => {
    const blueCheck = window.BlueCheck;
    if (!blueCheck) {
      setErrorMessage('BlueCheck did not initialize. Please refresh and try again.');
      return;
    }

    blueCheck.platformCallbacks.onReady = () => {
      setIsWidgetReady(true);

      const verifyBtn = document.getElementById('bluecheck-verify-btn');
      if (!verifyBtn || verifyBtn.getAttribute('data-bluecheck-bound') === 'true') return;

      verifyBtn.addEventListener('click', (event) => {
        setErrorMessage(null);
        setStatusMessage(null);

        if (!isLoggedInRef.current || !userIdRef.current) {
          setErrorMessage('Please sign in before starting verification.');
          return;
        }

        if (isBlueCheckVerifiedRef.current) {
          setStatusMessage('Your account is already BlueCheck verified.');
          return;
        }

        if (!formRef.current?.checkValidity()) {
          formRef.current?.reportValidity();
          return;
        }

        if (!isScriptLoadedRef.current || !isWidgetReadyRef.current) {
          setErrorMessage('Verification is still loading. Please wait a moment and try again.');
          return;
        }

        const currentBlueCheck = window.BlueCheck;
        if (!currentBlueCheck) {
          setErrorMessage('BlueCheck is unavailable right now. Please refresh and try again.');
          return;
        }

        currentBlueCheck.platformCallbacks.scrapeUserData?.();
        if (currentBlueCheck.validateAndDisplayModal()) {
          event.preventDefault();
          event.stopPropagation();
        }
      });

      verifyBtn.setAttribute('data-bluecheck-bound', 'true');
    };

    blueCheck.platformCallbacks.scrapeUserData = () => {
      blueCheck.requiredFields = ['email', 'first_name', 'last_name', 'region', 'country'];
      blueCheck.userData = blueCheck.userData || {};
      blueCheck.userData.email = formDataRef.current.email.trim();
      blueCheck.userData.first_name = formDataRef.current.firstName.trim();
      blueCheck.userData.last_name = formDataRef.current.lastName.trim();
      blueCheck.userData.country = formDataRef.current.country;
      blueCheck.userData.region = formDataRef.current.region;
      blueCheck.verificationType = 'age_photoID';
    };

    blueCheck.platformCallbacks.onUserDataChanged = () => {
      blueCheck.platformCallbacks.scrapeUserData?.();
    };

    blueCheck.platformCallbacks.onClose = () => {
      setStatusMessage('Verification modal closed. Re-open it when you are ready.');
    };

    blueCheck.platformCallbacks.onQuit = () => {
      setStatusMessage('Verification was canceled. You can try again at any time.');
    };

    blueCheck.platformCallbacks.onSuccess = () => {
      setErrorMessage(null);
      setStatusMessage('Verification complete. Syncing your eligibility status...');
      setIsSubmitting(true);

      void submitEligibilityBackup()
        .then(() => {
          setIsBlueCheckVerified(true);
          updateUser({
            isBlueCheckVerified: true,
            blueCheckEmail: formDataRef.current.email.trim(),
          });
          setStatusMessage('Identity verified successfully. You can now withdraw eligible prizes.');
        })
        .catch((err) => {
          const message =
            err instanceof AppApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Verification succeeded, but we could not sync eligibility yet.';
          setErrorMessage(message);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    };

    blueCheck.initialize();
  }, [submitEligibilityBackup, updateUser]);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12">
      <Script
        src={BLUECHECK_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => {
          setIsScriptLoaded(true);
          wireBlueCheckCallbacks();
        }}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Verification</h1>
          <p className="text-text-secondary">
            Complete BlueCheck identity verification to unlock prize withdrawals.
          </p>
        </div>

        {!isLoggedIn ? (
          <Card>
            <div className="space-y-4">
              <p className="text-text-secondary">Sign in to start BlueCheck verification.</p>
              <button onClick={() => setShowLoginModal(true)} className="btn-primary">
                Log In
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <form ref={formRef} className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="first_name">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    className="w-full input"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="last_name">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    className="w-full input"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="country">
                    Country
                  </label>
                  <select
                    id="country"
                    className="w-full input"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                  >
                    {COUNTRIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="region">
                    State / Region
                  </label>
                  <select
                    id="region"
                    className="w-full input"
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                  >
                    {country === 'United States'
                      ? US_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))
                      : ['N/A'].map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-bg-tertiary bg-bg-tertiary/40 p-3 text-sm">
                {isBlueCheckVerified ? (
                  <span className="text-success">This account is already BlueCheck verified.</span>
                ) : (
                  <span className="text-text-secondary">
                    Status: {isScriptLoaded && isWidgetReady ? 'Ready to verify' : 'Loading BlueCheck widget...'}
                  </span>
                )}
              </div>

              {statusMessage && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                  {statusMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                  {errorMessage}
                </div>
              )}

              <button
                id="bluecheck-verify-btn"
                type="button"
                className="btn-primary w-full"
                disabled={isSubmitting || isBlueCheckVerified || !isScriptLoaded}
              >
                {isBlueCheckVerified
                  ? 'Already Verified'
                  : isSubmitting
                    ? 'Syncing verification...'
                    : 'Verify Identity'}
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
