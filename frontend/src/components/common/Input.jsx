import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, required, error, icon }) => {
  return (
    <div style={{ marginBottom: '20px', width: '100%' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: icon ? '13px 16px 13px 44px' : '13px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#f1f5f9',
            fontSize: '15px',
            outline: 'none',
            transition: 'border 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.border = '1px solid #7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
          onBlur={e => { e.target.style.border = error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
    </div>
  );
};

export default Input;
