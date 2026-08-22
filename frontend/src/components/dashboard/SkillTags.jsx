import React from 'react';

const tagStyles = {
  matched:       { bg: 'rgba(0,212,170,0.12)', border: 'rgba(0,212,170,0.3)',  color: '#00d4aa',  icon: '✅' },
  partialMatched:{ bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b', icon: '⚡' },
  missing:       { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444',  icon: '❌' },
};

const Tag = ({ skill, type }) => {
  const s = tagStyles[type] || tagStyles.matched;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      margin: '4px',
    }}>
      {s.icon} {skill}
    </span>
  );
};

const SkillTags = ({ matched = [], partialMatched = [], missing = [] }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '20px', padding: '28px',
  }}>
    <h3 style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
      Skill Analysis
    </h3>

    {matched.length > 0 && (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: '#00d4aa', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>✅ MATCHED SKILLS ({matched.length})</div>
        <div>{matched.map(s => <Tag key={s} skill={s} type="matched" />)}</div>
      </div>
    )}

    {partialMatched.length > 0 && (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>⚡ PARTIAL MATCHES ({partialMatched.length})</div>
        <div>{partialMatched.map(s => <Tag key={s} skill={s} type="partialMatched" />)}</div>
      </div>
    )}

    {missing.length > 0 && (
      <div>
        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>❌ MISSING SKILLS ({missing.length})</div>
        <div>{missing.map(s => <Tag key={s} skill={s} type="missing" />)}</div>
      </div>
    )}
  </div>
);

export default SkillTags;