import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, fullWidth = false, style = {} }) => {
  const base = {
    padding: '12px 28px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    fontSize: '15px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
    ...style,
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.08)',
      color: '#e2e8f0',
      border: '1px solid rgba(255,255,255,0.12)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff',
    },
    success: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: '#fff',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => { if (!disabled) e.target.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
    >
      {children}
    </button>
  );
};

export default Button;
