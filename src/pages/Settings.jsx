import { useState, useEffect, useCallback, useRef } from 'react';
import { getProfile, saveProfile, clearPin, clearAllData, deleteFamilyCompletely } from '../utils/storage';
import { usePin, ROLES } from '../utils/PinContext';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, KeyRound, UserPlus, UserMinus, Crown, Edit3, Eye, GripVertical, Lock } from 'lucide-react';

const ROLE_ICONS = { admin: Crown, editor: Edit3, viewer: Eye };

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', birthDate: '', gender: 'girl', familyName: '' });
  const [saved, setSaved] = useState(false);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalConfirmPwd, setModalConfirmPwd] = useState('');
  const [modalError, setModalError] = useState('');
  const [users, setUsers] = useState({});
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [dangerModal, setDangerModal] = useState(null); // 'clear' | 'delete'
  const [dangerPwd, setDangerPwd] = useState('');
  const [dangerConfirm, setDangerConfirm] = useState('');
  const [dangerError, setDangerError] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);
  const { pinCode, clearPin: logoutPin, firebaseReady, role, userName, isAllowed } = usePin();
  const navigate = useNavigate();

  const isAdmin = isAllowed('admin');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProfile();
      setProfile(p);
      if (p) {
        setForm({ name: p.name, birthDate: p.birthDate, gender: p.gender || 'girl', familyName: p.familyName || '' });
        const loadedUsers = p.users || {};
        // 为没有 order 的旧数据补充排序值
        const hasOrder = Object.values(loadedUsers).some(u => u.order !== undefined);
        if (!hasOrder && Object.keys(loadedUsers).length > 0) {
          const ordered = {};
          Object.entries(loadedUsers).forEach(([name, info], i) => {
            ordered[name] = { ...info, order: i };
          });
          setUsers(ordered);
        } else {
          setUsers(loadedUsers);
        }
      }
    } catch (e) {
      console.error('Settings 加载失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.birthDate) return;
    if (!firebaseReady) { setSaveError('云端未连接，请刷新页面重试'); setTimeout(() => setSaveError(''), 4000); return; }
    try {
      await saveProfile({ ...form, adminPassword: profile?.adminPassword, users });
      setProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError('保存失败: ' + (e.message || '请检查网络'));
      setTimeout(() => setSaveError(''), 4000);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    if (users[newUserName.trim()]) {
      setSaveError('该称呼已存在');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    const maxOrder = Math.max(0, ...Object.values(users).map(u => u.order ?? -1));
    const updated = { ...users, [newUserName.trim()]: { role: newUserRole, order: maxOrder + 1 } };
    try {
      await saveProfile({ ...form, adminPassword: profile?.adminPassword, users: updated });
      setUsers(updated);
      setNewUserName('');
      setNewUserRole('viewer');
    } catch (e) {
      setSaveError('添加失败: ' + (e.message || '请重试'));
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  const handleRemoveUser = async (name) => {
    if (name === userName) {
      setSaveError('不能移除自己');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    if (Object.keys(users).length <= 1) {
      setSaveError('至少保留一个成员');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    const updated = { ...users };
    delete updated[name];
    try {
      await saveProfile({ ...form, adminPassword: profile?.adminPassword, users: updated });
      setUsers(updated);
    } catch (e) {
      setSaveError('移除失败: ' + (e.message || '请重试'));
      setTimeout(() => setSaveError(''), 3000);
    }
  };

  const handleChangeRole = async (name, newRole) => {
    const updated = { ...users, [name]: { role: newRole } };
    try {
      await saveProfile({ ...form, adminPassword: profile?.adminPassword, users: updated });
      setUsers(updated);
    } catch (e) {
      console.error('修改角色失败:', e);
    }
  };

  const handleDrop = async () => {
    const draggedName = dragItem.current;
    const targetName = dragOverItem.current;
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverKey(null);
    if (!draggedName || !targetName || draggedName === targetName) return;

    const entries = Object.entries(users).sort((a, b) => (a[1].order ?? 999) - (b[1].order ?? 999));
    const nameList = entries.map(([n]) => n);
    const fromIdx = nameList.indexOf(draggedName);
    const toIdx = nameList.indexOf(targetName);
    if (fromIdx < 0 || toIdx < 0) return;

    // 重新构建排序
    const reordered = [...nameList];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, draggedName);
    const updated = {};
    reordered.forEach((n, i) => {
      updated[n] = { ...users[n], order: i };
    });
    try {
      await saveProfile({ ...form, adminPassword: profile?.adminPassword, users: updated });
      setUsers(updated);
    } catch (e) {
      setSaveError('排序失败: ' + (e.message || '请重试'));
      setTimeout(() => setSaveError(''), 3000);
    }
  };


  const handleSetPassword = async () => {
    if (!modalPassword || modalPassword.length < 4 || !/^\d+$/.test(modalPassword)) {
      setModalError('请输入 4-6 位数字');
      return;
    }
    if (modalPassword !== modalConfirmPwd) {
      setModalError('两次输入的密码不一致');
      return;
    }
    try {
      const p = await getProfile();
      await saveProfile({ ...p, adminPassword: modalPassword, users: p?.users || {} });
      // 同步 React state，避免后续保存覆盖新密码
      setProfile(prev => ({ ...prev, adminPassword: modalPassword }));
      setShowPasswordModal(false);
      setModalPassword('');
      setModalConfirmPwd('');
      setModalError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setModalError('保存失败: ' + (e.message || '请重试'));
    }
  };

  const handleDangerConfirm = async () => {
    if (!dangerPwd || dangerPwd.length < 4) {
      setDangerError('请输入管理员密码');
      return;
    }
    if (dangerPwd !== profile?.adminPassword) {
      setDangerError('管理员密码错误');
      return;
    }
    if (dangerModal === 'delete' && dangerConfirm !== '确认删除') {
      setDangerError('请输入「确认删除」');
      return;
    }
    setDangerLoading(true);
    try {
      if (dangerModal === 'clear') {
        await clearAllData();
      } else if (dangerModal === 'delete') {
        await deleteFamilyCompletely(pinCode);
      }
      setDangerModal(null);
      setDangerPwd('');
      setDangerConfirm('');
      setDangerError('');
      setDangerLoading(false);
      if (dangerModal === 'delete') {
        // 删除家庭后退出登录
        logoutPin();
      } else {
        // 清除数据后刷新页面
        window.location.reload();
      }
    } catch (e) {
      setDangerError('操作失败: ' + (e.message || '请重试'));
      setDangerLoading(false);
    }
  };

  const handleSwitchPin = () => {
    if (window.confirm('切换家庭码将退出当前记录，确定吗？')) {
      logoutPin();
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

  const currentRoleIcon = ROLE_ICONS[role] || Eye;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><span className="emoji">⚙️</span> 宝宝设置</h1>
      </div>

      {/* 身份信息 */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👶</div>
        <div style={{ fontFamily: 'var(--font-cute)', fontSize: 22, color: 'var(--pink)' }}>
          {profile?.name || '设置宝宝信息'}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 8, padding: '4px 12px', borderRadius: 20,
          background: role === 'admin' ? 'var(--pink-pale)' : role === 'editor' ? 'var(--lavender-light)' : '#F5F5F5',
          fontSize: 13, color: 'var(--text-light)',
        }}>
          {(() => { const Icon = currentRoleIcon; return <Icon size={14} />; })()}
          {userName} · {ROLES[role]?.label || '未知'}
        </div>
      </div>

      {/* 宝宝信息 */}
      <div className="card">
        <div className="form-group">
          <label className="form-label">宝宝名字</label>
          {isAdmin ? (
            <input className="form-input" type="text" placeholder="宝宝的名字"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          ) : (
            <div style={{ fontSize: 18, fontWeight: 600, padding: '10px 0' }}>
              {profile?.name || '未设置'}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">生日</label>
          {isAdmin ? (
            <input className="form-input" type="date"
              value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
          ) : (
            <div style={{ fontSize: 16, padding: '10px 0', color: 'var(--text)' }}>
              {form.birthDate || '未设置'}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">性别</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin ? (
              <>
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
              </>
            ) : (
              <div style={{ fontSize: 16, padding: '10px 0' }}>
                {form.gender === 'girl' ? '👧 女宝宝' : '👦 男宝宝'}
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">家庭名称</label>
          {isAdmin ? (
            <input className="form-input" type="text" placeholder="例如: 小太阳之家"
              value={form.familyName || ''} onChange={e => setForm({ ...form, familyName: e.target.value })}
              maxLength={20} />
          ) : (
            <div style={{ fontSize: 16, padding: '10px 0', color: 'var(--text)' }}>
              {form.familyName || '未设置'}
            </div>
          )}
        </div>
        {isAdmin && (
          <>
            <button className="btn btn-primary btn-block" onClick={handleSave}>
              {saved ? '已保存 ✅' : '保存设置'}
            </button>
            {saveError && <div style={{color: '#e53e3e', fontSize: 13, marginTop: 8, textAlign: 'center'}}>{saveError}</div>}
          </>
        )}
        {!isAdmin && (
          <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', marginTop: 8 }}>
            💡 只有管理员可以修改宝宝信息
          </p>
        )}
      </div>

      {/* 成员管理（仅管理员可见） */}
      {isAdmin && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={18} /> 家庭成员管理
          </h3>

          {/* 现有成员列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {Object.entries(users)
              .sort((a, b) => (a[1].order ?? 999) - (b[1].order ?? 999))
              .map(([name, info]) => {
              const isSelf = name === userName;
              const isDragOver = dragOverKey === name;
              const RoleIcon = ROLE_ICONS[info.role] || Eye;
              return (
                <div
                  key={name}
                  draggable
                  onDragStart={() => { dragItem.current = name; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverKey(name); dragOverItem.current = name; }}
                  onDragLeave={() => { if (dragOverKey === name) setDragOverKey(null); }}
                  onDrop={handleDrop}
                  onDragEnd={() => { setDragOverKey(null); }}
                  className="record-item"
                  style={{
                    padding: '8px 0',
                    border: isDragOver ? '2px dashed var(--pink)' : '2px solid transparent',
                    borderRadius: 8,
                    transition: 'border 0.15s',
                    opacity: dragItem.current === name ? 0.4 : 1,
                    cursor: 'grab',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
                      <GripVertical size={16} />
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isSelf ? 'var(--pink-pale)' : 'var(--lavender-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 600,
                      color: isSelf ? 'var(--pink)' : 'var(--lavender)',
                    }}>
                      {name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {name} {isSelf && <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 400 }}>(当前)</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <RoleIcon size={12} color={info.role === 'admin' ? '#FFB8C6' : info.role === 'editor' ? '#D4C5F0' : '#B0B0B0'} />
                        <select
                          value={info.role}
                          onChange={e => handleChangeRole(name, e.target.value)}
                          style={{
                            border: '1px solid #F0E0E5', borderRadius: 6,
                            padding: '2px 6px', fontSize: 12,
                            background: 'white', color: 'var(--text)',
                          }}
                        >
                          {Object.entries(ROLES).map(([key, r]) => (
                            <option key={key} value={key}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {!isSelf && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveUser(name)}
                      style={{ padding: '4px 8px', fontSize: 11 }}
                    >
                      <UserMinus size={12} /> 移除
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 添加成员 */}
          <div style={{
            background: '#FFF9E6', border: '1px solid #FFE0A0',
            borderRadius: 'var(--radius-sm)', padding: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#B8860B' }}>
              <UserPlus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              添加家庭成员
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-input"
                type="text"
                placeholder="称呼（如：奶奶）"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                style={{ flex: 1, fontSize: 13, padding: '8px 10px' }}
              />
              <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value)}
                className="form-input"
                style={{ width: 100, fontSize: 13, padding: '8px 10px' }}
              >
                {Object.entries(ROLES).map(([key, r]) => (
                  <option key={key} value={key}>{r.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-sm btn-block" onClick={handleAddUser}>
              <UserPlus size={14} /> 添加成员
            </button>
            <p style={{ fontSize: 11, color: '#B8860B', marginTop: 6 }}>
              添加后，对方输入家庭码即可选择自己的身份进入
            </p>
          </div>
        </div>
      )}

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

      {isAdmin && (
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secondary btn-block"
            onClick={() => { setShowPasswordModal(true); setModalError(''); setModalPassword(''); setModalConfirmPwd(''); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Lock size={16} /> 修改管理员密码
          </button>
        </div>
      )}

      {/* 管理员密码弹窗 */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => { setShowPasswordModal(false); setModalError(''); }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            maxWidth: 360, width: '100%',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{
              fontFamily: 'var(--font-cute)', fontSize: 17,
              textAlign: 'center', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Lock size={18} /> 修改管理员密码
            </h3>

            <div className="form-group">
              <label className="form-label">新密码（4-6 位数字）</label>
              <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="输入新密码"
                value={modalPassword}
                onChange={e => setModalPassword(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && document.activeElement?.nextSibling?.focus()}
                style={{ fontSize: 18, letterSpacing: 2 }} autoFocus />
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">确认新密码</label>
              <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="再次输入新密码"
                value={modalConfirmPwd}
                onChange={e => setModalConfirmPwd(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                style={{ fontSize: 18, letterSpacing: 2 }} />
            </div>

            {modalError && <div className="pin-error">{modalError}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => { setShowPasswordModal(false); setModalError(''); setModalPassword(''); setModalConfirmPwd(''); }}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={handleSetPassword} disabled={modalPassword.length < 4}>
                保存密码
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 危险操作弹窗 */}
      {dangerModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => { setDangerModal(null); setDangerError(''); setDangerPwd(''); setDangerConfirm(''); }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            maxWidth: 380, width: '100%',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            {/* 清除数据 */}
            {dangerModal === 'clear' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 18, textAlign: 'center', marginBottom: 12, color: '#E53E3E' }}>
                  ⚠️ 清除所有数据
                </h3>
                <div style={{
                  background: '#FFF5F5', border: '1px solid #FED7D7',
                  borderRadius: 10, padding: 14, marginBottom: 16,
                  fontSize: 13, color: '#C53030', lineHeight: 1.7,
                }}>
                  此操作将<strong>删除以下所有数据</strong>，且不可恢复：
                  <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                    <li>📏 生长记录（身高/体重）</li>
                    <li>📷 照片记录</li>
                    <li>🏆 里程碑记录</li>
                    <li>💩 尿布记录</li>
                    <li>🍼 喂养记录</li>
                    <li>📋 每日待办、近期待办</li>
                  </ul>
                  <div style={{ marginTop: 8, color: '#38A169', fontWeight: 600 }}>
                    ✅ 以下内容<strong>保留</strong>：家庭码、宝宝档案（姓名/生日/性别）、家庭成员
                  </div>
                </div>
              </>
            )}
            {/* 删除家庭 */}
            {dangerModal === 'delete' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 18, textAlign: 'center', marginBottom: 12, color: '#E53E3E' }}>
                  ⛔ 删除家庭所有数据
                </h3>
                <div style={{
                  background: '#FFF5F5', border: '1px solid #FED7D7',
                  borderRadius: 10, padding: 14, marginBottom: 16,
                  fontSize: 13, color: '#C53030', lineHeight: 1.7,
                }}>
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>此操作将<strong>永久删除整个家庭</strong>的所有信息：</p>
                  <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                    <li>🔑 家庭码（此号码将无法再次使用）</li>
                    <li>👶 宝宝档案、家庭成员</li>
                    <li>📏 所有成长记录、照片、里程碑</li>
                    <li>🍼 所有喂养、尿布、待办数据</li>
                  </ul>
                  <div style={{
                    background: '#FFE0E0', borderRadius: 8, padding: 10,
                    fontWeight: 700, textAlign: 'center', fontSize: 14,
                  }}>
                    ⚠️ 数据无法找回，请确认！
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>
                    请输入 <strong style={{ color: '#E53E3E' }}>确认删除</strong> 以继续：
                  </label>
                  <input className="form-input" type="text" placeholder="输入「确认删除」"
                    value={dangerConfirm}
                    onChange={e => setDangerConfirm(e.target.value)}
                    style={{ textAlign: 'center', fontSize: 16, letterSpacing: 2 }} />
                </div>
              </>
            )}

            {/* 共通：管理员密码验证 */}
            <div style={{ marginTop: dangerModal === 'delete' ? 0 : 0 }}>
              <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 6 }}>
                🔑 请输入管理员密码以确认身份：
              </label>
              <input className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="管理员密码"
                value={dangerPwd}
                onChange={e => setDangerPwd(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleDangerConfirm()}
                style={{ fontSize: 20, letterSpacing: 3, marginBottom: 8 }} />
            </div>

            {dangerError && <div className="pin-error">{dangerError}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => { setDangerModal(null); setDangerError(''); setDangerPwd(''); setDangerConfirm(''); }}>
                取消
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }}
                onClick={handleDangerConfirm}
                disabled={dangerLoading || dangerPwd.length < 4 || (dangerModal === 'delete' && dangerConfirm !== '确认删除')}>
                {dangerLoading ? '处理中...' : dangerModal === 'clear' ? '确认清除' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        {isAdmin && (
          <>
            <button className="btn btn-danger btn-block btn-sm" style={{ marginTop: 12 }}
              onClick={() => { setDangerModal('clear'); setDangerPwd(''); setDangerError(''); }}>
              🗑️ 清除所有数据
            </button>
            <button className="btn btn-danger btn-block btn-sm" style={{ marginTop: 8, background: '#C53030' }}
              onClick={() => { setDangerModal('delete'); setDangerPwd(''); setDangerConfirm(''); setDangerError(''); }}>
              ⛔ 删除家庭所有数据
            </button>
          </>
        )}
      </div>
    </div>
  );
}
