/**
 * Firebase Admin SDK singleton for server-side Firestore access.
 * 
 * Uses FIREBASE_SERVICE_ACCOUNT_JSON env var (base64-encoded or raw JSON)
 * to authenticate. Falls back to application default credentials.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _db: Firestore | null = null;

function getServiceAccount(): object | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    // Try raw JSON first
    return JSON.parse(raw);
  } catch {
    // Try base64-encoded
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      console.warn('[firebaseAdmin] Could not parse FIREBASE_SERVICE_ACCOUNT_JSON');
      return null;
    }
  }
}

export function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length) {
    _app = getApps()[0];
    return _app;
  }

  const sa = getServiceAccount();
  if (sa) {
    _app = initializeApp({ credential: cert(sa as Parameters<typeof cert>[0]) });
  } else {
    // Fall back to ADC (works in GCP environments)
    _app = initializeApp();
  }
  return _app;
}

export function getAdminFirestore(): Firestore {
  if (_db) return _db;
  const app = getAdminApp();
  _db = getFirestore(app);
  return _db;
}

/**
 * Check if Firestore is configured (service account available).
 */
export function isFirestoreConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
}
