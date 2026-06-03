import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let db = null;
let auth = null;

export function getDb() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (!db) {
    if (!app) app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export function getAuthInstance() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (!auth) {
    if (!app) app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}

/**
 * 初始化 Firebase 并匿名登录
 * @returns {Promise<boolean>} 是否成功
 */
export async function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return false;
  try {
    const a = getAuthInstance();
    if (a) {
      await signInAnonymously(a);
    }
    return true;
  } catch (e) {
    console.warn('Firebase 初始化失败，将使用本地存储:', e.message);
    return false;
  }
}
