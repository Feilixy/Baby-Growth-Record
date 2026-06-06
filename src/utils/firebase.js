import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableMultiTabIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
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
    const settings = {
      experimentalForceLongPolling: true,
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    };
    db = initializeFirestore(app, settings);
    // 启用离线持久化，后续读取直接从本地缓存加载
    if (!db._persistenceEnabled) {
      enableMultiTabIndexedDbPersistence(db).catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('多标签页已打开，持久化仅限一个标签');
        } else if (err.code === 'unimplemented') {
          console.warn('浏览器不支持 IndexedDB 持久化');
        } else {
          console.warn('Firestore 持久化错误:', err.message);
        }
      });
      db._persistenceEnabled = true;
    }
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
      // 不阻塞等待匿名登录完成——Firestore SDK 内部会自动排队等待
      signInAnonymously(a).catch(e => {
        console.warn('匿名登录失败（不影响离线数据）:', e.message);
      });
    }
    // 立即返回成功，让 firebaseReady 马上变为 true
    return true;
  } catch (e) {
    console.warn('Firebase 初始化失败，将使用本地存储:', e.message);
    return false;
  }
}
