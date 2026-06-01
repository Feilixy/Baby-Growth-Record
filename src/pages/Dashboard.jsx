import { useState, useEffect, useCallback } from 'react';
import { getProfile, getMilestones } from '../utils/storage';
import { getAge, todayStr } from '../utils/dateUtils';
import { getDiaperRecords } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(getProfile());
  const [age, setAge] = useState(null);
  const [diaperStats, setDiaperStats] = useState({ pee: 0, poop: 0, both: 0 });
  const [latestMilestone, setLatestMilestone] = useState(null);
  const navigate = useNavigate();

  const refresh = useCallback(() => {
    const p = getProfile();
    setProfile(p);
    if (p?.birthDate) {
      setAge(getAge(p.birthDate));
    }

    const today = todayStr();
    const allDiaper = getDiaperRecords().filter(r => r.date === today);
    const pee = allDiaper.filter(r => r.type === 'pee' || r.type === 'both').length;
    const poop = allDiaper.filter(r => r.type === 'poop' || r.type === 'both').length;
    setDiaperStats({ pee, poop });

    const milestones = getMilestones();
    setLatestMilestone(milestones.length > 0 ? milestones[0] : null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

      {/* Today stats */}
      <div className="today-section">
        <div className="today-title">📅 今天</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>💧</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>{diaperStats.pee}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>小便</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>💩</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>{diaperStats.poop}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>大便</div>
          </div>
        </div>
      </div>

      {/* Latest milestone */}
      {latestMilestone && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⭐</div>
          <div style={{ fontFamily: 'var(--font-cute)', fontSize: 16, marginBottom: 2 }}>
            最新里程碑
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--pink)' }}>
            {latestMilestone.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
            {latestMilestone.date}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="quick-actions">
        <button className="quick-action" onClick={() => navigate('/growth')}>
          <span className="qa-emoji">📏</span>
          <span>记录身高体重</span>
        </button>
        <button className="quick-action" onClick={() => navigate('/diaper')}>
          <span className="qa-emoji">🧷</span>
          <span>记录大小便</span>
        </button>
        <button className="quick-action" onClick={() => navigate('/photos')}>
          <span className="qa-emoji">📷</span>
          <span>添加照片</span>
        </button>
        <button className="quick-action" onClick={() => navigate('/milestones')}>
          <span className="qa-emoji">⭐</span>
          <span>记录里程碑</span>
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: 13 }}>
        用 <Heart size={14} style={{ color: '#FFB8C6', verticalAlign: 'middle' }} fill="#FFB8C6" /> 记录宝宝的每一个成长瞬间
      </div>
    </div>
  );
}
