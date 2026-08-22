import React from 'react';
import { getReadinessColor } from '../../utils/helpers';

const messages = {
  High:     { emoji: '🚀', msg: "You're highly prepared for this role! Focus on perfecting the remaining gaps to become an ideal candidate." },
  Moderate: { emoji: '📈', msg: "You have a solid base. Bridge the skill gaps with targeted learning and you'll be job-ready soon!" },
  Low:      { emoji: '💡', msg: "Great start! Build your foundation with the recommended courses and work on key missing skills first." },
};

const AIInsight = ({ analytics, role }) => {
  if (!analytics) return null;
  const level = analytics.readinessLevel || 'Low';
  const { emoji, msg } = messages[level] || messages.Low;
  const color = getReadinessColor(level);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}0f, rgba(124,58,237,0.08))`,
      border: `1px solid ${color}33`,
      borderRadius: '16px', padding: '20px 24px',
      display: 'flex', gap: '16px', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '28px' }}>{emoji}</span>
      <div>
        <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          🤖 AI Insight {role && `— ${role}`}
        </div>
        <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{msg}</p>
      </div>
    </div>
  );
};

export default AIInsight;
