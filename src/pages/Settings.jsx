import { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile, clearPin } from '../utils/storage';
import { usePin } from '../utils/PinContext';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound } from 'lucide-react';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    gender: 'girl',
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { pinCode, clearPin: logoutPin, firebaseReady } = usePin();
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProfile();
      setProfile(p);
      if (p) {
        setForm({ name: p.name, birthDate: p.birthDate, gender: p.gender || 'girl' });
      }
    } catch (e) {
      console.error('Settings 加载失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.birthDate) return;
    if (!firebaseReady) { setSaveError("云端未连接，请刷新页面重试"); setTimeout(() => setSaveError(""), 4000); return; }
    try {
      await saveProfile(form);
      setProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError('保存失败: ' + (e.message || '请检查网络'));
      setTimeout(() => setSaveError(''), 4000);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    // 清除 Firestore 和本地缓存
    localStorage.clear();
    clearPin();
    navigate('/');
    window.location.reload();
  };

  const handleSwitchPin = () => {
    if (window.confirm('切换家庭码将退出当前记录，确定吗？')) {
      localStorage.removeItem('baby_pin');
      clearPin();
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen fade-in">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><span className="emoji">⚙️</span> 宝宝设置</h1>
      </div>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👶</div>
        <div style={{ fontFamily: 'var(--font-cute)', fontSize: 22, color: 'var(--pink)' }}>
          {profile?.name || '设置宝宝信息'}
        </div>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">宝宝名字</label>
          <input className="form-input" type="text" placeholder="宝宝的名字"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">生日</label>
          <input className="form-input" type="date"
            value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">性别</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${form.gender === 'girl' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setForm({ ...form, gender: 'girl' })}>
              👧 女宝宝
            </button>
            <button
              className={`btn ${form.gender === 'boy' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setForm({ ...form, gender: 'boy' })}>
              👦 男宝宝
            </button>
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={handleSave}>
          {saved ? '已保存 ✅' : '保存设置'}
        </button>
        {saveError && <div style={{color: "#e53e3e", fontSize: 13, marginTop: 8, textAlign: "center"}}>{saveError}</div>}
      </div>

      {/* 家庭码信息 */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <KeyRound size={18} /> 家庭码
        </h3>
        <div style={{
          background: '#FFF9E6', border: '1px solid #FFE0A0', borderRadius: 'var(--radius-sm)',
          padding: '12px 16px', textAlign: 'center', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, color: '#B8860B', marginBottom: 4 }}>当前家庭码</div>
          <div style={{
            fontSize: 28, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 6,
            color: 'var(--text)',
          }}>
            {pinCode?.replace(/./g, '●')}
          </div>
          <div style={{ fontSize: 12, color: '#B8860B', marginTop: 4 }}>
            在家人手机上也输入这个家庭码，共享数据
          </div>
        </div>
        <button className="btn btn-secondary btn-block btn-sm" onClick={handleSwitchPin}>
          切换家庭码
        </button>
      </div>

      {/* 数据说明 */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={18} /> 数据说明
        </h3>
        <ul style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 2, paddingLeft: 16 }}>
          {firebaseReady ? (
            <>
              <li>数据存储在云端和本地</li>
              <li>输入同一个家庭码的设备共享数据</li>
              <li>无网络时自动使用本地缓存</li>
            </>
          ) : (
            <>
              <li>当前为离线模式，数据仅保存在本地</li>
              <li>配置 Firebase 后可实现多设备同步</li>
            </>
          )}
        </ul>
        <button className="btn btn-danger btn-block btn-sm" style={{ marginTop: 12 }}
          onClick={handleClearAll}>
          清除所有数据
        </button>
      </div>
    </div>
  );
}
