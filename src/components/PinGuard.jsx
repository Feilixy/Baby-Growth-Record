import { useState } from 'react';
import { usePin, ROLES } from '../utils/PinContext';
import { checkPinExists, getProfile, saveProfile, migrateFromLocalToFirestore, setActivePin } from '../utils/storage';
import { KeyRound, Shield, Baby, Users, Lock, Check } from 'lucide-react';

const ROLE_ICONS = { admin: Shield, editor: KeyRound, viewer: Eye };
const ROLE_COLORS = { admin: '#FFB8C6', editor: '#D4C5F0', viewer: '#90caf9' };

function Eye({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
}

export default function PinGuard() {
  const { setPin, firebaseReady } = usePin();
  const [mode, setMode] = useState('enter');
  const [pin, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [userName, setUserNameInput] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUsers, setExistingUsers] = useState([]);
  const [existingAdminPassword, setExistingAdminPassword] = useState(null);
  const [step, setStep] = useState('pin');
  const [selectedUser, setSelectedUser] = useState(null);
  const [familyName, setFamilyName] = useState("");

  const validatePin = (value) => {
    if (value.length < 4 || value.length > 6 || !/^\d+$/.test(value)) {
      setError('请输入 4-6 位数字');
      return false;
    }
    setError('');
    return true;
  };

  const handlePinSubmit = async () => {
    if (!validatePin(pin)) return;
    if (mode === 'create') {
      if (pin !== confirmPin) {
        setError('两次输入的密码不一致');
        return;
      }
      if (!familyName.trim()) { setError('请填写家庭名称'); return; }
    }

    setLoading(true);
    try {
      // 创建模式：检查家庭码是否已存在
      // 创建模式：检查家庭码是否已存在
      if (mode === 'create' && firebaseReady) {
        const exists = await checkPinExists(pin);
        if (exists) {
          setError('该家庭码已存在，请使用其他家庭码');
          setLoading(false);
          return;
        }
      }
      setActivePin(pin);
      if (mode === 'enter') {
        const exists = await checkPinExists(pin);
        if (!exists && firebaseReady) {
          setError('该家庭码不存在，请检查或选择「创建新家庭码」');
          setLoading(false);
          return;
        }
        if (exists) {
          try {
            const profile = await getProfile({ forceRefresh: true });
            const users = profile?.users || {};
            setFamilyName(profile?.familyName || '');
            const userList = Object.entries(users).sort((a, b) => {
              const oa = a[1].order ?? 999;
              const ob = b[1].order ?? 999;
              return oa - ob;
            });
            if (userList.length > 0) {
              setExistingUsers(userList);
              setExistingAdminPassword(profile?.adminPassword || null);
              setStep('user');
              setLoading(false);
              return;
            }
          } catch {}
        }
      }
      // 无成员：进入创建流程
      setStep('create-user');
    } catch (e) {
      setError('操作失败，请重试');
    }
    setLoading(false);
  };

  const handleCreateUser = async () => {
    if (!userName.trim()) { setError('请输入您的称呼'); return; }
    if (!adminPassword || adminPassword.length < 4 || !/^\d+$/.test(adminPassword)) {
      setError('请设置 4-6 位数字管理员密码');
      return;
    }
    if (mode === 'create' && adminPassword !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      // 必须先设置 activePin，否则 saveProfile 里的 writeCache 用的 key 是 null
      await migrateFromLocalToFirestore();
      setActivePin(pin);

      try {
        const profile = await getProfile({ forceRefresh: true });
        const users = { ...(profile?.users || {}) };
        users[userName.trim()] = { role: 'admin', order: 0 };
        await saveProfile({ ...(profile || {}), users, adminPassword, familyName: familyName.trim() });
      } catch (e) {
        console.warn('保存 profile 失败:', e);
      }

      await setPin(pin, { userName: userName.trim(), role: 'admin' });
      window.location.hash = '#/';
    } catch (e) {
      setError('操作失败，请重试');
    }
    setLoading(false);
  };

  const handleUserSelect = async (name, role) => {
    if (role === 'admin') {
      setSelectedUser({ name, role });
      setStep('verify-admin');
      return;
    }
    // 非管理员直接进入
    setLoading(true);
    try {
      setActivePin(pin);
      await migrateFromLocalToFirestore();
      await setPin(pin, { userName: name, role });
      window.location.hash = '#/';
    } catch (e) {
      setError('操作失败，请重试');
    }
    setLoading(false);
  };

  const handleVerifyAdmin = async () => {
    setLoading(true);
    try {
      // 重新获取 profile 直接验证密码
      const profile = await getProfile({ forceRefresh: true });
      const storedPassword = profile?.adminPassword;

      // 如果未设置管理员密码，允许直接进入（恢复路径 + 兼容旧数据）
      if (!storedPassword) {
        await loginAsAdmin();
        return;
      }

      if (adminPassword !== storedPassword) {
        setError('管理员密码错误');
        setLoading(false);
        return;
      }
      // 密码正确，登录
      setActivePin(pin);
      await migrateFromLocalToFirestore();
      await setPin(pin, { userName: selectedUser.name, role: 'admin' });
      window.location.hash = '#/';
    } catch (e) {
      setError('验证失败，请重试');
    }
    setLoading(false);
  };

  const loginAsAdmin = async () => {
    setLoading(true);
    try {
      setActivePin(pin);
      await migrateFromLocalToFirestore();
      await setPin(pin, { userName: selectedUser.name, role: 'admin' });
      window.location.hash = '#/';
    } catch (e) {
      setError('登录失败，请重试');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newAdminPassword || newAdminPassword.length < 4 || !/^\d+$/.test(newAdminPassword)) {
      setError('请设置 4-6 位数字管理员密码');
      return;
    }
    if (newAdminPassword !== confirmNewPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const profile = await getProfile({ forceRefresh: true });
      const users = { ...(profile?.users || {}) };
      await saveProfile({ ...(profile || {}), users, adminPassword: newAdminPassword, familyName: familyName.trim() });
      setActivePin(pin);
      await migrateFromLocalToFirestore();
      await setPin(pin, { userName: selectedUser.name, role: 'admin' });
      window.location.hash = '#/';
    } catch (e) {
      setError('重置失败，请重试');
    }
    setLoading(false);
  };

  // ─── PIN 输入界面 ───
  const renderPinForm = () => (
    <>
      <div className="pin-tabs">
        <button className={`pin-tab ${mode === 'enter' ? 'active' : ''}`}
          onClick={() => { setMode('enter'); setError(''); setStep('pin'); }}>
          <KeyRound size={16} /> 已有家庭码
        </button>
        <button className={`pin-tab ${mode === 'create' ? 'active' : ''}`}
          onClick={() => { setMode('create'); setError(''); setStep('pin'); }}>
          <Shield size={16} /> 创建新家庭码
        </button>
      </div>

      <div className="pin-input-group">
        <label className="pin-label">输入 4-6 位数字家庭码</label>
        <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
          maxLength={6} placeholder="请输入数字"
          value={pin} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} autoFocus />

        {mode === 'create' && (
          <>
            <label className="pin-label" style={{ marginTop: 12 }}>家庭名称</label>
            <input className="pin-input" type="text" placeholder="例如: 小太阳之家"
              value={familyName} onChange={e => setFamilyName(e.target.value)}
              style={{ fontSize: 16, letterSpacing: 1 }}
              maxLength={20} />

            <label className="pin-label" style={{ marginTop: 12 }}>再次确认家庭码</label>
            <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
              maxLength={6} placeholder="再次输入"
              value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
          </>
        )}

        {error && <div className="pin-error">{error}</div>}

        <button className="pin-submit" onClick={handlePinSubmit}
          disabled={loading || pin.length < 4}>
          {loading ? '处理中...' : '下一步'}
        </button>
      </div>
    </>
  );

  // ─── 创建用户 + 设置管理员密码 ───
  const renderCreateUser = () => (
    <div className="pin-input-group">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--pink-pale)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', color: 'var(--pink)',
      }}>
        <Baby size={24} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-cute)', fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
        {mode === 'create' ? '欢迎新家庭 🎉' : '设置您的身份'}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', marginBottom: 20 }}>
        您将成为管理员，请设置管理员密码和您的称呼
      </p>

      <label className="pin-label">您的称呼</label>
      <input className="form-input" type="text" placeholder="例如: 妈妈、爸爸"
        value={userName} onChange={e => setUserNameInput(e.target.value)}
        style={{ textAlign: 'center', fontSize: 16, marginBottom: 16 }} autoFocus />

      <label className="pin-label">
        <Lock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        设置管理员密码（4-6 位数字）
      </label>
      <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
        maxLength={6} placeholder="管理员专用密码"
        value={adminPassword} onChange={e => setAdminPassword(e.target.value.replace(/\D/g, ''))}
        style={{ fontSize: 20, marginBottom: 12 }} />

      <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
        maxLength={6} placeholder="再次确认管理员密码"
        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
        style={{ fontSize: 20, marginBottom: 8 }} />

      {error && <div className="pin-error">{error}</div>}

      <button className="pin-submit" onClick={handleCreateUser} disabled={loading}>
        {loading ? '创建中...' : '创建并进入'}
      </button>
    </div>
  );

  // ─── 选择用户身份 ───
  const renderUserSelection = () => (
    <div className="pin-input-group">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--lavender-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', color: 'var(--lavender)',
      }}>
        <Users size={24} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-cute)', fontSize: 20, textAlign: 'center', marginBottom: 16, lineHeight: 1.6 }}>
        欢迎来到 <span style={{ color: 'var(--pink)' }}>{familyName || ''}</span>
        <br />
        请选择您的身份
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {existingUsers.map(([name, info]) => {
          const roleInfo = ROLES[info.role];
          const roleColor = roleInfo?.level === 2 ? '#FFB8C6' : roleInfo?.level === 1 ? '#D4C5F0' : '#90caf9';
          const RoleIcon = ROLE_ICONS[info.role] || Eye;
          return (
            <button
              key={name}
              className="card"
              style={{
                cursor: 'pointer', textAlign: 'left', marginBottom: 0,
                padding: '16px', width: '100%',
                display: 'flex', alignItems: 'center', gap: 14,
                border: '2px solid transparent',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
              onClick={() => handleUserSelect(name, info.role)}
              disabled={loading}
            >
              {/* 头像 */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--pink-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, flexShrink: 0,
                color: '#C97B8B',
              }}>
                {name.charAt(0)}
              </div>
              {/* 信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--text)' }}>
                  {name}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  marginTop: 4, padding: '2px 10px', borderRadius: 12,
                  background: roleColor + '20',
                  fontSize: 12, fontWeight: 500,
                  color: roleColor,
                }}>
                  <RoleIcon size={12} />
                  {roleInfo?.label}
                </div>
              </div>
              {/* 箭头 */}
              {info.role === 'admin' && (
                <div style={{ color: 'var(--pink)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Lock size={12} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <div className="pin-error">{error}</div>}

      <button className="btn btn-secondary btn-block" style={{ marginTop: 16 }}
        onClick={() => setStep('pin')}>
        返回修改家庭码
      </button>
    </div>
  );

  // ─── 验证管理员密码 ───
  const renderVerifyAdmin = () => (
    <div className="pin-input-group">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--pink-pale)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', color: 'var(--pink)',
      }}>
        <Lock size={24} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-cute)', fontSize: 20, textAlign: 'center', marginBottom: 4 }}>
        管理员验证
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', marginBottom: 8 }}>
        以 <strong>{selectedUser?.name}</strong>（管理员）身份登录
      </p>

      <div style={{
        background: '#FFF9E6', border: '1px solid #FFE0A0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        fontSize: 12, color: '#B8860B', textAlign: 'center',
      }}>
        管理员拥有所有权限，请输入管理员密码确认身份
      </div>

      <label className="pin-label">管理员密码</label>
      <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
        maxLength={6} placeholder="请输入管理员密码"
        value={adminPassword} onChange={e => setAdminPassword(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && handleVerifyAdmin()}
        style={{ fontSize: 20 }}
        autoFocus />

      {error && <div className="pin-error">{error}</div>}

      <div style={{ textAlign: 'center', marginTop: -4, marginBottom: 12 }}>
        <button
          onClick={() => { setStep('recover-password'); setError(''); setAdminPassword(''); }}
          style={{
            background: 'none', border: 'none', color: 'var(--pink)',
            fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
          }}>
          忘记密码？
        </button>
      </div>

      <button className="pin-submit" onClick={handleVerifyAdmin}
        disabled={loading || adminPassword.length < 4}>
        <Check size={18} /> 验证并进入
      </button>

      <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }}
        onClick={() => { setStep('user'); setError(''); setAdminPassword(''); }}>
        返回选择身份
      </button>
    </div>
  );

  // ─── 重置管理员密码 ───
  const renderRecoverPassword = () => (
    <div className="pin-input-group">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#FFF9E6', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', color: '#B8860B',
      }}>
        <Shield size={24} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-cute)', fontSize: 20, textAlign: 'center', marginBottom: 4 }}>
        重置管理员密码
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', marginBottom: 16 }}>
        重置后旧密码将失效，请输入新的管理员密码
      </p>

      <div style={{
        background: '#FFF9E6', border: '1px solid #FFE0A0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        fontSize: 12, color: '#B8860B', textAlign: 'center',
      }}>
        ⚠️ 您已通过家庭码验证，可直接重置密码
      </div>

      <label className="pin-label">新管理员密码</label>
      <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
        maxLength={6} placeholder="4-6 位数字"
        value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
        style={{ fontSize: 20 }}
        autoFocus />

      <label className="pin-label" style={{ marginTop: 12 }}>确认新密码</label>
      <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
        maxLength={6} placeholder="再次输入新密码"
        value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
        style={{ fontSize: 20 }} />

      {error && <div className="pin-error">{error}</div>}

      <button className="pin-submit" onClick={handleResetPassword}
        disabled={loading || newAdminPassword.length < 4}>
        <Check size={18} /> 确认重置并进入
      </button>

      <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }}
        onClick={() => { setStep('verify-admin'); setError(''); setNewAdminPassword(''); setConfirmNewPassword(''); }}>
        返回
      </button>
    </div>
  );

  return (
    <div className="pin-guard">
      <div className="pin-logo">
        <Baby size={48} strokeWidth={1.5} />
      </div>
      <h1 className="pin-title">宝宝成长记录</h1>
      <p className="pin-subtitle">记录宝宝成长的每一个美好瞬间</p>

      {!firebaseReady && (
        <div className="pin-warning">
          <Shield size={16} />
          <span>离线模式，数据仅保存在本机</span>
        </div>
      )}

      {step === 'pin' && renderPinForm()}
      {step === 'create-user' && renderCreateUser()}
      {step === 'user' && renderUserSelection()}
      {step === 'verify-admin' && renderVerifyAdmin()}
      {step === 'recover-password' && renderRecoverPassword()}

      {/* 底部提示 */}
      {step === 'pin' && (
        <p className="pin-hint">
          {mode === 'create'
            ? '创建后可在家人手机上输入同一个家庭码，共享数据 ✨'
            : '使用家人共享的家庭码登录，选择您的身份'}
        </p>
      )}
      {step === 'user' && (
        <p className="pin-hint">
          点按身份卡片进入。管理员需额外验证密码 🔒
        </p>
      )}
      {step === 'create-user' && (
        <p className="pin-hint">
          请记住管理员密码，以后登录管理员需要验证 🔑
        </p>
      )}
      {step === 'recover-password' && (
        <p className="pin-hint">
          重置密码后，请记住新密码 🔑
        </p>
      )}
    </div>
  );
}
