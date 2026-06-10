import { useState, useEffect } from 'react';
import { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { usePin } from './utils/PinContext';
import { getProfile } from './utils/storage';
import Layout from './components/Layout';
import PinGuard from './components/PinGuard';
import { Baby } from 'lucide-react';

// 代码分割：每个页面独立加载，首屏只下载当前页面的代码
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Growth = lazy(() => import('./pages/Growth'));
const Photos = lazy(() => import('./pages/Photos'));
const Milestones = lazy(() => import('./pages/Milestones'));
const Diary = lazy(() => import('./pages/Diary'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoading() {
  return (
    <div className="loading-screen fade-in">
      <div className="loading-spinner" />
    </div>
  );
}

// === 宝宝信息补全提示弹窗 ===
function ProfilePrompt({ missingFields, onDismiss, onGoSettings }) {
  const labels = {
    name: '宝宝名字',
    birthDate: '宝宝生日',
    gender: '宝宝性别',
    familyName: '家庭名称',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 28,
        maxWidth: 340, width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--pink-pale)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Baby size={32} strokeWidth={1.5} color="var(--pink)" />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-cute)', fontSize: 20, marginBottom: 8,
          color: 'var(--text)',
        }}>
          欢迎来到宝宝成长记录 🎉
        </h2>

        <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16, lineHeight: 1.6 }}>
          在开始记录之前，请先完成
          <br />
          以下宝宝信息的设置：
        </p>

        <div style={{
          background: '#FFF9E6', borderRadius: 12, padding: 14,
          marginBottom: 20, textAlign: 'left',
          border: '1px solid #FFE0A0',
        }}>
          {missingFields.map((field, idx) => (
            <div key={field} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 0',
              borderBottom: idx < missingFields.length - 1 ? '1px solid #FFE8C8' : 'none',
            }}>
              <span style={{ color: '#E8A020', fontSize: 16 }}>♦</span>
              <span style={{ fontSize: 14, color: '#8B6914' }}>
                {labels[field] || field}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onGoSettings}
          style={{
            width: '100%', padding: '12px 0',
            background: 'linear-gradient(135deg, #FFB8C6, #FF8FA3)',
            border: 'none', borderRadius: 12,
            color: 'white', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-cute)',
          }}>
          📋 前往设置填写
        </button>

        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '10px 0', marginTop: 8,
            background: 'none', border: 'none',
            color: 'var(--text-light)', fontSize: 13,
            cursor: 'pointer',
          }}>
          稍后再说
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = usePin();
  const navigate = useNavigate();
  const location = useLocation();
  const [missingFields, setMissingFields] = useState([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkProfile = async (autoRedirect) => {
    try {
      const profile = await getProfile();
      const missing = [];
      if (!profile?.name?.trim()) missing.push('name');
      if (!profile?.birthDate) missing.push('birthDate');
      if (!profile?.gender) missing.push('gender');
      if (!profile?.familyName?.trim()) missing.push('familyName');

      if (missing.length > 0) {
        setMissingFields(missing);
        setShowPrompt(true);
        if (autoRedirect) {
          navigate('/settings', { replace: true });
        }
      } else {
        setMissingFields([]);
        setShowPrompt(false);
      }
    } catch (e) {
      console.error('检查 profile 失败:', e);
    }
    setChecked(true);
  };

  // 1) 认证成功时：自动检查并跳转到设置页
  useEffect(() => {
    if (!isAuthenticated) {
      setChecked(false);
      setShowPrompt(false);
      return;
    }
    checkProfile(true);
  }, [isAuthenticated]);

  // 2) 回到首页时重新检查（填完信息后自动解除弹窗）
  useEffect(() => {
    if (!isAuthenticated || !checked) return;
    if (location.pathname === '/') {
      checkProfile(false);
    }
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <PinGuard />;
  }

  return (
    <Suspense fallback={<PageLoading />}>
      {showPrompt && missingFields.length > 0 && (
        <ProfilePrompt
          missingFields={missingFields}
          onDismiss={() => setShowPrompt(false)}
          onGoSettings={() => {
            setShowPrompt(false);
            navigate('/settings');
          }}
        />
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}