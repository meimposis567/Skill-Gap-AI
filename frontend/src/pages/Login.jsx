import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { saveAuth } from '../utils/helpers';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await loginUser(form);
      saveAuth(data.token, data.user.id, data.user.name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-page)] flex items-center justify-center px-4 relative overflow-hidden antialiased">
      {/* 1. BACKGROUND GLOW BLOBS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--primary)] opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[var(--sky)] opacity-5 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-md z-10">
        {/* 2. BRAND HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg">⚡</span>
            </div>
            <span className="text-[var(--text-primary)] font-bold text-2xl tracking-tight">Skill Gap AI</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Informed Curator • Precision Skill Mapping</p>
        </div>

        {/* 3. NEW FORM COMPONENT */}
        <form onSubmit={handleLogin} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="sm:w-[400px] w-full text-center border border-gray-300/60 rounded-3xl px-8 bg-white mx-auto shadow-sm pb-11 pt-10">
          <h1 className="text-gray-900 text-[32px] font-bold tracking-tight">Login</h1>
          <p className="text-gray-500 text-sm mt-2 mb-8 font-medium">Please sign in to continue</p>
          
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-[var(--danger-light)] border border-[var(--danger)] flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[var(--danger)] text-sm">error</span>
              <p className="text-xs font-medium text-[var(--danger)]">{error}</p>
            </div>
          )}
          
          <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-5 gap-3 focus-within:border-[#1B53F4] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
              <input type="email" placeholder="Email id" className="border-none outline-none ring-0 w-full text-sm text-gray-700 bg-transparent p-0 m-0 focus:border-none focus:ring-0 shadow-none !border-transparent !bg-transparent !p-0" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          
          <div className="flex items-center mt-5 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-5 gap-3 focus-within:border-[#1B53F4] transition-colors relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input type={showPassword ? "text" : "password"} placeholder="Password" className="border-none outline-none ring-0 w-full text-sm text-gray-700 bg-transparent pr-10 p-0 m-0 focus:border-none focus:ring-0 shadow-none !border-transparent !bg-transparent !p-0" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center"
              >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
          </div>
          
          <div className="mt-4 text-left">
              <button className="text-sm text-[#1B53F4] hover:underline" type="button">Forgot password?</button>
          </div>
          
          <button type="submit" disabled={loading} className="mt-5 w-full h-[46px] rounded-full text-white bg-[#1B53F4] hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2">
              {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : 'Login'}
          </button>
          
          <p className="text-gray-500 text-sm mt-5">Don't have an account? <Link to="/register" className="text-[#1B53F4] hover:underline">Sign up</Link></p>
        </form>

        {/* BOTTOM BADGES */}
        <div className="flex justify-center gap-10 mt-8 opacity-60">
          <span className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[var(--text-muted)]">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            SECURE PROTOCOL
          </span>
          <span className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[var(--text-muted)]">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            AI OPTIMIZED
          </span>
        </div>
      </main>
    </div>
  );
};

export default Login;
