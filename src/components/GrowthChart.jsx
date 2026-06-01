import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatDate } from '../utils/dateUtils';
import { getReferenceValues } from '../data/growthStandards';

// 百分位参考线的颜色和标签
const PERCENTILE_CONFIG = [
  { key: 'p1',  label: 'P1',  color: '#bdbdbd', desc: '极低' },
  { key: 'p30', label: 'P30', color: '#90caf9', desc: '偏矮/轻' },
  { key: 'p50', label: 'P50', color: '#66bb6a', desc: '中位数' },
  { key: 'p70', label: 'P70', color: '#ffa726', desc: '偏高/重' },
  { key: 'p99', label: 'P99', color: '#ef5350', desc: '极高' },
];

// 自定义 X 轴刻度：第一行日期，第二行周数
function CustomXTick(props) {
  const { x, y, payload, recordMap } = props;
  const week = payload.value;
  const record = recordMap?.[week];
  if (!record) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={0} textAnchor="middle" fill="#C9B0B5" fontSize={10}>
        {record.dateLabel}
      </text>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#b0a0c0" fontSize={9}>
        第{week}周
      </text>
    </g>
  );
}

// 自定义 Tooltip
function CustomTooltip({ active, payload, label: week, recordMap, metric }) {
  if (!active || !payload || payload.length === 0) return null;

  const record = recordMap?.[week];
  const unit = metric === 'height' ? 'cm' : 'kg';
  const dataKey = metric;

  // 从 payload 中提取参考值
  const getRefVal = (pKey) => {
    const entry = payload.find(p => p.dataKey === `${pKey}_${metric === 'height' ? 'h' : 'w'}`);
    return entry?.value ?? null;
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: 'none',
      boxShadow: '0 2px 12px rgba(180,160,200,0.25)',
      padding: '10px 14px',
      fontSize: 12,
      lineHeight: 1.6,
      minWidth: 180,
    }}>
      {/* 标题行 */}
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b5b7b', fontSize: 13 }}>
        📅 {record ? `${record.dateLabel} · 第${week}周` : `第${week}周（无记录）`}
      </div>

      {/* 宝宝实际值 */}
      {record && (
        <div style={{
          background: '#fdf2f8', borderRadius: 8, padding: '4px 8px', marginBottom: 6,
          fontWeight: 600, color: '#d4687c',
        }}>
          宝宝{metric === 'height' ? '身高' : '体重'}：{record[dataKey]} {unit}
        </div>
      )}

      {/* 参考值 */}
      <div style={{ fontSize: 10, color: '#8b7b9b' }}>
        {PERCENTILE_CONFIG.map(pc => {
          const val = getRefVal(pc.key);
          return (
            <div key={pc.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: pc.color, flexShrink: 0,
              }} />
              <span style={{ width: 24, fontWeight: 500 }}>{pc.label}</span>
              <span style={{ color: '#999', width: 28 }}>{pc.desc}</span>
              <span style={{ fontWeight: 500, color: '#333' }}>
                {val != null ? `${val} ${unit}` : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GrowthChart({ records, birthDate, gender, standardType }) {
  // 计算每条记录的周数并格式化日期
  const recordsWithWeek = useMemo(() => {
    if (!birthDate) return [];
    const birth = new Date(birthDate);
    birth.setHours(0, 0, 0, 0);
    return records.map(r => {
      const recordDate = new Date(r.date);
      recordDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((recordDate - birth) / (24 * 60 * 60 * 1000));
      const week = Math.round(diffDays / 7);
      return {
        ...r,
        week,
        dateLabel: formatDate(r.date),
      };
    });
  }, [records, birthDate]);

  const genderKey = gender === 'boy' ? 'boy' : 'girl';

  // 生成图表数据：密集的参考线数据 + 稀疏的实际记录数据
  const { heightData, weightData, recordMap, xTicks } = useMemo(() => {
    if (recordsWithWeek.length === 0) {
      return { heightData: [], weightData: [], recordMap: {}, xTicks: [] };
    }

    const weeks = recordsWithWeek.map(r => r.week);
    const minWeek = Math.min(...weeks);
    const maxWeek = Math.max(...weeks);
    const weekRange = maxWeek - minWeek;

    // 扩展范围以确保参考线覆盖整个图表
    const startWeek = Math.max(0, Math.floor(minWeek) - Math.max(2, Math.ceil(weekRange * 0.1)));
    const endWeek = Math.ceil(maxWeek) + Math.max(2, Math.ceil(weekRange * 0.1));

    // 建立记录周数映射
    const rMap = {};
    recordsWithWeek.forEach(r => { rMap[r.week] = r; });

    const hData = [];
    const wData = [];
    const step = Math.max(0.5, Math.ceil(weekRange / 40) * 0.5); // 动态步长确保至少40个点

    for (let w = startWeek; w <= endWeek; w += step) {
      const week = Math.round(w * 10) / 10;
      const record = rMap[Math.round(week)];

      // 身高图数据点
      const hPoint = { week };
      if (record) {
        hPoint.dateLabel = record.dateLabel;
        hPoint.height = record.height;
      }
      const hRef = getReferenceValues(standardType, genderKey, 'height', week);
      if (hRef) {
        hPoint.p1_h = hRef.p1;
        hPoint.p30_h = hRef.p30;
        hPoint.p50_h = hRef.p50;
        hPoint.p70_h = hRef.p70;
        hPoint.p99_h = hRef.p99;
      }
      hData.push(hPoint);

      // 体重图数据点
      const wPoint = { week };
      if (record) {
        wPoint.dateLabel = record.dateLabel;
        wPoint.weight = record.weight;
      }
      const wRef = getReferenceValues(standardType, genderKey, 'weight', week);
      if (wRef) {
        wPoint.p1_w = wRef.p1;
        wPoint.p30_w = wRef.p30;
        wPoint.p50_w = wRef.p50;
        wPoint.p70_w = wRef.p70;
        wPoint.p99_w = wRef.p99;
      }
      wData.push(wPoint);
    }

    return {
      heightData: hData,
      weightData: wData,
      recordMap: rMap,
      xTicks: recordsWithWeek.map(r => r.week),
    };
  }, [recordsWithWeek, standardType, genderKey]);

  // 计算 Y 轴范围
  const heightDomain = useMemo(() => {
    if (heightData.length === 0) return ['auto', 'auto'];
    const vals = [];
    heightData.forEach(d => {
      if (d.height != null) vals.push(d.height);
      if (d.p1_h != null) vals.push(d.p1_h);
      if (d.p99_h != null) vals.push(d.p99_h);
    });
    if (vals.length === 0) return ['auto', 'auto'];
    return [Math.floor(Math.min(...vals) - 2), Math.ceil(Math.max(...vals) + 2)];
  }, [heightData]);

  const weightDomain = useMemo(() => {
    if (weightData.length === 0) return ['auto', 'auto'];
    const vals = [];
    weightData.forEach(d => {
      if (d.weight != null) vals.push(d.weight);
      if (d.p1_w != null) vals.push(d.p1_w);
      if (d.p99_w != null) vals.push(d.p99_w);
    });
    if (vals.length === 0) return ['auto', 'auto'];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return [Math.floor((min - 0.5) * 10) / 10, Math.ceil((max + 0.5) * 10) / 10];
  }, [weightData]);

  if (!birthDate || recordsWithWeek.length < 2) return null;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>
        📈 生长曲线
      </h3>

      {/* 身高图 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, textAlign: 'center' }}>
          身高 (cm)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={heightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5EAED" />
            <XAxis
              dataKey="week"
              ticks={xTicks}
              tick={<CustomXTick recordMap={recordMap} />}
              stroke="#C9B0B5"
              height={40}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#C9B0B5"
              domain={heightDomain}
              width={40}
            />
            <Tooltip content={<CustomTooltip recordMap={recordMap} metric="height" />} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              iconType="line"
            />
            {/* 参考线 */}
            {PERCENTILE_CONFIG.map(pc => (
              <Line
                key={`h_${pc.key}`}
                type="monotone"
                dataKey={`${pc.key}_h`}
                stroke={pc.color}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name={`${pc.label}`}
                connectNulls={true}
              />
            ))}
            {/* 实际数据线 */}
            <Line
              type="monotone"
              dataKey="height"
              stroke="#FFB8C6"
              strokeWidth={3}
              dot={{ fill: '#FFB8C6', r: 5, stroke: '#fff', strokeWidth: 2 }}
              name="宝宝身高"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 体重图 */}
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, textAlign: 'center' }}>
          体重 (kg)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5EAED" />
            <XAxis
              dataKey="week"
              ticks={xTicks}
              tick={<CustomXTick recordMap={recordMap} />}
              stroke="#C9B0B5"
              height={40}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#C9B0B5"
              domain={weightDomain}
              width={40}
            />
            <Tooltip content={<CustomTooltip recordMap={recordMap} metric="weight" />} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              iconType="line"
            />
            {/* 参考线 */}
            {PERCENTILE_CONFIG.map(pc => (
              <Line
                key={`w_${pc.key}`}
                type="monotone"
                dataKey={`${pc.key}_w`}
                stroke={pc.color}
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name={`${pc.label}`}
                connectNulls={true}
              />
            ))}
            {/* 实际数据线 */}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#D4C5F0"
              strokeWidth={3}
              dot={{ fill: '#D4C5F0', r: 5, stroke: '#fff', strokeWidth: 2 }}
              name="宝宝体重"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
