import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatDate } from '../utils/dateUtils';

// 自定义 Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: 'none',
      boxShadow: '0 2px 12px rgba(180,160,200,0.25)',
      padding: '10px 14px',
      fontSize: 12,
      lineHeight: 1.8,
      minWidth: 140,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b5b7b', fontSize: 13 }}>
        📅 {label}
      </div>
      {payload.map((entry, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            background: entry.color, flexShrink: 0,
          }} />
          <span>{entry.name}：<strong>{entry.value}</strong> 次</span>
        </div>
      ))}
    </div>
  );
}

export default function DiaperTrendChart({ records }) {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    // 按日期分组统计
    const dailyMap = {};
    records.forEach(r => {
      if (!dailyMap[r.date]) {
        dailyMap[r.date] = { pee: 0, poop: 0 };
      }
      if (r.type === 'pee' || r.type === 'both') dailyMap[r.date].pee++;
      if (r.type === 'poop' || r.type === 'both') dailyMap[r.date].poop++;
    });

    // 转换为数组并按日期排序
    const daily = Object.entries(dailyMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const daysSpan = daily.length;

    // 如果跨度大于 60 天，按周聚合
    if (daysSpan > 60) {
      const weeklyMap = {};
      daily.forEach(d => {
        const dt = new Date(d.date);
        // 取周一所在的周
        const dayOfWeek = dt.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周一为基准
        const monday = new Date(dt);
        monday.setDate(dt.getDate() - diff);
        const weekKey = formatDate(monday.toISOString().split('T')[0]);
        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { pee: 0, poop: 0, days: 0 };
        weeklyMap[weekKey].pee += d.pee;
        weeklyMap[weekKey].poop += d.poop;
        weeklyMap[weekKey].days++;
      });
      const result = Object.entries(weeklyMap)
        .map(([week, counts]) => ({
          date: week,
          pee: Math.round((counts.pee / counts.days) * 10) / 10,
          poop: Math.round((counts.poop / counts.days) * 10) / 10,
          label: `${week} (日均)`,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return result.map(d => ({ ...d, label: `~${d.date}` }));
    }

    // 如果跨度大于 30 天，按周聚合显示合计值
    if (daysSpan > 30) {
      const weeklyMap = {};
      daily.forEach(d => {
        const dt = new Date(d.date);
        const dayOfWeek = dt.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(dt);
        monday.setDate(dt.getDate() - diff);
        const weekKey = formatDate(monday.toISOString().split('T')[0]);
        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { pee: 0, poop: 0 };
        weeklyMap[weekKey].pee += d.pee;
        weeklyMap[weekKey].poop += d.poop;
      });
      return Object.entries(weeklyMap)
        .map(([week, counts]) => ({
          date: week,
          pee: counts.pee,
          poop: counts.poop,
          label: week,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // 少于 30 天，按天显示
    return daily.map(d => ({
      ...d,
      label: d.date,
    }));
  }, [records]);

  if (chartData.length < 2) return null;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3 style={{
        fontFamily: 'var(--font-cute)', fontSize: 18,
        marginBottom: 12, textAlign: 'center',
      }}>
        📈 大小便趋势
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
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="pee"
            stroke="#4FC3F7"
            strokeWidth={2.5}
            dot={{ fill: '#4FC3F7', r: 4, stroke: '#fff', strokeWidth: 1.5 }}
            name="💧 小便"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="poop"
            stroke="#8D6E63"
            strokeWidth={2.5}
            dot={{ fill: '#8D6E63', r: 4, stroke: '#fff', strokeWidth: 1.5 }}
            name="💩 大便"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
