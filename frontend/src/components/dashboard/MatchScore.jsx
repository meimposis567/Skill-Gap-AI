import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getReadinessColor } from '../../utils/helpers';

const MatchScore = ({ matchPercentage, totalScore, analytics }) => {
  const score = parseFloat(totalScore || matchPercentage || 0);
  const color = getReadinessColor(analytics?.readinessLevel);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '20px',
      padding: '32px',
      textAlign: 'center',
    }}>
      <h3 style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
        Match Score
      </h3>
      <div style={{ width: '160px', margin: '0 auto 24px' }}>
        <CircularProgressbar
          value={score}
          text={`${score.toFixed(1)}%`}
          styles={buildStyles({
            textSize: '16px',
            pathColor: color,
            textColor: '#f1f5f9',
            trailColor: 'rgba(255,255,255,0.06)',
          })}
        />
      </div>

      {/* Readiness badge */}
      <div style={{
        display: 'inline-block', padding: '6px 18px',
        borderRadius: '20px', fontSize: '13px', fontWeight: '600',
        background: `${color}22`, color, border: `1px solid ${color}44`,
        marginBottom: '20px',
      }}>
        {analytics?.readinessLevel || 'N/A'} Readiness
      </div>

      {/* Stats row */}
      {analytics && (
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '20px' }}>
          {[
            { label: 'Required', val: analytics.totalSkillsRequired, color: '#94a3b8' },
            { label: 'Matched',  val: analytics.exactMatches,        color: '#00d4aa' },
            { label: 'Partial',  val: analytics.partialMatches,      color: '#f59e0b' },
            { label: 'Missing',  val: analytics.missingCount,        color: '#ef4444' },
          ].map(({ label, val, color: c }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: c, fontSize: '22px', fontWeight: '700' }}>{val}</div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchScore;
