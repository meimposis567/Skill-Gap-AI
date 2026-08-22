import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const Charts = ({ matched = [], partialMatched = [], missing = [], role = '' }) => {
  const barData = [
    { name: 'Matched',       value: matched.length,       fill: '#00d4aa' },
    { name: 'Partial',       value: partialMatched.length, fill: '#f59e0b' },
    { name: 'Missing',       value: missing.length,        fill: '#ef4444' },
  ];

  const total = matched.length + partialMatched.length + missing.length;

  const radarData = [
    { subject: 'Matched',  A: matched.length, fullMark: total || 1 },
    { subject: 'Partial',  A: partialMatched.length, fullMark: total || 1 },
    { subject: 'Missing',  A: missing.length, fullMark: total || 1 },
    { subject: 'Total',    A: total, fullMark: total || 1 },
  ];

  const tooltipStyle = {
    background: 'rgba(15,12,40,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '13px',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '20px', padding: '28px',
    }}>
      <h3 style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
        📊 Skill Analytics {role && `— ${role}`}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Bar Chart */}
        <div>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>Skill Breakdown</div>
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <BarChart data={barData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>Skill Radar</div>
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Radar name="Skills" dataKey="A" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;