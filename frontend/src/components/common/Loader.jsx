import React from 'react';

const Loader = ({ message = 'Loading...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
    <div style={{
      width: '48px', height: '48px',
      border: '4px solid rgba(124,58,237,0.2)',
      borderTopColor: '#7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ marginTop: '18px', color: '#94a3b8', fontSize: '14px' }}>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Loader;
