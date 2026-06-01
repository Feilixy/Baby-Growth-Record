import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDate } from '../utils/dateUtils';

export default function GrowthChart({ records }) {
  if (!records || records.length < 2) return null;

  const data = records.map(r => ({
    date: formatDate(r.date),
    height: r.height,
    weight: r.weight,
  }));

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3 style={{ fontFamily: 'var(--font-cute)', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>
        📈 生长曲线
      </h3>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, textAlign: 'center' }}>身高 (cm)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5EAED" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#C9B0B5" />
            <YAxis tick={{ fontSize: 11 }} stroke="#C9B0B5" domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(255,184,198,0.2)' }}
            />
            <Line type="monotone" dataKey="height" stroke="#FFB8C6" strokeWidth={3} dot={{ fill: '#FFB8C6', r: 5 }} name="身高" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, textAlign: 'center' }}>体重 (kg)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5EAED" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#C9B0B5" />
            <YAxis tick={{ fontSize: 11 }} stroke="#C9B0B5" domain={['dataMin - 0.5', 'dataMax + 0.5']} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(255,184,198,0.2)' }}
            />
            <Line type="monotone" dataKey="weight" stroke="#D4C5F0" strokeWidth={3} dot={{ fill: '#D4C5F0', r: 5 }} name="体重" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
