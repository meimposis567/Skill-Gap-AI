import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getProfile, updateProfile, getDashboard, updateResume } from '../services/api';
import { getAuth, saveAuth } from '../utils/helpers';

const Profile = () => {
  const { userId } = getAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', careerGoal: '', skills: '', certifications: '', resume: '',
  });
  const [certInput, setCertInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }

    Promise.all([getProfile(userId), getDashboard(userId)])
      .then(([{ data: profile }, { data: dashboard }]) => {
        setForm({
          name: profile.name || '',
          email: profile.email || '',
          careerGoal: profile.careerGoal || '',
          skills: (profile.skills || []).join(', '),
          certifications: (profile.certifications || []).join(', '),
          resume: profile.resume || '',
        });
        setDashboardData(dashboard);
      })
      .catch(() => setError('Failed to load profile data.'))
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  const addSkill = (e) => {
    if (e) e.preventDefault();
    const val = skillInput.trim();
    if (!val) return;
    const currentSkills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
    if (!currentSkills.includes(val)) {
      setForm(prev => ({ ...prev, skills: [...currentSkills, val].join(', ') }));
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    const currentSkills = form.skills.split(',').map(s => n => s.trim()).filter(Boolean);
    const updated = currentSkills.filter(s => s !== skillToRemove).join(', ');
    setForm(prev => ({ ...prev, skills: updated }));
  };

  const addCertification = (e) => {
    if (e) e.preventDefault();
    const val = certInput.trim();
    if (!val) return;
    const currentCerts = form.certifications.split(',').map(s => s.trim()).filter(Boolean);
    if (!currentCerts.includes(val)) {
      setForm(prev => ({ ...prev, certifications: [...currentCerts, val].join(', ') }));
    }
    setCertInput('');
  };

  const removeCertification = (certToRemove) => {
    const currentCerts = form.certifications.split(',').map(s => s.trim()).filter(Boolean);
    const updated = currentCerts.filter(c => c !== certToRemove).join(', ');
    setForm(prev => ({ ...prev, certifications: updated }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError('');
    try {
      const payload = {
        name: form.name,
        careerGoal: form.careerGoal,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
      };
      const { data } = await updateProfile(userId, payload);
      if (data.user?.name) saveAuth(localStorage.getItem('token'), userId, data.user.name);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeLoading(true); setError('');
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const { data } = await updateResume(userId, formData);
      setForm(prev => ({ ...prev, resume: data.resume }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Resume upload failed.');
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center bg-[#F0F4FF]">
          <div className="w-12 h-12 border-4 border-[#1B53F4]/10 border-t-[#1B53F4] rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const initials = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const latestAnalysis = dashboardData?.latestAnalysis || dashboardData?.rolesSummary?.[0] || null;
  const matchPct = Math.round(latestAnalysis?.matchPercentage || 0);
  const totalSkills = dashboardData?.user?.totalSkills || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-[#F0F4FF] pt-10 pb-20 px-4 md:px-8 font-['Plus_Jakarta_Sans',Inter,system-ui]">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* ── PROFILE HEADER CARD ── */}
          <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-full bg-[#EEF3FF] border-[3px] border-[#1B53F4] flex items-center justify-center text-[28px] font-black text-[#1B53F4] shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h1 className="text-[24px] font-extrabold text-[#1A1D2E] leading-none">{form.name || 'Set Your Name'}</h1>
                {form.careerGoal && (
                  <span className="bg-[#EEF3FF] text-[#1B53F4] px-3 py-1 rounded-full text-[10px] font-black border border-[#1B53F4]/10 uppercase tracking-wider">
                    {form.careerGoal}
                  </span>
                )}
              </div>
              <p className="text-[14px] text-[#6B7280] font-medium">{form.email}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white border border-[#E8ECF4] rounded-[16px] px-5 py-3 shadow-sm text-center min-w-[120px]">
                <p className="text-[20px] font-black text-[#1B53F4]">{matchPct}%</p>
                <p className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-widest mt-1">Role Match</p>
              </div>
              <div className="bg-white border border-[#E8ECF4] rounded-[16px] px-5 py-3 shadow-sm text-center min-w-[120px]">
                <p className="text-[20px] font-black text-[#1A1D2E]">{totalSkills}</p>
                <p className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-widest mt-1">Known Skills</p>
              </div>
            </div>
          </div>

          {/* STATUS ALERTS */}
          {success && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 p-4 rounded-[16px] bg-[#EDFBF0] border border-[#46CB5C] text-[#1A9E35] font-bold text-sm shadow-sm">
              <span className="material-symbols-outlined">check_circle</span> Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 p-4 rounded-[16px] bg-[#FEE2E2] border border-[#EF4444] text-[#B91C1C] font-bold text-sm shadow-sm">
              <span className="material-symbols-outlined">error</span> {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            
            {/* ── BASIC INFORMATION ── */}
            <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-sm">
              <h3 className="text-[18px] font-bold text-[#1A1D2E] mb-8 flex items-center gap-2">
                <span className="text-[#1B53F4] material-symbols-outlined">person</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Full Name</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border border-[#E8ECF4] rounded-[12px] px-4 py-3.5 text-[#1A1D2E] text-sm font-semibold focus:border-[#1B53F4] focus:ring-1 focus:ring-[#1B53F4] transition-all outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Profile Email</label>
                  <input
                    type="email" disabled value={form.email}
                    className="w-full bg-[#F9FAFB] border border-[#E8ECF4] rounded-[12px] px-4 py-3.5 text-[#9CA3AF] text-sm font-semibold cursor-not-allowed opacity-70"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Career Goal</label>
                <input
                  type="text" value={form.careerGoal}
                  onChange={e => setForm({ ...form, careerGoal: e.target.value })}
                  className="w-full bg-white border border-[#E8ECF4] rounded-[12px] px-4 py-3.5 text-[#1A1D2E] text-sm font-semibold focus:border-[#1B53F4] focus:ring-1 focus:ring-[#1B53F4] transition-all outline-none"
                  placeholder="e.g. Senior Frontend Architect"
                />
              </div>
            </div>

            {/* ── SKILLS & EXPERTISE ── */}
            <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-sm">
              <h3 className="text-[18px] font-bold text-[#1A1D2E] mb-8 flex items-center gap-2">
                <span className="text-[#1B53F4] material-symbols-outlined">verified_user</span>
                Skills & Expertise
              </h3>

              <div className="mb-8">
                <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Skills</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill(e)}
                    className="flex-1 bg-white border border-[#E8ECF4] rounded-[12px] px-4 py-3.5 text-[#1A1D2E] text-sm font-semibold focus:border-[#1B53F4] outline-none transition-all"
                    placeholder="Add a skill..."
                  />
                  <button type="button" onClick={addSkill} className="w-12 h-12 bg-[#1B53F4] text-white rounded-[10px] flex items-center justify-center hover:bg-[#1541D0] transition-colors shadow-lg shadow-[#1B53F4]/20">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, index) => (
                    <div key={index} className="bg-[#EEF3FF] text-[#1B53F4] px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-2 border border-[#1B53F4]/10 shadow-sm group">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="material-symbols-outlined text-[16px] hover:text-[#EF4444] transition-colors">close</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Certifications</label>
                <div className="flex gap-2 mb-6">
                  <input
                    type="text" value={certInput}
                    onChange={e => setCertInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCertification(e)}
                    className="flex-1 bg-white border border-[#E8ECF4] rounded-[12px] px-4 py-3.5 text-[#1A1D2E] text-sm font-semibold focus:border-[#1B53F4] outline-none transition-all"
                    placeholder="Add a certification..."
                  />
                  <button type="button" onClick={addCertification} className="w-12 h-12 bg-[#1B53F4] text-white rounded-[10px] flex items-center justify-center hover:bg-[#1541D0] transition-colors shadow-lg shadow-[#1B53F4]/20">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {form.certifications.split(',').map(s => s.trim()).filter(Boolean).map((cert, index) => (
                    <div key={index} className="bg-white border border-[#E8ECF4] rounded-[12px] p-4 flex items-center justify-between group hover:border-[#1B53F4] transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#F8FAFF] rounded-[10px] flex items-center justify-center text-[#1B53F4]">
                          <span className="material-symbols-outlined">school</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#1A1D2E]">{cert}</span>
                      </div>
                      <button type="button" onClick={() => removeCertification(cert)} className="material-symbols-outlined text-[20px] text-[#9CA3AF] hover:text-[#EF4444] transition-colors">close</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RESUME & DOCUMENTS CARD ── */}
            <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-sm">
              <h3 className="text-[18px] font-bold text-[#1A1D2E] mb-8 flex items-center gap-2">
                <span className="text-[#1B53F4] material-symbols-outlined">description</span>
                Resume & Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Resume */}
                <div className="bg-white border border-[#E8ECF4] rounded-[16px] p-5 flex items-center gap-4 shadow-sm h-full">
                  <div className="w-14 h-14 bg-[#EEF3FF] rounded-xl flex items-center justify-center text-[#1B53F4]">
                    <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[#1A1D2E] truncate mb-1">{form.resume || 'No resume uploaded'}</p>
                    <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-2">Current Document</p>
                    {form.resume && (
                      <a href={`http://localhost:5000/uploads/resumes/${form.resume}`} target="_blank" rel="noreferrer" className="text-[#1B53F4] text-[12px] font-black flex items-center gap-1 hover:underline">
                        View Document <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Upload box */}
                <label className={`bg-white border-2 border-dashed border-[#E8ECF4] hover:border-[#1B53F4] rounded-[16px] p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${resumeLoading ? 'opacity-50 cursor-wait' : ''}`}>
                  {resumeLoading ? (
                    <div className="w-8 h-8 border-3 border-[#1B53F4]/20 border-t-[#1B53F4] rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined text-[#1B53F4] text-[32px]">cloud_upload</span>
                  )}
                  <span className="text-[14px] font-bold text-[#1A1D2E]">Replace Resume</span>
                  <span className="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-tight">PDF FORMAT ONLY</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={resumeLoading} />
                </label>
              </div>
            </div>

            {/* ── BOTTOM ACTION ROW ── */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit" disabled={saving}
                className="flex-[2] bg-[#1B53F4] text-white py-4 rounded-[16px] text-[15px] font-black shadow-xl shadow-[#1B53F4]/20 hover:bg-[#1541D0] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Profile'}
              </button>
              <button
                type="button" onClick={() => navigate('/dashboard')}
                className="flex-1 bg-white border border-[#E8ECF4] text-[#4B5563] py-4 rounded-[16px] text-[15px] font-bold hover:bg-[#F9FAFB] transition-all active:scale-95"
              >
                Back to Apps
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
