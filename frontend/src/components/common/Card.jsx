import React from 'react';

const Card = ({ children, style = {}, glass = true }) => (
  <div style={{
    background: glass ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '20px',
    padding: '28px',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    ...style,
  }}>
    {children}
  </div>
);

export default Card;
