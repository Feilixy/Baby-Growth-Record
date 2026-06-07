import { useState, useEffect, useCallback } from 'react';
import {
  getFeedingRecords, addFeedingRecord, deleteFeedingRecord,
  getDiaperRecords, addDiaperRecord, deleteDiaperRecord,
} from '../utils/storage';
import { formatTime, todayStr, nowTimeStr } from '../utils/dateUtils';
import { usePin } from '../utils/PinContext';
import FeedingTrendChart from '../components/FeedingTrendChart';
import DiaperTrendChart from '../components/DiaperTrendChart';
import { Plus, Trash2 } from 'lucide-react';

// ─── Feeding constants ────────────────────────────────────

const feedingTypes = [
  { key: 'breast', label: '🤱 母乳' },
  { key: 'formula', label: '🍼 奶粉' },
  { key: 'solid', label: '🥣 辅食' },
];

const feedingTypeLabels = {
  breast: '🤱 母乳',
  formula: '🍼 奶粉',
  solid: '🥣 辅食',
};

// ─── Excretion constants ──────────────────────────────────

const excretionTypes = [
  { key: 'pee', label: '💧 小便' },
  { key: 'poop', label: '💩 大便' },
  { key: 'change', label: '🧻 换尿布' },
];

const excretionTypeLabels = {
  pee: '💧 小便',
  poop: '💩 大便',
  change: '🧻 换尿布',
};

// ─── Component ────────────────────────────────────────────

export default function Diary() {
  const { isAllowed } = usePin();
  const canEdit = isAllowed('editor');
  const [loading, setLoading] = useState(true);

  // Feeding state
  const [feedingRecords, setFeedingRecords] = useState([]);
  const [feedingDate, setFeedingDate] = useState(todayStr());
  const [showFeedingForm, setShowFeedingForm] = useState(false);
  const [savingFeeding, setSavingFeeding] = useState(false);
  const [feedingForm, setFeedingForm] = useState({
    date: todayStr(), time: nowTimeStr(), type: 'breast', amount: '', food: '', duration: '',
  });

  // Excretion state
  const [excretionRecords, setExcretionRecords] = useState([]);
  const [excretionDate, setExcretionDate] = useState(todayStr());
  const [showExcretionForm, setShowExcretionForm] = useState(false);
  const [savingExcretion, setSavingExcretion] = useState(false);
  const [excretionForm, setExcretionForm] = useState({
    date: todayStr(), time: nowTimeStr(), type: 'pee',
  });

  // ─── Data loading ───────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, d] = await Promise.all([
        getFeedingRecords(),
        getDiaperRecords(),
      ]);
      setFeedingRecords(f);
      setExcretionRecords(d);
    } catch (e) {
      console.error('日记加载失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Feeding helpers ────────────────────────────────────

  const filteredFeeding = feedingRecords.filter(r => r.date === feedingDate);
  const feedingSummary = {
    breast: filteredFeeding.filter(r => r.type === 'breast').length,
    breastDuration: filteredFeeding
      .filter(r => r.type === 'breast')
      .reduce((s, r) => s + (r.duration || 0), 0),
    formula: filteredFeeding.filter(r => r.type === 'formula').length,
    formulaMl: filteredFeeding
      .filter(r => r.type === 'formula')
      .reduce((s, r) => s + (r.amount || 0), 0),
    solid: filteredFeeding.filter(r => r.type === 'solid').length,
  };

  const handleSaveFeeding = async () => {
    if (!feedingForm.date || !feedingForm.time) return;
    setSavingFeeding(true);
    try {
      const data = {
        date: feedingForm.date,
        time: feedingForm.time,
        type: feedingForm.type,
      };
      if (feedingForm.type === 'breast') {
        data.duration = parseInt(feedingForm.duration) || 0;
      }
      if (feedingForm.type === 'formula') {
        data.amount = parseFloat(feedingForm.amount) || 0;
      }
      if (feedingForm.type === 'solid') {
        data.food = feedingForm.food.trim();
      }
      await addFeedingRecord(data);
      setShowFeedingForm(false);
      setFeedingForm({ date: todayStr(), time: nowTimeStr(), type: 'breast', amount: '', food: '', duration: '' });
      // Merge the new record in
      const r = await getFeedingRecords();
      setFeedingRecords(r);
    } catch (e) {
      console.error('保存喂养记录失败:', e);
    }
    setSavingFeeding(false);
  };

  const handleDeleteFeeding = async (id) => {
    try {
      await deleteFeedingRecord(id);
      const r = await getFeedingRecords();
      setFeedingRecords(r);
    } catch (e) {
      console.error('删除喂养记录失败:', e);
    }
  };

  // ─── Excretion helpers ──────────────────────────────────

  const filteredExcretion = excretionRecords.filter(r => r.date === excretionDate);
  const excretionSummary = {
    pee: filteredExcretion.filter(r => r.type === 'pee' || r.type === 'both').length,
    poop: filteredExcretion.filter(r => r.type === 'poop' || r.type === 'both').length,
    change: filteredExcretion.filter(r => r.type === 'change').length,
  };

  const quickAddExcretion = async (type) => {
    try {
      await addDiaperRecord({ date: excretionDate, time: nowTimeStr(), type });
      const r = await getDiaperRecords();
      setExcretionRecords(r);
    } catch (e) {
      console.error('快速添加排泄记录失败:', e);
    }
  };

  const handleSaveExcretion = async () => {
    if (!excretionForm.date || !excretionForm.time) return;
    setSavingExcretion(true);
    try {
      await addDiaperRecord(excretionForm);
      setShowExcretionForm(false);
      setExcretionForm({ date: todayStr(), time: nowTimeStr(), type: 'pee' });
      const r = await getDiaperRecords();
      setExcretionRecords(r);
    } catch (e) {
      console.error('保存排泄记录失败:', e);
    }
    setSavingExcretion(false);
  };

  const handleDeleteExcretion = async (id) => {
    try {
      await deleteDiaperRecord(id);
      const r = await getDiaperRecords();
      setExcretionRecords(r);
    } catch (e) {
      console.error('删除排泄记录失败:', e);
    }
  };

  // ─── Form reset helpers ─────────────────────────────────

  const openFeedingAdd = (type) => {
    setFeedingForm({ date: feedingDate, time: nowTimeStr(), type: type || 'breast', amount: '', food: '', duration: '' });
    setShowFeedingForm(true);
  };

  const openExcretionAdd = () => {
    setExcretionForm({ date: excretionDate, time: nowTimeStr(), type: 'pee' });
    setShowExcretionForm(true);
  };

  // ─── Render ─────────────────────────────────────────────

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
        <h1 className="page-title"><span className="emoji">📔</span> 日记</h1>
      </div>

      {/* ───── Feeding Section ───── */}
      <div className="card" style={{ marginBottom: 12, background: '#FFF8F0' }}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 18, margin: 0 }}>
          🍼 喂养
        </h3>
      </div>

          <FeedingTrendChart records={feedingRecords} />

          {/* Date selector */}
          <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
            <input
              className="form-input"
              type="date"
              value={feedingDate}
              onChange={e => setFeedingDate(e.target.value)}
              max={todayStr()}
              style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}
            />
            {/* Daily summary */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '4px 10px', background: '#FFF0F0', borderRadius: 10, minWidth: 70 }}>
                <div style={{ fontSize: 22 }}>🤱</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>{feedingSummary.breast}</div>
                <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                  母乳{feedingSummary.breast > 0 && feedingSummary.breastDuration > 0 ? ` (${feedingSummary.breastDuration}分钟)` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 10px', background: '#F0F4FF', borderRadius: 10, minWidth: 70 }}>
                <div style={{ fontSize: 22 }}>🍼</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#5B9BD5' }}>{feedingSummary.formula}</div>
                <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                  奶粉{feedingSummary.formula > 0 ? ` (${feedingSummary.formulaMl}ml)` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 10px', background: '#F0FFF0', borderRadius: 10, minWidth: 70 }}>
                <div style={{ fontSize: 22 }}>🥣</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#6BAF6B' }}>{feedingSummary.solid}</div>
                <div style={{ fontSize: 10, color: 'var(--text-light)' }}>辅食</div>
              </div>
            </div>
          </div>

          {/* Quick add buttons */}
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {feedingTypes.map(t => (
                <button key={t.key} className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => openFeedingAdd(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Feeding records list */}
          {filteredFeeding.length === 0 ? (
            <div className="empty-state" style={{ marginBottom: 12 }}>
              <div className="icon">🍼</div>
              <p>当天暂无喂养记录，点击上方按钮快速添加</p>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 12 }}>
              {filteredFeeding.map(r => (
                <div key={r.id} className="record-item">
                  <div className="record-info">
                    <div className="record-date">{formatTime(r.time)}</div>
                  </div>
                  <span style={{ fontSize: 14 }}>
                    {feedingTypeLabels[r.type] || r.type}
                    {r.type === 'formula' && r.amount ? ` ${r.amount}ml` : ''}
                    {r.type === 'solid' && r.food ? `（${r.food}）` : ''}
                    {r.type === 'breast' && r.duration ? ` ${r.duration}分钟` : ''}
                  </span>
                  <div className="record-actions">
                    {canEdit && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFeeding(r.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manual add feeding */}
          {canEdit && (
            <button className="btn btn-primary btn-block" onClick={openFeedingAdd} style={{ marginTop: 0, marginBottom: 16 }}>
              <Plus size={16} /> 添加喂养记录
            </button>
          )}
      {/* ───── Excretion Section ───── */}
      <div className="card" style={{ marginBottom: 12, background: '#F5FFFA' }}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 18, margin: 0 }}>
          💩 排泄
        </h3>
      </div>

          <DiaperTrendChart records={excretionRecords} />

          {/* Date selector */}
          <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
            <input
              className="form-input"
              type="date"
              value={excretionDate}
              onChange={e => setExcretionDate(e.target.value)}
              max={todayStr()}
              style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>💧</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pink)' }}>{excretionSummary.pee}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>小便</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>💩</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pink)' }}>{excretionSummary.poop}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>大便</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>🧻</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--pink)' }}>{excretionSummary.change}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>换尿布</div>
              </div>
            </div>
          </div>

          {/* Quick add buttons */}
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {excretionTypes.map(t => (
                <button key={t.key} className="btn btn-secondary" style={{ flex: 1 }}
                  onClick={() => quickAddExcretion(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Excretion records list */}
          {filteredExcretion.length === 0 ? (
            <div className="empty-state" style={{ marginBottom: 12 }}>
              <div className="icon">💩</div>
              <p>当天暂无排泄记录，点击上方按钮快速添加</p>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 12 }}>
              {filteredExcretion.map(r => {
                const t = excretionTypes.find(o => o.key === r.type);
                if (!t && r.type === 'both') {
                  return (
                    <div key={r.id} className="record-item">
                      <div className="record-info">
                        <div className="record-date">{formatTime(r.time)}</div>
                      </div>
                      <span style={{ fontSize: 14 }}>🔄 都有</span>
                      <div className="record-actions">
                        {canEdit && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteExcretion(r.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={r.id} className="record-item">
                    <div className="record-info">
                      <div className="record-date">{formatTime(r.time)}</div>
                    </div>
                    <span style={{ fontSize: 14 }}>{excretionTypeLabels[r.type] || r.type}</span>
                    <div className="record-actions">
                      {canEdit && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteExcretion(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual add excretion */}
          {canEdit && (
            <button className="btn btn-primary btn-block" onClick={openExcretionAdd} style={{ marginTop: 0 }}>
              <Plus size={16} /> 添加排泄记录
            </button>
          )}
      {/* ───── Feeding Modal ───── */}
      {canEdit && showFeedingForm && (
        <div className="modal-overlay" onClick={() => setShowFeedingForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🍼 添加喂养记录</div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={feedingForm.date}
                max={todayStr()}
                onChange={e => setFeedingForm({ ...feedingForm, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">时间</label>
              <input className="form-input" type="time" value={feedingForm.time}
                onChange={e => setFeedingForm({ ...feedingForm, time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {feedingTypes.map(t => (
                  <button key={t.key}
                    className={`btn ${feedingForm.type === t.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setFeedingForm({ ...feedingForm, type: t.key, amount: '', food: '' })}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {feedingForm.type === 'breast' && (
              <div className="form-group">
                <label className="form-label">喂养时长 (分钟)</label>
                <input className="form-input" type="number" min="0" step="1"
                  value={feedingForm.duration}
                  onChange={e => setFeedingForm({ ...feedingForm, duration: e.target.value })}
                  placeholder="请输入分钟数" />
              </div>
            )}
            {feedingForm.type === 'formula' && (
              <div className="form-group">
                <label className="form-label">奶粉量 (ml)</label>
                <input className="form-input" type="number" min="0" step="10"
                  value={feedingForm.amount}
                  onChange={e => setFeedingForm({ ...feedingForm, amount: e.target.value })}
                  placeholder="请输入毫升数" />
              </div>
            )}
            {feedingForm.type === 'solid' && (
              <div className="form-group">
                <label className="form-label">辅食内容</label>
                <input className="form-input" type="text"
                  value={feedingForm.food}
                  onChange={e => setFeedingForm({ ...feedingForm, food: e.target.value })}
                  placeholder="如：南瓜泥、苹果泥" />
              </div>
            )}
            <button className="btn btn-primary btn-block"
              onClick={handleSaveFeeding}
              disabled={savingFeeding}>
              {savingFeeding ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* ───── Excretion Modal ───── */}
      {canEdit && showExcretionForm && (
        <div className="modal-overlay" onClick={() => setShowExcretionForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title"> 添加排泄记录</div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={excretionForm.date}
                max={todayStr()}
                onChange={e => setExcretionForm({ ...excretionForm, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">时间</label>
              <input className="form-input" type="time" value={excretionForm.time}
                onChange={e => setExcretionForm({ ...excretionForm, time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">类型</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {excretionTypes.map(t => (
                  <button key={t.key}
                    className={`btn ${excretionForm.type === t.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setExcretionForm({ ...excretionForm, type: t.key })}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-block"
              onClick={handleSaveExcretion}
              disabled={savingExcretion}>
              {savingExcretion ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
