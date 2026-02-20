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

function getFirebaseConfigFromEnv(): FirebaseConfig {
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
    // Avoid throwing at import time; only throw when used.
    throw new Error(
      'Missing Firebase env vars. Ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_DATABASE_URL, NEXT_PUBLIC_PROJECT_ID are set.',
    );
  }

  return cfg;
}

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

/**
 * Get (or init) the Firebase app.
 */
export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  if (getApps().length) {
    _app = getApp();
    return _app;
  }

  const cfg = getFirebaseConfigFromEnv();
  _app = initializeApp(cfg);
  return _app;
}

/**
 * Get (or init) the Firebase Realtime Database.
 */
export function getFirebaseDatabase(): Database {
  if (_db) return _db;
  const app = getFirebaseApp();
  _db = getDatabase(app);
  return _db;
}

/**
 * Subscribe to a Firebase path.
 *
 * @returns an unsubscribe function.
 */
export function subscribeValue<T = unknown>(path: string, cb: (value: T | null) => void): Unsubscribe {
  const db = getFirebaseDatabase();
  const r = ref(db, path);

  const unsub = onValue(
    r,
    (snapshot) => {
      cb(snapshot.exists() ? (snapshot.val() as T) : null);
    },
    (error) => {
      // Consumers should handle errors via their own UI state.
      console.error('[firebase] subscribeValue error', error);
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
