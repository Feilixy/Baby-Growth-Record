import { useState, useEffect, useCallback } from 'react';
import { getMilestones, addMilestone, deleteMilestone } from '../utils/storage';
import { formatDate } from '../utils/dateUtils';
import { milestoneCategories, defaultMilestoneSuggestions } from '../data/defaultMilestones';
import { Plus, Trash2 } from 'lucide-react';

export default function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: '', title: '', category: 'other', note: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const m = await getMilestones();
      setMilestones(m);
    } catch (e) {
      console.error('Milestones 加载失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openAdd = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      title: '',
      category: 'other',
      note: '',
    });
    setShowForm(true);
  };

  const selectSuggestion = (s) => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      title: s.title,
      category: s.category,
      note: '',
    });
  };

  const handleSave = async () => {
    if (!form.date || !form.title.trim()) return;
    setSaving(true);
    try {
      await addMilestone(form);
      setShowForm(false);
      await refresh();
    } catch (e) {
      console.error('保存失败:', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条里程碑吗？')) return;
    try {
      await deleteMilestone(id);
      await refresh();
    } catch (e) {
      console.error('删除失败:', e);
    }
  };

  const getCategory = (key) => milestoneCategories.find(c => c.key === key);

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
        <h1 className="page-title"><span className="emoji">⭐</span> 成长里程碑</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={16} /> 记录
        </button>
      </div>

      {milestones.length === 0 && (
        <div className="empty-state">
          <div className="icon">⭐</div>
          <p>还没有里程碑记录，记录宝宝的每一个重要时刻</p>
          <button className="btn btn-primary" onClick={openAdd}>添加第一个里程碑</button>
        </div>
      )}

      <div className="timeline">
        {milestones.map(m => {
          const cat = getCategory(m.category);
          return (
            <div key={m.id} className="timeline-item">
              <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {cat?.emoji || '📝'} {m.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                      {formatDate(m.date)}
                      {cat && <span className={`badge ${m.category === 'first' ? 'badge-pink' : m.category === 'motor' ? 'badge-lavender' : m.category === 'language' ? 'badge-peach' : ''}`} style={{ marginLeft: 8 }}>
                        {cat.label}
                      </span>}
                    </div>
                    {m.note && <p style={{ fontSize: 14, marginTop: 6, color: 'var(--text)' }}>{m.note}</p>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">记录里程碑 ⭐</div>

            {/* Suggestions */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>快速选择：</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {defaultMilestoneSuggestions.map(s => (
                  <button key={s.title} className="badge badge-pink" style={{ border: 'none', cursor: 'pointer', fontSize: 13 }}
                    onClick={() => selectSuggestion(s)}>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">里程碑标题</label>
              <input className="form-input" type="text" placeholder="例如: 第一次翻身" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">类别</label>
              <select className="form-input" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {milestoneCategories.map(c => (
                  <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">备注（可选）</label>
              <textarea className="form-input" placeholder="记录更多细节..."
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存里程碑'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
