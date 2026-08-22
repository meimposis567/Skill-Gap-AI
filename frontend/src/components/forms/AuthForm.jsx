import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const AuthForm = ({ mode = 'login', onSubmit, loading }) => {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '', careerGoal: '' });

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {isRegister && (
        <Input label="Full Name" value={form.name} onChange={set('name')}
          placeholder="Chandru P" required icon="👤" />
      )}
      <Input label="Email" type="email" value={form.email} onChange={set('email')}
        placeholder="you@email.com" required icon="📧" />
      <Input label="Password" type="password" value={form.password} onChange={set('password')}
        placeholder="••••••••" required icon="🔒" />
      {isRegister && (
        <Input label="Career Goal" value={form.careerGoal} onChange={set('careerGoal')}
          placeholder="e.g. Frontend Developer" icon="🎯" />
      )}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? '⏳ Please wait...' : isRegister ? '🚀 Create Account' : '🔐 Sign In'}
      </Button>
    </form>
  );
};

export default AuthForm;
