import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatDate } from '../utils/dateUtils';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  // Access full data from the first payload item
  const data = payload[0]?.payload;
  const formulaMl = data?.formula_ml || 0;
  const breastDuration = data?.breast_duration || 0;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: 'none',
      boxShadow: '0 2px 12px rgba(180,160,200,0.25)',
      padding: '10px 14px',
      fontSize: 12,
      lineHeight: 1.8,
      minWidth: 160,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b5b7b', fontSize: 13 }}>
        📅 {label}
      </div>
      {payload.map((entry, idx) => {
        let suffix = ' 次';
        if (entry.dataKey === 'formula') suffix = ` 次 (共 ${formulaMl} ml)`;
        if (entry.dataKey === 'breast') suffix = ` 次 (共 ${breastDuration} 分钟)`;
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: entry.color, flexShrink: 0,
            }} />
            <span>{entry.name}：<strong>{entry.value}</strong>{suffix}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function FeedingTrendChart({ records }) {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const dailyMap = {};
    records.forEach(r => {
      if (!dailyMap[r.date]) {
        dailyMap[r.date] = { breast: 0, breast_duration: 0, formula: 0, formula_ml: 0, solid: 0 };
      }
      if (r.type === 'breast') {
        dailyMap[r.date].breast++;
        dailyMap[r.date].breast_duration += r.duration || 0;
      }
      if (r.type === 'formula') {
        dailyMap[r.date].formula++;
        dailyMap[r.date].formula_ml += r.amount || 0;
      }
      if (r.type === 'solid') dailyMap[r.date].solid++;
    });

    const daily = Object.entries(dailyMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const daysSpan = daily.length;

    if (daysSpan > 60) {
      const weeklyMap = {};
      daily.forEach(d => {
        const dt = new Date(d.date);
        const dayOfWeek = dt.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(dt);
        monday.setDate(dt.getDate() - diff);
        const weekKey = formatDate(monday.toISOString().split('T')[0]);
        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { breast: 0, breast_duration: 0, formula: 0, formula_ml: 0, solid: 0, days: 0 };
        weeklyMap[weekKey].breast += d.breast;
        weeklyMap[weekKey].breast_duration += d.breast_duration;
        weeklyMap[weekKey].formula += d.formula;
        weeklyMap[weekKey].formula_ml += d.formula_ml;
        weeklyMap[weekKey].solid += d.solid;
        weeklyMap[weekKey].days++;
      });
      return Object.entries(weeklyMap)
        .map(([week, counts]) => ({
          date: week,
          breast: Math.round((counts.breast / counts.days) * 10) / 10,
          breast_duration: Math.round(counts.breast_duration / counts.days),
          formula: Math.round((counts.formula / counts.days) * 10) / 10,
          formula_ml: Math.round(counts.formula_ml / counts.days),
          solid: Math.round((counts.solid / counts.days) * 10) / 10,
          label: `~${week}`,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    if (daysSpan > 30) {
      const weeklyMap = {};
      daily.forEach(d => {
        const dt = new Date(d.date);
        const dayOfWeek = dt.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(dt);
        monday.setDate(dt.getDate() - diff);
        const weekKey = formatDate(monday.toISOString().split('T')[0]);
        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { breast: 0, breast_duration: 0, formula: 0, formula_ml: 0, solid: 0 };
        weeklyMap[weekKey].breast += d.breast;
        weeklyMap[weekKey].breast_duration += d.breast_duration;
        weeklyMap[weekKey].formula += d.formula;
        weeklyMap[weekKey].formula_ml += d.formula_ml;
        weeklyMap[weekKey].solid += d.solid;
      });
      return Object.entries(weeklyMap)
        .map(([week, counts]) => ({
          date: week,
          breast: counts.breast,
          breast_duration: counts.breast_duration,
          formula: counts.formula,
          formula_ml: counts.formula_ml,
          solid: counts.solid,
          label: week,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return daily.map(d => ({ ...d, label: d.date }));
  }, [records]);

  if (chartData.length < 2) return null;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3 style={{
        fontFamily: 'var(--font-cute)', fontSize: 18,
        marginBottom: 12, textAlign: 'center',
      }}>
        🍼 喂养趋势
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginBottom: 8, marginTop: -8 }}>
        {chartData.length > 0 && chartData[0].label?.startsWith('~')
          ? '日均次数（周均值）'
          : chartData.length <= 30
            ? '每日次数'
            : '每周合计'}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F5EAED" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#C9B0B5' }}
            stroke="#C9B0B5"
            interval="preserveStartEnd"
            height={30}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#C9B0B5"
            allowDecimals={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
          <Line
            type="monotone"
            dataKey="breast"
            stroke="#FF8A80"
            strokeWidth={2.5}
            dot={{ fill: '#FF8A80', r: 4, stroke: '#fff', strokeWidth: 1.5 }}
            name="🤱 母乳"
          />
          <Line
            type="monotone"
            dataKey="formula"
            stroke="#81D4FA"
            strokeWidth={2.5}
            dot={{ fill: '#81D4FA', r: 4, stroke: '#fff', strokeWidth: 1.5 }}
            name="🍼 奶粉"
          />
          <Line
            type="monotone"
            dataKey="solid"
            stroke="#A5D6A7"
            strokeWidth={2.5}
            dot={{ fill: '#A5D6A7', r: 4, stroke: '#fff', strokeWidth: 1.5 }}
            name="🥣 辅食"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
