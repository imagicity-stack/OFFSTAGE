'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { firebaseConfig, useEmulators } from './config';

let app: FirebaseApp | undefined;

function getApp() {
  if (!app) {
    const fresh = getApps().length === 0;
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    if (fresh && useEmulators) {
      // Local development only: `firebase emulators:start`.
      connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
      connectStorageEmulator(getStorage(app), '127.0.0.1', 9199);
    }
  }
  return app;
}

export const auth = () => getAuth(getApp());
export const db = () => getFirestore(getApp());
export const storage = () => getStorage(getApp());
