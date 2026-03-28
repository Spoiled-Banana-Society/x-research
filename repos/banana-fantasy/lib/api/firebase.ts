/**
 * Firebase client helpers (Realtime Database).
 *
 * SBS uses Firebase Realtime Database for lightweight real-time signals like
 * number of players currently joined in a draft.
 */

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  onValue,
  ref,
  type Database,
  type Unsubscribe,
  off,
} from 'firebase/database';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

function getFirebaseConfigFromEnv(): FirebaseConfig | null {
  const cfg: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || '',
    databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL || '',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID || undefined,
  };

  if (!cfg.apiKey || !cfg.databaseURL || !cfg.projectId) {
    // Return null instead of throwing — callers must handle gracefully.
    // This prevents the error boundary from crashing the entire draft room
    // when Firebase env vars are missing.
    console.warn(
      '[firebase] Missing Firebase env vars (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_DATABASE_URL, NEXT_PUBLIC_PROJECT_ID). Firebase RTDB disabled.',
    );
    return null;
  }

  return cfg;
}

let _app: FirebaseApp | null = null;
let _db: Database | null = null;
let _disabled = false;

/**
 * Whether Firebase RTDB is available (env vars configured).
 */
export function isFirebaseAvailable(): boolean {
  if (_disabled) return false;
  if (_app) return true;
  // Check without initializing — just see if config is valid
  const cfg = getFirebaseConfigFromEnv();
  if (!cfg) {
    _disabled = true;
    return false;
  }
  return true;
}

/**
 * Get (or init) the Firebase app. Returns null if Firebase is not configured.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (_disabled) return null;
  if (_app) return _app;

  if (getApps().length) {
    _app = getApp();
    return _app;
  }

  const cfg = getFirebaseConfigFromEnv();
  if (!cfg) {
    _disabled = true;
    return null;
  }
  _app = initializeApp(cfg);
  return _app;
}

/**
 * Get (or init) the Firebase Realtime Database. Returns null if Firebase is not configured.
 */
export function getFirebaseDatabase(): Database | null {
  if (_db) return _db;
  const app = getFirebaseApp();
  if (!app) return null;
  _db = getDatabase(app);
  return _db;
}

/**
 * Subscribe to a Firebase path.
 *
 * @param path - Firebase RTDB path to subscribe to
 * @param cb - Callback invoked with the value (or null if path doesn't exist)
 * @param onError - Optional error callback (e.g., permission_denied)
 * @returns an unsubscribe function (no-op if Firebase is not configured).
 */
export function subscribeValue<T = unknown>(
  path: string,
  cb: (value: T | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('[firebase] subscribeValue skipped — Firebase not configured');
    return () => {}; // no-op unsubscribe
  }
  const r = ref(db, path);

  const unsub = onValue(
    r,
    (snapshot) => {
      cb(snapshot.exists() ? (snapshot.val() as T) : null);
    },
    (error) => {
      console.error('[firebase] subscribeValue error', error);
      if (onError) onError(error);
    },
  );

  return () => {
    off(r);
    unsub();
  };
}

/**
 * Subscribe to number of players joined in a draft.
 *
 * Firebase path (per API_INTEGRATION.md):
 *   /drafts/{draftId}/numPlayers
 */
export function subscribeDraftNumPlayers(draftId: string, cb: (numPlayers: number) => void): Unsubscribe {
  return subscribeValue<number>(`/drafts/${draftId}/numPlayers`, (v) => cb(Number(v || 0)));
}
