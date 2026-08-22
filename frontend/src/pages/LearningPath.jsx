import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getDashboard, masterSkill } from '../services/api';
import { getAuth, getStoredAnalysis, saveLastAnalysis, getBoostedScore, getCompletedCourses, saveCompletedCourses, syncRoleAnalysis } from '../utils/helpers';

const LearningPath = () => {
  const [analysis, setAnalysis] = useState(() => getStoredAnalysis());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [successSkill, setSuccessSkill] = useState(null);
  const navigate = useNavigate();
  const { userId } = getAuth();

  const handleMasterSkill = async (skill) => {
    if (actionLoading || successSkill) return;
    console.log('[LearningPath] handleMasterSkill called for:', skill);
    
    setActionLoading(skill);
    try {
      const { data } = await masterSkill({ 
        userId, 
        skillName: skill, 
        role: analysis?.role 
      });
      
      if (data?.latest) {
        const freshData = data.latest;
        
        setAnalysis(prev => {
          const relatedCourses = (prev?.recommendations || [])
            .filter(r => r.skill === skill)
            .flatMap(r => r.courses || [])
            .map(c => c.split(' - ')[0]);
          
          if (relatedCourses.length > 0) {
            const currentCompleted = getCompletedCourses();
            saveCompletedCourses([...new Set([...currentCompleted, ...relatedCourses])]);
          }

          const result = saveLastAnalysis(freshData);
          console.log('[LearningPath] Master skill success. New score:', result.matchPercentage);
          return { ...result };
        });
        
        setSuccessSkill(skill);
        setActionLoading(null);
        setTimeout(() => setSuccessSkill(null), 1500);
      }
    } catch (err) {
      console.error('[LearningPath] Master skill error:', err);
      alert("Failed to mark skill as complete: " + (err.response?.data?.message || err.message));
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (userId) {
      getDashboard(userId)
        .then(({ data }) => {
          if (data.latestAnalysis) {
            setAnalysis(syncRoleAnalysis(data.latestAnalysis));
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="text-center py-20 px-4">
          <div className="text-6xl mb-6">📚</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No learning path yet</h2>
          <p className="text-[var(--text-secondary)] mb-8">Analyze your skills first to get a personalized learning path.</p>
          <button
            onClick={() => navigate('/skill-input')}
            className="btn-primary"
          >
            🚀 Get My Learning Path
          </button>
        </div>
      </Layout>
    );
  }

  const allGaps = [...(analysis.missing || []), ...(analysis.partialMatched || [])];
  const completedCourses = getCompletedCourses();
  const boostedPercent = Math.round(analysis.matchPercentage ?? analysis.score ?? 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* ── TOP PROGRESS BANNER ── */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-white mb-10 transition-transform hover:scale-[1.01] duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A1D2E]">
              You've mastered <span className="text-[#1B53F4]">{boostedPercent}%</span> of the skills required for {analysis.role}
            </h2>
            <div className="bg-[#EEF3FF] text-[#1B53F4] px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide uppercase shrink-0 shadow-sm">
              Target Role: {analysis.role}
            </div>
          </div>
          
          <div className="w-full bg-[#F1F5F9] rounded-full h-[10px] overflow-hidden mb-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-[#1B53F4] to-[#4AACEA] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(27,83,244,0.4)]"
              style={{ width: `${boostedPercent}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-[12px] font-bold tracking-wider uppercase">
            <span className="text-[#94A3B8]">Beginner</span>
            <span className="text-[#1B53F4] bg-[#EEF3FF] px-3 py-0.5 rounded-md shadow-sm">{boostedPercent}% COMPLETE</span>
            <span className="text-[#94A3B8]">Expert</span>
          </div>
        </div>

        {/* ── TIMELINE ── */}
        <div className="relative pl-4 md:pl-10">
          {/* Vertical line down center-left */}
          <div className="absolute left-[34px] md:left-[60px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#46CB5C] via-[#1B53F4] to-[#E8ECF4]"></div>

          <div className="space-y-12">
            
            {/* ── COMPLETED STEP ── */}
            {analysis.matched?.length > 0 && (
              <div className="relative flex gap-8 items-start group">
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#46CB5C] text-white flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(70,203,92,0.4)] shrink-0 mt-2 transform -rotate-6 group-hover:rotate-0 transition-all duration-300">
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </div>
                
                <div className="flex-1 bg-white rounded-[32px] p-8 border border-white border-l-[6px] border-l-[#46CB5C] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-[#EDFBF0] text-[#46CB5C] px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">COMPLETED</span>
                    <span className="text-[#94A3B8] text-[12px] font-bold uppercase tracking-wide">Prior Experience</span>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1A1D2E] mb-2 leading-none">Existing Skills Validation</h3>
                  <p className="text-[#64748B] text-[15px] leading-relaxed mb-6">Foundational knowledge and previous experience successfully mapped to the target role requirements.</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {analysis.matched.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EDFBF0] text-[#46CB5C] rounded-xl text-[13px] font-bold shadow-sm border border-[#46CB5C]/10">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── GAP STEPS ── */}
            {allGaps.map((skill, index) => {
              const isInProgress = index === 0;
              const relatedRecs = (analysis.recommendations || []).filter(r =>
                (r.skill || '').toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes((r.skill || '').toLowerCase())
              );
              
              if (isInProgress) {
                return (
                  <div key={skill} className="relative flex gap-8 items-start group">
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#1B53F4] text-white flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(27,83,244,0.4)] shrink-0 mt-2 ring-4 ring-[#EEF3FF] transform group-hover:scale-110 transition-all duration-300">
                      <span className="material-symbols-outlined text-[24px] animate-pulse">keyboard_double_arrow_right</span>
                    </div>
                    
                    <div className="flex-1 bg-white rounded-[32px] p-8 border border-white border-l-[6px] border-l-[#1B53F4] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-500 hover:-translate-y-2">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[#1B53F4]/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                      
                      <div className="flex flex-wrap items-center gap-3 mb-4 relative z-10">
                        <span className="bg-[#1B53F4] text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md shadow-[#1B53F4]/20">IN PROGRESS</span>
                        <span className="bg-[#FFFBEB] text-[#D97706] px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border border-[#FEF3C7] shadow-sm">Priority Module</span>
                      </div>
                      
                      <h3 className="text-[26px] font-black text-[#1A1D2E] mb-2 leading-tight">Master {skill}</h3>
                      <p className="text-[#64748B] text-[16px] leading-relaxed mb-8">This is your most critical skill gap. Focus on these resources to significantly boost your readiness score.</p>
                      
                      <div className="space-y-6 mb-10">
                        {relatedRecs.map((rec, rIdx) => {
                          const [title] = (rec.courses?.[0] || '').split(' - ');
                          const url = `https://www.google.com/search?q=${encodeURIComponent(title || rec.skill)}`;
                          
                          return (
                            <div key={rIdx} className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#F1F5F9] shadow-sm hover:shadow-md transition-shadow">
                              <p className="text-[14px] font-black text-[#1A1D2E] mb-2">{title || `Mastery Course for ${rec.skill}`}</p>
                              <a 
                                href={url} target="_blank" rel="noreferrer"
                                className="text-[#1B53F4] text-[14px] font-bold flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4"
                              >
                                Access Learning Resource
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button 
                        onClick={() => handleMasterSkill(skill)}
                        disabled={actionLoading === skill || successSkill === skill}
                        className={`w-full h-[58px] rounded-[18px] font-black text-[16px] flex items-center justify-center gap-2 transition-all shadow-[0_15px_30px_-10px_rgba(27,83,244,0.5)] active:shadow-inner ${
                          successSkill === skill 
                          ? 'bg-[#46CB5C] text-white shadow-[#46CB5C]/20'
                          : 'bg-gradient-to-r from-[#1B53F4] to-[#4AACEA] text-white hover:brightness-110 active:scale-[0.97]'
                        }`}
                      >
                        {actionLoading === skill ? (
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : successSkill === skill ? (
                          <><span className="material-symbols-outlined font-black">done_all</span> Module Mastered!</>
                        ) : (
                          <><span className="material-symbols-outlined font-black">check_circle</span> Mark as Complete</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={skill} className="relative flex gap-8 items-start opacity-50 grayscale-[0.3] transition-all hover:opacity-70 hover:grayscale-0">
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border-2 border-[#E8ECF4] text-[#94A3B8] flex items-center justify-center shrink-0 mt-2 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  
                  <div className="flex-1 bg-[#F8FAFC]/50 rounded-[32px] p-8 border border-[#E8ECF4] border-l-[6px] border-l-[#E8ECF4] shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">LOCKED</span>
                      <span className="text-[#94A3B8] text-[12px] font-bold uppercase tracking-wide">Step {index + 1}</span>
                    </div>
                    <h3 className="text-[20px] font-bold text-[#94A3B8] mb-2">Master {skill}</h3>
                    <div className="flex items-center gap-2 text-[#94A3B8] mt-4">
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      <p className="text-[13px] font-medium italic text-[#94A3B8]">Unlock this module by completing earlier steps</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── FINAL MILESTONE ── */}
            <div className="relative flex gap-8 items-start">
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FDE68A] border-2 border-[#FBBF24] text-[#D97706] flex items-center justify-center shadow-[0_15px_30px_-10px_rgba(251,191,36,0.5)] shrink-0 mt-2 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <span className="material-symbols-outlined text-[32px]">emoji_events</span>
              </div>
              
              <div className="flex-1 bg-gradient-to-br from-white to-[#FFFBEB] rounded-[40px] p-10 border border-white text-center shadow-[0_30px_70px_-20px_rgba(251,191,36,0.25)] relative overflow-hidden transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D97706 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FBBF24]/10 rounded-full blur-3xl"></div>
                
                <span className="bg-[#D97706] text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-6 inline-block shadow-md">FINAL MILESTONE</span>
                <h3 className="text-[36px] font-black text-[#1A1D2E] mb-4 leading-none">Career Goal Achieved</h3>
                <p className="text-[#92400E] text-[17px] max-w-lg mx-auto leading-relaxed mt-4 font-medium">
                  Upon completing these modules, you will have the comprehensive skill set required to excel as a <span className="font-bold underline decoration-[#FBBF24] decoration-4 underline-offset-8">{analysis.role}</span> at the industry standard.
                </p>
                <div className="mt-12 flex justify-center">
                  <div className="w-28 h-28 rounded-full bg-white shadow-[0_10px_40px_-10px_rgba(251,191,36,0.4)] flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                     <span className="material-symbols-outlined text-[56px] text-[#D97706]">trophy</span>
                     <div className="absolute inset-0 rounded-full border-4 border-[#FBBF24]/20 animate-ping"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LearningPath;
