import React, { useState } from 'react';

const Recommendations = ({ recommendations = [] }) => {
  const [expanded, setExpanded] = useState(null);

  if (!recommendations.length) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '20px', padding: '28px',
    }}>
      <h3 style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
        📚 Recommendations
      </h3>

      {recommendations.map((rec, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px', marginBottom: '12px',
          overflow: 'hidden',
        }}>
          <div
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              padding: '16px 20px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                fontSize: '12px', fontWeight: '600', border: '1px solid rgba(239,68,68,0.3)',
              }}>Missing</span>
              <span style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '15px' }}>{rec.skill}</span>
            </div>
            <span style={{ color: '#7c3aed', fontSize: '18px' }}>{expanded === i ? '▲' : '▼'}</span>
          </div>

          {expanded === i && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {rec.courses?.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>🎓 COURSES</div>
                  {rec.courses.map((c, j) => (
                    <div key={j} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      color: '#cbd5e1', fontSize: '13px', marginBottom: '6px',
                    }}>
                      <span style={{ color: '#7c3aed' }}>→</span> {c}
                    </div>
                  ))}
                </div>
              )}
              {rec.certifications?.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>🏆 CERTIFICATIONS</div>
                  {rec.certifications.map((c, j) => (
                    <div key={j} style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#f59e0b' }}>→</span> {c}
                    </div>
                  ))}
                </div>
              )}
              {rec.learningPath && (
                <div style={{
                  marginTop: '14px', padding: '12px 14px',
                  background: 'rgba(124,58,237,0.08)', borderRadius: '10px',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}>
                  <div style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>🗺️ LEARNING PATH</div>
                  <div style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>{rec.learningPath}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Recommendations;