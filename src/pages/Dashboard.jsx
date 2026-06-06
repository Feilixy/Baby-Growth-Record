import { useState, useEffect, useCallback } from 'react';
import { getProfile, getMilestones, getDiaperRecords,
         getDailyTodos, addDailyTodo, updateDailyTodo, deleteDailyTodo,
         getUpcomingTodos, addUpcomingTodo, updateUpcomingTodo, deleteUpcomingTodo } from '../utils/storage';
import { getAge, todayStr, formatDate } from '../utils/dateUtils';
import { usePin } from '../utils/PinContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, X, Check } from 'lucide-react';

const PERIODS = [
  { key: 'morning', label: '🌅 上午' },
  { key: 'afternoon', label: '☀️ 下午' },
  { key: 'evening', label: '🌙 晚上' },
];
const MAX_PERIOD_ITEMS = 5;

export default function Dashboard() {
  const { isAllowed } = usePin();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceShow, setForceShow] = useState(false);
  const [age, setAge] = useState(null);
  const [diaperStats, setDiaperStats] = useState({ pee: 0, poop: 0 });
  const [milestones, setMilestones] = useState([]);
  const navigate = useNavigate();
  const canEdit = isAllowed('editor');

  // ─── 每日待办 ───
  const [dailyTodos, setDailyTodos] = useState([]);
  const [showAddDaily, setShowAddDaily] = useState(false);
  const [newDailyText, setNewDailyText] = useState('');
  const [newDailyPeriod, setNewDailyPeriod] = useState('morning');

  // ─── 近期待办 ───
  const [upcomingTodos, setUpcomingTodos] = useState([]);
  const [showAddUpcoming, setShowAddUpcoming] = useState(false);
  const [newUpcomingText, setNewUpcomingText] = useState('');
  const [newUpcomingDate, setNewUpcomingDate] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  const today = todayStr();
  const todayDisplay = formatDate(today);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 并行读取所有 Firestore 数据
      const [p, diaperRecords, milestones, dailyTodos, allUpcoming] = await Promise.all([
        getProfile(),
        getDiaperRecords(),
        getMilestones(),
        getDailyTodos(),
        getUpcomingTodos(),
      ]);

      setProfile(p);
      if (p?.birthDate) setAge(getAge(p.birthDate));
      else setAge(null);

      const todayDiaper = diaperRecords.filter(r => r.date === today);
      setDiaperStats({
        pee: todayDiaper.filter(r => r.type === 'pee' || r.type === 'both').length,
        poop: todayDiaper.filter(r => r.type === 'poop' || r.type === 'both').length,
      });

      setMilestones(milestones);
      setDailyTodos(dailyTodos);
      setUpcomingTodos(allUpcoming.filter(t => !t.done));
      setCompletedTodos(allUpcoming.filter(t => t.done));
    } catch (e) {
      console.error('Dashboard 加载失败:', e);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => { refresh(); }, [refresh]);

  // 最大等待 500ms 后强制显示页面（即使数据还在加载）
  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // ─── 每日待办 ───
  const handleAddDaily = async () => {
    if (!newDailyText.trim()) return;
    const periodItems = dailyTodos.filter(t => t.period === newDailyPeriod);
    if (periodItems.length >= MAX_PERIOD_ITEMS) return;
    const maxOrder = periodItems.reduce((m, t) => Math.max(m, t.order ?? 0), -1);
    try {
      const data = await addDailyTodo({
        text: newDailyText.trim(),
        period: newDailyPeriod,
        order: maxOrder + 1,
        lastCompletedDate: null,
      });
      setDailyTodos(prev => [...prev, data].sort((a, b) => a.order - b.order));
      setNewDailyText('');
      setShowAddDaily(false);
    } catch (e) {
      console.error('添加每日待办失败:', e);
    }
  };

  const toggleDailyTodo = async (id, lastCompletedDate) => {
    const newDate = lastCompletedDate === today ? null : today;
    try {
      await updateDailyTodo(id, { lastCompletedDate: newDate });
      setDailyTodos(prev => prev.map(t => t.id === id ? { ...t, lastCompletedDate: newDate } : t));
    } catch (e) {
      console.error('更新待办状态失败:', e);
    }
  };

  const handleDeleteDaily = async (id) => {
    try {
      await deleteDailyTodo(id);
      setDailyTodos(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error('删除待办失败:', e);
    }
  };

  // ─── 近期待办 ───
  const handleAddUpcoming = async () => {
    if (!newUpcomingText.trim()) return;
    const maxOrder = upcomingTodos.reduce((m, t) => Math.max(m, t.order ?? 0), -1);
    try {
      const data = await addUpcomingTodo({
        text: newUpcomingText.trim(),
        order: maxOrder + 1,
        targetDate: newUpcomingDate || null,
        done: false,
        completedAt: null,
      });
      setUpcomingTodos(prev => [...prev, data].sort((a, b) => {
        if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
        if (a.targetDate) return -1;
        if (b.targetDate) return 1;
        return a.order - b.order;
      }));
      setNewUpcomingText('');
      setNewUpcomingDate('');
      setShowAddUpcoming(false);
    } catch (e) {
      console.error('添加近期待办失败:', e);
    }
  };

  const completeUpcomingTodo = (id) => {
    const todo = upcomingTodos.find(t => t.id === id);
    setRemovingId(id);
    setTimeout(async () => {
      try {
        await updateUpcomingTodo(id, { done: true, completedAt: today });
        setUpcomingTodos(prev => prev.filter(t => t.id !== id));
        if (todo) {
          setCompletedTodos(prev => [...prev, { ...todo, done: true, completedAt: today }]);
        }
      } catch (e) {
        console.error('完成待办失败:', e);
      }
      setRemovingId(null);
    }, 350);
  };

  const handleDeleteUpcoming = async (id) => {
    try {
      await deleteUpcomingTodo(id);
      setUpcomingTodos(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error('删除待办失败:', e);
    }
  };

  const refreshCompleted = async () => {
    try {
      const all = await getUpcomingTodos();
      setCompletedTodos(all.filter(t => t.done));
    } catch {}
  };

  // 没有任何缓存时首次加载才显示骨架屏，最多等 500ms
  if (!forceShow && loading && !profile && !milestones.length && !dailyTodos.length && !upcomingTodos.length) {
    return (
      <div className="loading-screen fade-in">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fade-in">
        <div className="empty-state">
          <div className="icon">👶</div>
          <h2 style={{ fontFamily: 'var(--font-cute)', fontSize: 22, marginBottom: 8 }}>欢迎来到宝宝成长记录</h2>
          <p>请先设置宝宝信息，开始记录成长的每一个美好瞬间 💕</p>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>
            开始设置
          </button>
        </div>
      </div>
    );
  }

  // ─── 渲染每日待办 ───
  const renderDailyTodos = () => {
    const getPeriodItems = (periodKey) =>
      dailyTodos.filter(t => t.period === periodKey).sort((a, b) => a.order - b.order);

    return (
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          ☀️ 每日待办事项
        </h3>

        {PERIODS.map(({ key, label }) => {
          const items = getPeriodItems(key);
          return (
            <div key={key} style={{ marginBottom: items.length > 0 ? 12 : 0 }}>
              <div style={{
                borderTop: '1px solid #E8DCE0', paddingTop: 8, marginBottom: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#B8860B' }}>{label}</span>
              </div>
              {items.map(item => {
                const done = item.lastCompletedDate === today;
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                  }}>
                    <span
                      onClick={() => toggleDailyTodo(item.id, item.lastCompletedDate)}
                      style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                      {done ? '☑️' : '☐'}
                    </span>
                    <span style={{
                      flex: 1, fontSize: 14,
                      textDecoration: done ? 'line-through' : 'none',
                      color: done ? '#B0B0B0' : 'var(--text)',
                    }}>{item.text}</span>
                    {canEdit && (
                      <span onClick={() => handleDeleteDaily(item.id)}
                        style={{ cursor: 'pointer', color: '#CCC', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</span>
                    )}
                  </div>
                );
              })}
              {items.length === 0 && (
                <div style={{ fontSize: 13, color: '#CCC', padding: '2px 0 6px' }}>暂无待办</div>
              )}
            </div>
          );
        })}

        {canEdit && !showAddDaily && (
          <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 4 }}
            onClick={() => { setShowAddDaily(true); setNewDailyText(''); setNewDailyPeriod('morning'); }}>
            <Plus size={14} /> 添加待办
          </button>
        )}

        {canEdit && showAddDaily && (
          <div style={{ marginTop: 8, padding: 12, background: '#FFF9E6', borderRadius: 10, border: '1px solid #FFE0A0' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {PERIODS.map(({ key, label }) => (
                <button key={key}
                  onClick={() => setNewDailyPeriod(key)}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 8, border: 'none',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: newDailyPeriod === key ? '#FFB8C6' : '#F5F0F2',
                    color: newDailyPeriod === key ? 'white' : '#999',
                  }}>
                  {label.replace(/^.{2}/, '')}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" type="text" placeholder="输入待办内容"
                value={newDailyText}
                onChange={e => setNewDailyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDaily()}
                style={{ flex: 1, fontSize: 13, padding: '7px 10px' }}
                autoFocus />
              <button className="btn btn-primary btn-sm" onClick={handleAddDaily}
                disabled={!newDailyText.trim() || getPeriodItems(newDailyPeriod).length >= MAX_PERIOD_ITEMS}>
                <Check size={14} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddDaily(false)}>
                <X size={14} />
              </button>
            </div>
            {getPeriodItems(newDailyPeriod).length >= MAX_PERIOD_ITEMS && (
              <div style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>该时段已达上限（{MAX_PERIOD_ITEMS} 项）</div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: '#CCC', textAlign: 'center', marginTop: 10 }}>
          每日待办完成后不会消失，次日自动重置
        </div>
      </div>
    );
  };

  // ─── 渲染近期待办 ───
  const renderUpcomingTodos = () => {
    const sorted = [...upcomingTodos].sort((a, b) => {
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;
      return a.order - b.order;
    });

    return (
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          📋 近期待办提醒
        </h3>

        {sorted.length > 0 ? (
          <div>
            {sorted.map(item => {
              const isRemoving = removingId === item.id;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                  borderBottom: '1px solid #F5F0F2',
                  opacity: isRemoving ? 0 : 1,
                  transform: isRemoving ? 'translateX(80px)' : 'translateX(0)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                }}>
                  <span onClick={() => completeUpcomingTodo(item.id)}
                    style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                    ☐
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>
                    {item.text}
                  </span>
                  <span style={{ fontSize: 11, color: '#B8860B', flexShrink: 0 }}>
                    {item.targetDate ? formatDate(item.targetDate) : '待定'}
                  </span>
                  {canEdit && (
                    <span onClick={() => handleDeleteUpcoming(item.id)}
                      style={{ cursor: 'pointer', color: '#CCC', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#CCC', padding: '8px 0', textAlign: 'center' }}>
            暂无待办事项 🎉
          </div>
        )}

        {canEdit && !showAddUpcoming && (
          <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 8 }}
            onClick={() => { setShowAddUpcoming(true); setNewUpcomingText(''); setNewUpcomingDate(''); }}>
            <Plus size={14} /> 添加待办
          </button>
        )}

        {canEdit && showAddUpcoming && (
          <div style={{ marginTop: 8, padding: 12, background: '#FFF9E6', borderRadius: 10, border: '1px solid #FFE0A0' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="form-input" type="text" placeholder="输入待办事项"
                value={newUpcomingText}
                onChange={e => setNewUpcomingText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddUpcoming()}
                style={{ flex: 1, fontSize: 13, padding: '7px 10px' }}
                autoFocus />
              <button className="btn btn-primary btn-sm" onClick={handleAddUpcoming}
                disabled={!newUpcomingText.trim()}>
                <Check size={14} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddUpcoming(false)}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#B8860B', flexShrink: 0 }}>📅 完成日期</span>
              <input type="date" className="form-input"
                value={newUpcomingDate}
                onChange={e => setNewUpcomingDate(e.target.value)}
                style={{ flex: 1, fontSize: 13, padding: '7px 10px' }} />
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => { setShowCompleted(true); refreshCompleted(); }}
            style={{
              background: 'none', border: 'none', color: 'var(--pink)',
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
            }}>
            查看已完成事项
          </button>
        </div>
      </div>
    );
  };

  // ─── 渲染时间轴 ───
  const renderTimeline = () => {
    const showMilestones = milestones.slice(0, 5);
    return (
      <div className="card" style={{ marginTop: 12, cursor: 'pointer' }} onClick={() => navigate('/milestones')}>
        <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          🌱 宝宝成长重要时刻
        </h3>
        {showMilestones.length > 0 ? (
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            {/* 竖线 */}
            <div style={{
              position: 'absolute', left: 8, top: 0, bottom: 0,
              width: 2, background: '#FFE0E8', borderRadius: 1,
            }} />
            {showMilestones.map((item, idx) => (
              <div key={item.id} style={{
                position: 'relative', paddingBottom: idx < showMilestones.length - 1 ? 16 : 0,
              }}>
                <div style={{
                  position: 'absolute', left: -16, top: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--pink)', border: '2px solid white',
                  boxShadow: '0 0 0 2px #FFB8C6',
                }} />
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{item.date}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{item.title}</div>
              </div>
            ))}

          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#CCC', textAlign: 'center', padding: '8px 0' }}>
            还没有里程碑记录，去记录第一个吧 🎉
          </div>
        )}
      </div>
    );
  };

  // ─── 主渲染 ───
  return (
    <div className="fade-in">
      {/* Baby info header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="dashboard-baby-name">
          {profile.name} <span style={{ fontSize: 24 }}>🌸</span>
        </div>
        {age && <div className="dashboard-baby-age">
          {age.text} · {profile.gender === 'girl' ? '小公主' : '小王子'} 💕
        </div>}
      </div>

      {/* 1️⃣ 今日总结 */}
      <div className="today-section">
        <div className="today-title">📅 今日总结 · {todayDisplay}</div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>💧</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pink)' }}>{diaperStats.pee}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>小便</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>💩</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--pink)' }}>{diaperStats.poop}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>大便</div>
          </div>
        </div>
      </div>

      {/* 2️⃣ 每日待办事项 */}
      {renderDailyTodos()}

      {/* 3️⃣ 近期待办提醒 */}
      {renderUpcomingTodos()}

      {/* 4️⃣ 宝宝成长关键节点时间轴 */}
      {renderTimeline()}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: 13 }}>
        用 <Heart size={14} style={{ color: '#FFB8C6', verticalAlign: 'middle' }} fill="#FFB8C6" /> 记录宝宝的每一个成长瞬间
      </div>

      {/* 已完成事项弹窗 — 顶层渲染 */}
      {showCompleted && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowCompleted(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            maxWidth: 360, width: '100%', maxHeight: '70vh', overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{
              fontFamily: 'var(--font-cute)', fontSize: 17,
              textAlign: 'center', marginBottom: 16,
            }}>
              ✅ 已完成的事项
            </h3>
            {completedTodos.length > 0 ? (
              <div>
                {completedTodos.map((item, idx) => (
                  <div key={item.id || idx} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 0', color: '#B0B0B0',
                    borderBottom: '1px solid #F5F0F2',
                  }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>☑️</span>
                    <span style={{ flex: 1, fontSize: 14, textDecoration: 'line-through' }}>
                      {item.text || '(已删除)'}
                    </span>
                    {item.completedAt && (
                      <span style={{ fontSize: 11, color: '#CCC', flexShrink: 0 }}>
                        {formatDate(item.completedAt === today ? today : item.completedAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#CCC', textAlign: 'center', padding: 20 }}>
                还没有完成的事项
              </div>
            )}
            <button className="btn btn-secondary btn-block btn-sm" style={{ marginTop: 16 }}
              onClick={() => setShowCompleted(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
