import { useState, useEffect, useCallback } from 'react';
import { getGrowthRecords, addGrowthRecord, updateGrowthRecord, deleteGrowthRecord } from '../utils/storage';
import { formatDate } from '../utils/dateUtils';
import GrowthChart from '../components/GrowthChart';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = { date: '', height: '', weight: '' };

export default function Growth() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = useCallback(() => {
    setRecords(getGrowthRecords());
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

  const handleSave = () => {
    if (!form.date || !form.height || !form.weight) return;
    const data = {
      date: form.date,
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
    };
    if (editing) {
      updateGrowthRecord(editing.id, data);
    } else {
      addGrowthRecord(data);
    }
    setShowForm(false);
    refresh();
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除这条记录吗？')) {
      deleteGrowthRecord(id);
      refresh();
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><span className="emoji">📏</span> 身高体重</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={16} /> 记录
        </button>
      </div>

      {records.length >= 2 && <GrowthChart records={records} />}

      {records.length === 0 && (
        <div className="empty-state">
          <div className="icon">📏</div>
          <p>还没有身高体重记录，开始记录宝宝的成长吧</p>
          <button className="btn btn-primary" onClick={openAdd}>添加第一条记录</button>
        </div>
      )}

      <div className="card">
        {records.slice().reverse().map(r => (
          <div key={r.id} className="record-item">
            <div className="record-info">
              <div className="record-date">{formatDate(r.date)}</div>
              <div className="record-value">
                身高 {r.height} cm · 体重 {r.weight} kg
              </div>
            </div>
            <div className="record-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                <Pencil size={14} />
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editing ? '编辑记录' : '添加身高体重'} 📏
            </div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">身高 (cm)</label>
              <input className="form-input" type="number" step="0.1" placeholder="例如: 52.5" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">体重 (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="例如: 3.5" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSave}>
              {editing ? '保存修改' : '添加记录'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
