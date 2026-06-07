import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGrowthRecords, addGrowthRecord, updateGrowthRecord, deleteGrowthRecord, getProfile } from '../utils/storage';
import { formatDate, todayStr } from '../utils/dateUtils';
import { usePin } from '../utils/PinContext';
import GrowthChart from '../components/GrowthChart';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = { date: '', height: '', weight: '' };

export default function Growth() {
  const { isAllowed } = usePin();
  const canEdit = isAllowed('editor');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [profile, setProfile] = useState(null);
  const [standardType, setStandardType] = useState('who');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([getGrowthRecords(), getProfile()]);
      setRecords(r);
      setProfile(p);
    } catch (e) {
      console.error('Growth 加载失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ date: r.date, height: String(r.height), weight: String(r.weight) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.date || !form.height || !form.weight) return;
    setSaving(true);
    const data = {
      date: form.date,
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
    };
    try {
      if (editing) {
        await updateGrowthRecord(editing.id, data);
      } else {
        await addGrowthRecord(data);
      }
      setShowForm(false);
      await refresh();
    } catch (e) {
      console.error('保存失败:', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条记录吗？')) return;
    try {
      await deleteGrowthRecord(id);
      await refresh();
    } catch (e) {
      console.error('删除失败:', e);
    }
  };

  const hasBirthDate = profile?.birthDate;
  const hasRecords = records.length >= 2;

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
        <h1 className="page-title"><span className="emoji">📏</span> 身高体重</h1>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={16} /> 记录
          </button>
        )}
      </div>

      {/* 未设置出生日期提示 */}
      {!hasBirthDate && records.length > 0 && (
        <div className="card" style={{
          textAlign: 'center', padding: 16, marginBottom: 12,
          background: '#FFF9E6', border: '1px solid #FFE0A0',
        }}>
          <p style={{ fontSize: 13, color: '#B8860B', margin: 0 }}>
            💡 前往 <span onClick={() => navigate('/settings')} style={{ color: '#B8860B', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>宝宝设置</span> 填写出生日期和性别，即可查看生长参考曲线
          </p>
        </div>
      )}

      {/* 参考标准切换按钮 */}
      {hasBirthDate && hasRecords && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <button
            className={`btn ${standardType === 'who' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStandardType('who')}
            style={{ fontSize: 12 }}
          >
            🌍 WHO 标准
          </button>
          <button
            className={`btn ${standardType === 'china' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStandardType('china')}
            style={{ fontSize: 12 }}
          >
            🇨🇳 中国卫健委
          </button>
        </div>
      )}

      {/* 生长曲线图 */}
      {hasBirthDate && hasRecords && (
        <GrowthChart
          records={records}
          birthDate={profile.birthDate}
          gender={profile.gender || 'girl'}
          standardType={standardType}
        />
      )}

      {/* 空状态 */}
      {records.length === 0 && (
        <div className="empty-state">
          <div className="icon">📏</div>
          <p>还没有身高体重记录，开始记录宝宝的成长吧</p>
          {canEdit && <button className="btn btn-primary" onClick={openAdd}>添加第一条记录</button>}
        </div>
      )}

      {/* 记录列表 */}
      {records.length > 0 && (
        <div className="card">
          {records.slice().reverse().map(r => (
            <div key={r.id} className="record-item">
              <div className="record-info">
                <div className="record-date">{formatDate(r.date)}</div>
                <div className="record-value">
                  身高 {r.height} cm · 体重 {r.weight} kg
                </div>
              </div>
              {canEdit && (
                <div className="record-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 模态表单 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editing ? '编辑记录' : '添加身高体重'} 📏
            </div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={form.date} max={todayStr()} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">身高 (cm)</label>
              <input className="form-input" type="number" step="0.1" placeholder="例如: 52.5" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">体重 (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="例如: 3.5" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : (editing ? '保存修改' : '添加记录')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
