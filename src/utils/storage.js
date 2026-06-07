import { getDb } from './firebase';
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';

// ─── 内存缓存 + 去重队列 ──────────────────────────────────

const sessionCache = new Map();       // 内存缓存：同一次会话跨页面共享
const pendingFetches = new Map();     // 去重队列：同一集合不重复请求

function getCached(subcollection) {
  return sessionCache.get(subcollection) || null;
}

function setCached(subcollection, data) {
  sessionCache.set(subcollection, data);
  writeCache(subcollection, data);    // 同步写入 localStorage 作为持久化
}

function invalidateCache(subcollection) {
  sessionCache.delete(subcollection);
  removeCache(subcollection);
}

// 缓存优先读取：先返回本地缓存（瞬间），再后台同步 Firestore
async function readWithCache(subcollection, sortFn) {
  const cached = getCached(subcollection);
  if (cached) {
    const copy = [...cached];
    if (sortFn) copy.sort(sortFn);
    return copy;
  }

  const localCached = readCache(subcollection);
  if (localCached) {
    setCached(subcollection, localCached);
    // 不等待，后台刷新
    refreshFromFirestore(subcollection).catch(() => {});
    const copy = [...localCached];
    if (sortFn) copy.sort(sortFn);
    return copy;
  }

  // 无缓存 → 不阻塞，后台同步并返回空数组
  refreshFromFirestore(subcollection).catch(() => {});
  return [];
}

// 后台从 Firestore 刷新缓存（带请求去重）
async function refreshFromFirestore(subcollection, sortFn) {
  if (pendingFetches.has(subcollection)) {
    const items = await pendingFetches.get(subcollection);
    if (sortFn) items.sort(sortFn);
    return items;
  }

  const promise = (async () => {
    try {
      const items = await getAllFromFirestore(subcollection);
      setCached(subcollection, items);
      if (sortFn) items.sort(sortFn);
      return items;
    } finally {
      pendingFetches.delete(subcollection);
    }
  })();

  pendingFetches.set(subcollection, promise);
  return promise;
}

// ─── PIN 管理 ───────────────────────────────────────────────

let currentPin = localStorage.getItem('baby_pin');

export function setActivePin(pin) {
  currentPin = pin;
  localStorage.setItem('baby_pin', pin);
}

export function getActivePin() {
  return currentPin;
}

export function clearPin() {
  currentPin = null;
  localStorage.removeItem('baby_pin');
}

// ─── ID 生成 ────────────────────────────────────────────────

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ─── Firestore 辅助 ─────────────────────────────────────────

function dataRef(subcollection) {
  const db = getDb();
  if (!db) return null;
  return collection(db, 'data', currentPin, subcollection);
}

function singleDocRef(subcollection, id = 'default') {
  const db = getDb();
  if (!db) return null;
  return doc(db, 'data', currentPin, subcollection, id);
}

// ─── 本地缓存 ───────────────────────────────────────────────

function cacheKey(subcollection) {
  return 'cache_' + currentPin + '_' + subcollection;
}

function readCache(subcollection) {
  try {
    const raw = localStorage.getItem(cacheKey(subcollection));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(subcollection, data) {
  try {
    localStorage.setItem(cacheKey(subcollection), JSON.stringify(data));
  } catch (e) {
    console.warn('缓存写入失败（可能存储空间不足）:', e.message);
  }
}

function removeCache(subcollection) {
  localStorage.removeItem(cacheKey(subcollection));
}

// ─── 通用 Firestore 操作 ────────────────────────────────────

async function getAllFromFirestore(subcollection) {
  const ref = dataRef(subcollection);
  if (!ref) throw new Error('Firebase 未配置');
  const snapshot = await getDocs(ref);
  const items = [];
  snapshot.forEach(snap => items.push(snap.data()));
  return items;
}

async function getAllSorted(subcollection, sortFn) {
  try {
    return await readWithCache(subcollection, sortFn);
  } catch {
    const cached = readCache(subcollection);
    if (cached && sortFn) cached.sort(sortFn);
    return cached || [];
  }
}

async function addItem(subcollection, item) {
  const id = item.id || generateId();
  const ref = singleDocRef(subcollection, id);
  if (!ref) throw new Error('Firebase 未配置');
  const data = { ...item, id };
  // 真正乐观更新：先更新缓存再写入 Firestore，用户立刻看到结果
  const cached = getCached(subcollection) || readCache(subcollection) || [];
  setCached(subcollection, [...cached, data]);
  // 后台静默写入 Firestore，不阻塞 UI
  setDoc(ref, data).catch(e => {
    console.error('Firestore 写入失败（乐观更新已应用，下次刷新会同步）:', e.message);
  });
  return data;
}

async function updateItem(subcollection, id, data) {
  const ref = singleDocRef(subcollection, id);
  if (!ref) throw new Error('Firebase 未配置');
  // 真正乐观更新：先更新缓存再写入 Firestore
  const cached = getCached(subcollection) || readCache(subcollection);
  if (cached) {
    setCached(subcollection, cached.map(item => item.id === id ? { ...item, ...data } : item));
  }
  // 后台静默写入 Firestore
  updateDoc(ref, data).catch(e => {
    console.error('Firestore 更新失败（乐观更新已应用）:', e.message);
  });
}

async function deleteItem(subcollection, id) {
  const ref = singleDocRef(subcollection, id);
  if (!ref) throw new Error('Firebase 未配置');
  // 真正乐观更新：先更新缓存再删除 Firestore 数据
  const cached = getCached(subcollection) || readCache(subcollection);
  if (cached) {
    setCached(subcollection, cached.filter(item => item.id !== id));
  }
  // 后台静默删除 Firestore
  deleteDoc(ref).catch(e => {
    console.error('Firestore 删除失败（乐观更新已应用）:', e.message);
  });
}

// ─── 检查 PIN 是否存在 ──────────────────────────────────────

export async function checkPinExists(pin) {
  const db = getDb();
  if (!db) {
    // 离线模式：检查 localStorage 缓存
    try {
      return localStorage.getItem('cache_' + pin + '_profile') !== null;
    } catch { return false; }
  }
  try {
    const ref = doc(db, 'data', pin, 'profile', 'default');
    const snap = await getDoc(ref);
    if (snap.exists()) return true;
    // Firestore 中没有，检查本地缓存
    try {
      return localStorage.getItem('cache_' + pin + '_profile') !== null;
    } catch { return false; }
  } catch {
    // Firestore 读取失败，回退到本地缓存
    try {
      return localStorage.getItem('cache_' + pin + '_profile') !== null;
    } catch { return false; }
  }
}

// ─── 从 localStorage 迁移到 Firestore ──────────────────────

export async function migrateFromLocalToFirestore() {
  const db = getDb();
  if (!db || !currentPin) return;

  const localKeys = {
    baby_profile: async (data) => {
      await setDoc(singleDocRef('profile', 'default'), data);
    },
    growth_records: async (data) => {
      if (!Array.isArray(data)) return;
      for (const item of data) {
        await setDoc(singleDocRef('growth_records', item.id || generateId()), item);
      }
    },
    photos: async (data) => {
      if (!Array.isArray(data)) return;
      for (const item of data) {
        await setDoc(singleDocRef('photos', item.id || generateId()), item);
      }
    },
    milestones: async (data) => {
      if (!Array.isArray(data)) return;
      for (const item of data) {
        await setDoc(singleDocRef('milestones', item.id || generateId()), item);
      }
    },
    diaper_records: async (data) => {
      if (!Array.isArray(data)) return;
      for (const item of data) {
        await setDoc(singleDocRef('diaper_records', item.id || generateId()), item);
      }
    },
  };

  try {
    for (const [key, uploadFn] of Object.entries(localKeys)) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data) await uploadFn(data);
    }

    // 迁移成功后清除 localStorage 旧数据
    Object.keys(localKeys).forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('数据迁移失败（Firebase 未配置时忽略）:', e.message);
  }
}

// ─── Baby Profile ───────────────────────────────────────────

export async function getProfile(options = {}) {
  // forceRefresh：等待 Firestore 返回真实数据（登录等场景需要）
  if (options.forceRefresh) {
    return await refreshProfile();
  }

  // 从内存缓存返回（瞬间）
  const memCached = getCached('profile');
  if (memCached) return memCached;

  const localCached = readCache('profile');
  
  // 返回本地缓存，同时后台刷新
  if (localCached) {
    setCached('profile', localCached);
    refreshProfile().catch(() => {});
    return localCached;
  }

  // 无缓存 → 不阻塞，后台同步并返回 null
  refreshProfile().catch(() => {});
  return null;
}

async function refreshProfile() {
  try {
    const ref = singleDocRef('profile', 'default');
    if (!ref) return getCached('profile') || null;
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      // 合并本地缓存中的 users 和 adminPassword
      const localCached = readCache('profile');
      if (localCached?.users && Object.keys(localCached.users).length > 0) {
        data.users = localCached.users;
      }
      if (localCached?.adminPassword) {
        data.adminPassword = localCached.adminPassword;
      }
      setCached('profile', data);
      return data;
    }
    return getCached('profile') || null;
  } catch {
    return getCached('profile') || null;
  }
}

export async function saveProfile(profile) {
  const ref = singleDocRef('profile', 'default');
  if (!ref) throw new Error('Firebase 未配置');
  writeCache('profile', profile);
  await setDoc(ref, profile);
}

// ─── Growth Records ─────────────────────────────────────────

export async function getGrowthRecords() {
  return getAllSorted('growth_records', (a, b) => new Date(a.date) - new Date(b.date));
}

export async function addGrowthRecord(record) {
  const data = await addItem('growth_records', record);
  return data;
}

export async function updateGrowthRecord(id, data) {
  await updateItem('growth_records', id, data);
}

export async function deleteGrowthRecord(id) {
  await deleteItem('growth_records', id);
}

// ─── Photos ─────────────────────────────────────────────────

export async function getPhotos() {
  return getAllSorted('photos', (a, b) => new Date(b.date) - new Date(a.date));
}

export async function addPhoto(photo) {
  return await addItem('photos', photo);
}

export async function deletePhoto(id) {
  await deleteItem('photos', id);
}

// ─── Milestones ─────────────────────────────────────────────

export async function getMilestones() {
  return getAllSorted('milestones', (a, b) => new Date(b.date) - new Date(a.date));
}

export async function addMilestone(milestone) {
  return await addItem('milestones', milestone);
}

export async function deleteMilestone(id) {
  await deleteItem('milestones', id);
}

// ─── Diaper Records ─────────────────────────────────────────

export async function getDiaperRecords() {
  return getAllSorted('diaper_records', (a, b) => {
    const dc = new Date(b.date) - new Date(a.date);
    if (dc !== 0) return dc;
    return b.time.localeCompare(a.time);
  });
}

export async function addDiaperRecord(record) {
  return await addItem('diaper_records', record);
}

export async function deleteDiaperRecord(id) {
  await deleteItem('diaper_records', id);
}

// ─── Feeding Records ────────────────────────────────────────

export async function getFeedingRecords() {
  return getAllSorted('feeding_records', (a, b) => {
    const dc = new Date(b.date) - new Date(a.date);
    if (dc !== 0) return dc;
    return b.time.localeCompare(a.time);
  });
}

export async function addFeedingRecord(record) {
  return await addItem('feeding_records', record);
}

export async function deleteFeedingRecord(id) {
  await deleteItem('feeding_records', id);
}

// ─── Daily Todos ──────────────────────────────────────────

export async function getDailyTodos() {
  return getAllSorted('daily_todos', (a, b) => a.order - b.order);
}

export async function addDailyTodo(todo) {
  return await addItem('daily_todos', todo);
}

export async function updateDailyTodo(id, data) {
  await updateItem('daily_todos', id, data);
}

export async function deleteDailyTodo(id) {
  await deleteItem('daily_todos', id);
}

// ─── Upcoming Todos ──────────────────────────────────────

export async function getUpcomingTodos() {
  return getAllSorted('upcoming_todos', (a, b) => a.order - b.order);
}

export async function addUpcomingTodo(todo) {
  return await addItem('upcoming_todos', todo);
}

export async function updateUpcomingTodo(id, data) {
  await updateItem('upcoming_todos', id, data);
}

export async function deleteUpcomingTodo(id) {
  await deleteItem('upcoming_todos', id);
}
