import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initFirebase } from './firebase';
import { setActivePin, getActivePin, clearPin, getProfile, saveProfile, getMilestones, getDiaperRecords, getDailyTodos, getUpcomingTodos } from './storage';

const PinContext = createContext(null);

// 角色权限定义
export const ROLES = {
  viewer: { level: 0, label: '查看者', desc: '只能浏览数据' },
  editor: { level: 1, label: '编辑者', desc: '可增删改成长/尿布/照片/里程碑' },
  admin:  { level: 2, label: '管理员', desc: '全部权限，含设置' },
};

const ROLE_KEY = 'baby_role';
const USER_KEY = 'baby_user';

function getStoredRole() {
  try { return localStorage.getItem(ROLE_KEY); } catch { return null; }
}
function setStoredRole(role) {
  try { localStorage.setItem(ROLE_KEY, role); } catch {}
}
function getStoredUser() {
  try { return localStorage.getItem(USER_KEY); } catch { return null; }
}
function setStoredUser(name) {
  try { localStorage.setItem(USER_KEY, name); } catch {}
}

export function PinProvider({ children }) {
  const [pinCode, setPin] = useState(getActivePin);
  const [firebaseReady, setFirebaseReady] = useState(null);
  const [userName, setUserName] = useState(getStoredUser);
  const [role, setRoleState] = useState(getStoredRole || (getActivePin() ? 'editor' : null));

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const ok = await initFirebase();
      if (!cancelled) setFirebaseReady(ok);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // 当 PIN 变更时，从 Firestore 同步角色
  useEffect(() => {
    if (!pinCode || !firebaseReady) return;
    (async () => {
      try {
        const profile = await getProfile();
        const users = profile?.users || {};
        const hasUsers = Object.keys(users).length > 0;

        if (!hasUsers) {
          // 角色已有效（刚创建完用户，Firestore 还没同步），跳过
          if (role && ROLES[role]) return;
          // 旧数据：profile 没有 users 字段，退出到登录页重新设置身份
          clearPin();
          setStoredRole(null);
          setStoredUser(null);
          setRoleState(null);
          setUserName(null);
          setPin(null);
          return;
        }

        // 有用户信息
        if (userName && users[userName]?.role) {
          setRoleState(users[userName].role);
          setStoredRole(users[userName].role);
        } else if (!userName) {
          // 无用户名，取第一个用户
          const firstUser = Object.keys(users)[0];
          setUserName(firstUser);
          setStoredUser(firstUser);
          setRoleState(users[firstUser].role);
          setStoredRole(users[firstUser].role);
        }
        // 如果 userName 存在但不在 users 里，保持当前角色不变（不降级）
      } catch {
        // 离线时保持 localStorage 中的角色
      }
    })();
  }, [pinCode, firebaseReady, userName]);

  // PIN + Firebase 就绪后，后台预取所有数据，Dashboard 渲染时数据已在缓存中
  useEffect(() => {
    if (!pinCode || !firebaseReady) return;
    Promise.all([
      getProfile(),
      getMilestones(),
      getDiaperRecords(),
      getDailyTodos(),
      getUpcomingTodos(),
    ]).catch(() => {});
  }, [pinCode, firebaseReady]);

  const handleSetPin = useCallback(async (pin, opts = {}) => {
    // 先启动数据预取（同步启动异步请求，不阻塞），再设置 PIN
    // 这样 Dashboard 挂载时数据已经在传输中，甚至可以命中缓存
    if (firebaseReady) {
      getProfile().catch(() => {});
      getMilestones().catch(() => {});
      getDiaperRecords().catch(() => {});
      getDailyTodos().catch(() => {});
      getUpcomingTodos().catch(() => {});
    }
    setActivePin(pin);
    setPin(pin);
    if (opts.role) {
      setRoleState(opts.role);
      setStoredRole(opts.role);
    }
    if (opts.userName) {
      setUserName(opts.userName);
      setStoredUser(opts.userName);
    }
  }, [firebaseReady]);

  const handleClearPin = useCallback(() => {
    clearPin();
    setPin(null);
    setRoleState(null);
    setStoredRole(null);
    setUserName(null);
    setStoredUser(null);
  }, []);

  const handleSetRole = useCallback((newRole) => {
    setRoleState(newRole);
    setStoredRole(newRole);
  }, []);

  const handleSetUserName = useCallback((name) => {
    setUserName(name);
    setStoredUser(name);
  }, []);

  const isAllowed = useCallback((minRole) => {
    if (!role) return false;
    const userLevel = ROLES[role]?.level || 0;
    const requiredLevel = ROLES[minRole]?.level || 0;
    return userLevel >= requiredLevel;
  }, [role]);

  return (
    <PinContext.Provider value={{
      pinCode,
      isAuthenticated: !!pinCode,
      firebaseReady,
      role,
      userName,
      setPin: handleSetPin,
      clearPin: handleClearPin,
      setRole: handleSetRole,
      setUserName: handleSetUserName,
      isAllowed,
    }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePin 必须在 PinProvider 内使用');
  return ctx;
}
