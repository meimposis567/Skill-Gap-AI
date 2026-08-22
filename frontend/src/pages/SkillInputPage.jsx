import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getRoles, updateProfile, getProfile } from '../services/api';
import { getAuth } from '../utils/helpers';

const SkillInputPage = () => {
  const [skills, setSkills] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [certInput, setCertInput] = useState('');
  const [role, setRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resume, setResume] = useState(null);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { userId } = getAuth();

  useEffect(() => {
    getRoles().then(r => setRoles(r.data)).catch(() => {});
    if (userId) {
      getProfile(userId).then(r => {
        const user = r.data;
        if (user) {
          if (user.skills && user.skills.length > 0) setSkills(user.skills);
          if (user.certifications && user.certifications.length > 0) setCertifications(user.certifications);
          const active = localStorage.getItem('activeTargetRole');
          if (active) {
            setRole(active);
          } else if (user.careerGoal) {
            setRole(user.careerGoal);
          }
          if (user.resume) setResume({ name: user.resume, isExisting: true });
        }
      }).catch(err => console.error("Failed to load profile:", err));
    }
  }, [userId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = inputValue.trim();
      if (skill && !skills.includes(skill)) {
        setSkills([...skills, skill]);
      }
      setInputValue('');
    }
    if (e.key === 'Backspace' && inputValue === '') {
      setSkills(skills.slice(0, -1));
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addCert = () => {
    if (certInput.trim() && !certifications.includes(certInput.trim())) {
      setCertifications([...certifications, certInput.trim()]);
      setCertInput('');
    }
  };

  const removeCert = (c) => setCertifications(certifications.filter(i => i !== c));

  const handleAnalyze = async () => {
    if (!role) { setError('Please select a target career goal.'); return; }
    if (skills.length === 0 && !resume) { 
      setError('Please add at least one core skill or upload a resume.'); 
      return; 
    }
    
    setError(''); setLoading(true);
    try {
      await updateProfile(userId, { skills, certifications, careerGoal: role });
      navigate('/loading', { state: { userId, role, resume } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F0F4FF] pt-16 pb-20 px-4 font-['Plus_Jakarta_Sans',Inter,system-ui]">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          {/* HEADER BADGE & TITLE */}
          <div className="text-center mb-12">
            <span className="bg-[#EEF3FF] text-[#1B53F4] px-4 py-1.5 rounded-full text-[10px] font-black border border-[#1B53F4]/10 uppercase tracking-[0.2em] mb-4 inline-block shadow-sm">
              ONBOARDING STEP 01
            </span>
            <h1 className="text-[36px] font-extrabold text-[#1A1D2E] leading-tight mb-3">
              Complete Your Professional Identity
            </h1>
            <p className="text-[#6B7280] text-[15px] font-medium max-w-lg mx-auto">
              Our AI needs to understand your journey to curate the perfect skill path. Provide your details or upload a resume to get started.
            </p>
          </div>

          {error && (
            <div className="w-full max-w-[700px] mb-6 p-4 rounded-[16px] bg-[#FEE2E2] border border-[#EF4444] text-[#B91C1C] font-bold text-sm shadow-sm flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
              <span className="material-symbols-outlined">error</span> {error}
            </div>
          )}

          {/* MAIN FORM CARD */}
          <div className="bg-white rounded-[24px] p-10 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] w-full max-w-[700px] space-y-10">
            
            {/* RESUME UPLOAD SECTION */}
            <section>
              <h3 className="text-[17px] font-bold text-[#1A1D2E] mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1B53F4]">description</span>
                Resume Upload
              </h3>
              <div 
                className="border-2 border-dashed border-[#1B53F4]/40 rounded-[16px] bg-[#F8FAFF] hover:bg-[#F0F4FF] hover:border-[#1B53F4] transition-all p-8 h-[160px] flex flex-col items-center justify-center text-center cursor-pointer group"
                onClick={() => document.getElementById('resume-upload').click()}
              >
                <input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => setResume(e.target.files[0])} />
                <span className="material-symbols-outlined text-[#1B53F4] text-[40px] mb-3 group-hover:scale-110 transition-transform">cloud_upload</span>
                <p className="text-[14px] font-bold text-[#1A1D2E] truncate max-w-full px-4">
                  {resume ? (resume.name || resume.fileName) : 'Drag & drop or click to upload'}
                </p>
                <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-widest mt-1">
                  {resume ? 'Change File' : 'PDF Format Only'}
                </p>
              </div>
            </section>

            {/* 2-COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* TARGET CAREER GOAL */}
              <div>
                <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Target Career Goal</label>
                <div className="relative">
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full h-[52px] bg-white border border-[#E8ECF4] rounded-[12px] px-4 py-3 text-[#1A1D2E] text-sm font-bold focus:border-[#1B53F4] outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="" disabled>Select Job Role</option>
                    {roles.map(r => <option key={r.role} value={r.role}>{r.role}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* CORE SKILL INVENTORY */}
              <div>
                <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Core Skill Inventory</label>
                <div 
                  className="w-full min-h-[140px] bg-white border border-[#E8ECF4] rounded-[14px] p-4 focus-within:border-[#1B53F4] transition-all cursor-text overflow-y-auto"
                  onClick={() => inputRef.current.focus()}
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill, index) => (
                      <span key={index} className="bg-[#EEF3FF] text-[#1B53F4] px-3 py-1 rounded-full text-[11px] font-black border border-[#1B53F4]/10 flex items-center gap-2">
                        {skill}
                        <button onClick={(e) => { e.stopPropagation(); removeSkill(index); }} className="hover:text-[#EF4444] text-[14px] font-black leading-none">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={skills.length === 0 ? "Type a skill & Enter..." : "Add more..."}
                    className="bg-transparent text-[#1A1D2E] text-sm font-bold placeholder-[#9CA3AF] outline-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* PROFESSIONAL CERTIFICATIONS */}
            <div>
              <label className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-3 block">Professional Certifications</label>
              <div className="flex gap-3 mb-4">
                <input 
                  value={certInput} 
                  onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCert()}
                  placeholder="e.g. AWS Cloud Solutions..."
                  className="flex-1 h-[52px] bg-white border border-[#E8ECF4] rounded-[12px] px-4 py-3 text-[#1A1D2E] text-sm font-bold focus:border-[#1B53F4] outline-none transition-all" 
                />
                <button onClick={addCert} className="w-[52px] h-[52px] bg-[#1B53F4] text-white rounded-[12px] flex items-center justify-center hover:bg-[#1541D0] transition-colors shadow-lg shadow-[#1B53F4]/20">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <div className="space-y-2">
                {certifications.map(c => (
                  <div key={c} className="flex items-center justify-between px-4 py-3 bg-white border border-[#E8ECF4] rounded-[12px] text-[13px] font-bold text-[#1A1D2E] group shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1B53F4]">verified</span>
                      {c}
                    </div>
                    <button onClick={() => removeCert(c)} className="material-symbols-outlined text-[18px] text-[#9CA3AF] hover:text-[#EF4444] transition-colors">close</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ANALYZE BUTTON */}
            <div className="pt-4">
              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full h-[64px] bg-[#1B53F4] text-white rounded-[16px] text-[17px] font-black flex items-center justify-center gap-3 shadow-xl shadow-[#1B53F4]/20 hover:bg-[#1541D0] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Assembling Neural Path...' : (
                  <>Analyze Skills <span className="material-symbols-outlined">analytics</span></>
                )}
              </button>
              <p className="text-[#9CA3AF] text-[10px] text-center mt-4 uppercase tracking-[0.1em] font-black">
                BY ANALYZING, OUR AI GENERATES INDUSTRY-LEADING STANDARDIZED PATHS.
              </p>
            </div>
          </div>

          {/* BOTTOM TRUST BADGES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl px-4">
            <div className="bg-white rounded-[24px] p-6 flex items-start gap-4 border border-[#E8ECF4] shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#F0F4FF] rounded-xl flex items-center justify-center text-[#1B53F4] shrink-0">
                <span className="material-symbols-outlined text-[24px]">security</span>
              </div>
              <div>
                <h4 className="text-[#1A1D2E] text-[15px] font-bold mb-1">Secure & Encrypted</h4>
                <p className="text-[#6B7280] text-[12px] leading-relaxed">Enterprise-grade encryption for all uploaded documents.</p>
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-6 flex items-start gap-4 border border-[#E8ECF4] shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#F0F4FF] rounded-xl flex items-center justify-center text-[#1B53F4] shrink-0">
                <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              </div>
              <div>
                <h4 className="text-[#1A1D2E] text-[15px] font-bold mb-1">Semantic AI Mapping</h4>
                <p className="text-[#6B7280] text-[12px] leading-relaxed">Advanced NLP identifies skills between the lines.</p>
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-6 flex items-start gap-4 border border-[#E8ECF4] shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#F0F4FF] rounded-xl flex items-center justify-center text-[#1B53F4] shrink-0">
                <span className="material-symbols-outlined text-[24px]">speed</span>
              </div>
              <div>
                <h4 className="text-[#1A1D2E] text-[15px] font-bold mb-1">Results in 30 Seconds</h4>
                <p className="text-[#6B7280] text-[12px] leading-relaxed">Proprietary logic provides near-instant analytics.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default SkillInputPage;
