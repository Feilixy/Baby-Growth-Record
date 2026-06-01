import { useState, useEffect, useCallback } from 'react';
import { getDiaperRecords, addDiaperRecord, deleteDiaperRecord } from '../utils/storage';
import { formatDate, formatTime, todayStr, nowTimeStr } from '../utils/dateUtils';
import { Plus, Trash2 } from 'lucide-react';

const typeOptions = [
  { key: 'pee', label: '小便 💧', emoji: '💧' },
  { key: 'poop', label: '大便 💩', emoji: '💩' },
  { key: 'both', label: '都有 🔄', emoji: '🔄' },
];

export default function Diaper() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [form, setForm] = useState({ date: todayStr(), time: nowTimeStr(), type: 'pee' });

  const refresh = useCallback(() => {
    setRecords(getDiaperRecords());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filteredRecords = records.filter(r => r.date === selectedDate);

  // Stats for selected date
  const peeCount = filteredRecords.filter(r => r.type === 'pee' || r.type === 'both').length;
  const poopCount = filteredRecords.filter(r => r.type === 'poop' || r.type === 'both').length;

  const openAdd = () => {
    setForm({ date: selectedDate, time: nowTimeStr(), type: 'pee' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.date || !form.time) return;
    addDiaperRecord(form);
    setShowForm(false);
    refresh();
  };

  const handleDelete = (id) => {
    deleteDiaperRecord(id);
    refresh();
  };

  const quickAdd = (type) => {
    addDiaperRecord({ date: selectedDate, time: nowTimeStr(), type });
    refresh();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><span className="emoji">🧷</span> 大小便记录</h1>
      </div>

      {/* Date selector */}
      <div className="card" style={{ textAlign: 'center' }}>
        <input
          className="form-input"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}
        />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>💧</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pink)' }}>{peeCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>小便次数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>💩</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pink)' }}>{poopCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>大便次数</div>
          </div>
        </div>
      </div>

      {/* Quick add buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {typeOptions.map(t => (
          <button key={t.key} className="btn btn-secondary" style={{ flex: 1 }}
            onClick={() => quickAdd(t.key)}>
            {t.emoji} {t.key === 'pee' ? '小便' : t.key === 'poop' ? '大便' : '都有'}
          </button>
        ))}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🧷</div>
          <p>当天暂无记录，点击上方按钮快速添加</p>
        </div>
      ) : (
        <div className="card">
          {filteredRecords.map(r => {
            const t = typeOptions.find(o => o.key === r.type);
            return (
              <div key={r.id} className="record-item">
                <div className="record-info">
                  <div className="record-date">{formatTime(r.time)}</div>
                </div>
                <div style={{ fontSize: 20 }}>{t?.emoji}</div>
                <div style={{ fontSize: 14, color: 'var(--text-light)', marginLeft: 8 }}>
                  {t?.label?.replace(/ .*$/, '')}
                </div>
                <div className="record-actions" style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual add */}
      <button className="btn btn-primary btn-block" onClick={openAdd} style={{ marginTop: 12 }}>
        <Plus size={16} /> 手动添加记录
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">添加大小便记录 🧷</div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">时间</label>
              <input className="form-input" type="time" value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {typeOptions.map(t => (
                  <button key={t.key}
                    className={`btn ${form.type === t.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setForm({ ...form, type: t.key })}>
                    {t.emoji} {t.key === 'pee' ? '小便' : t.key === 'poop' ? '大便' : '都有'}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSave}>保存</button>
          </div>
        </div>
      )}
    </div>
  );
}
