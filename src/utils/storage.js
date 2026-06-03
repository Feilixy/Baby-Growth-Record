import { getDb } from './firebase';
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';

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
    const items = await getAllFromFirestore(subcollection);
    writeCache(subcollection, items);
    if (sortFn) items.sort(sortFn);
    return items;
  } catch {
    // 离线回退到本地缓存
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
  await setDoc(ref, data);
  // 更新缓存
  removeCache(subcollection);
  return data;
}

async function updateItem(subcollection, id, data) {
  const ref = singleDocRef(subcollection, id);
  if (!ref) throw new Error('Firebase 未配置');
  await updateDoc(ref, data);
  removeCache(subcollection);
}

async function deleteItem(subcollection, id) {
  const ref = singleDocRef(subcollection, id);
  if (!ref) throw new Error('Firebase 未配置');
  await deleteDoc(ref);
  removeCache(subcollection);
}

// ─── 检查 PIN 是否存在 ──────────────────────────────────────

export async function checkPinExists(pin) {
  const db = getDb();
  if (!db) return false;
  try {
    const ref = doc(db, 'data', pin, 'profile', 'default');
    const snap = await getDoc(ref);
    return snap.exists();
  } catch {
    return false;
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

export async function getProfile() {
  try {
    const ref = singleDocRef('profile', 'default');
    if (!ref) throw new Error('Firebase 未配置');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      writeCache('profile', data);
      return data;
    }
    return readCache('profile') || null;
  } catch {
    return readCache('profile') || null;
  }
}

export async function saveProfile(profile) {
  const ref = singleDocRef('profile', 'default');
  if (!ref) throw new Error('Firebase 未配置');
  await setDoc(ref, profile);
  writeCache('profile', profile);
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
