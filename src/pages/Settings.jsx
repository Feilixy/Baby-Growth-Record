import { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile } from '../utils/storage';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [profile, setProfile] = useState(getProfile());
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    gender: 'girl',
  });
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setProfile(p);
      setForm({ name: p.name, birthDate: p.birthDate, gender: p.gender || 'girl' });
    }
  }, []);

  const handleSave = () => {
    if (!form.name.trim() || !form.birthDate) return;
    saveProfile(form);
    setProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
      </div>

      {profile && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 12 }}>
            📊 数据说明
          </h3>
          <ul style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 2, paddingLeft: 16 }}>
            <li>所有数据保存在浏览器中</li>
            <li>更换浏览器或清除缓存会导致数据丢失</li>
            <li>照片过多可能超出存储限制（约5MB）</li>
            <li>建议定期备份重要数据</li>
          </ul>
          <button className="btn btn-danger btn-block btn-sm" style={{ marginTop: 12 }}
            onClick={() => {
              if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
                localStorage.clear();
                setProfile(null);
                navigate('/');
                window.location.reload();
              }
            }}>
            清除所有数据
          </button>
        </div>
      )}
    </div>
  );
}
