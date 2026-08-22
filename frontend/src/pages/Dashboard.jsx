import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getDashboard, generateMockInterview, masterSkill, unmasterSkill } from '../services/api';
import { getAuth, saveLastAnalysis, getBoostedScore, getCompletedCourses, saveCompletedCourses, syncRoleAnalysis } from '../utils/helpers';

const getStableCourseMeta = (seedText) => {
  const seed = [...(seedText || '')].reduce((total, char) => total + char.charCodeAt(0), 0);
  return {
    duration: 5 + (seed % 11),
    rating: (4.2 + ((seed % 8) * 0.1)).toFixed(1),
  };
};

const getBadgeColor = (title) => {
  const seed = [...(title || '')].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'bg-[#4AACEA]', // sky blue
    'bg-[#46CB5C]', // green
    'bg-[#1B53F4]', // primary blue
    'bg-[#F59E0B]', // warning yellow
    'bg-[#8B5CF6]', // purple
  ];
  return colors[seed % colors.length];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userName } = getAuth();

  const [analysis, setAnalysis] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedCourses, setCompletedCourses] = useState(() => getCompletedCourses());
  const [completingSkill, setCompletingSkill] = useState(null);

  // ── SCORE COUNT-UP ANIMATION ──
  const [animatedScore, setAnimatedScore] = useState(0);

  // ── MOCK INTERVIEW STATE ──
  const [mockQuestions, setMockQuestions] = useState(null);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);

  // ── SEARCH FILTERING LOGIC ──
  const queryParams = new URLSearchParams(location.search);
  const globalSearch = (queryParams.get('q') || '').toLowerCase();

  const toggleComplete = async (title, e, skillName) => {
    e.stopPropagation();
    console.log('[Dashboard] toggleComplete called:', { title, skillName, userId });

    if (completingSkill) return;
    
    if (!userId) {
      alert("Please log in to track your progress.");
      return;
    }

    if (!skillName) {
      console.error('[Dashboard] Missing skillName for:', title);
      alert("Error: Could not identify the skill for this course.");
      return;
    }
    
    const isCompleted = completedCourses.includes(title);
    
    if (!isCompleted) {
      setCompletingSkill(title);
      try {
        console.log('[Dashboard] Calling masterSkill for:', skillName);
        const res = await masterSkill({ userId, skillName, role: analysis?.role });
        
        const newCompleted = [...completedCourses, title];
        saveCompletedCourses(newCompleted);
        setCompletedCourses(newCompleted);
        
        if (res.data?.latest) {
          const updated = saveLastAnalysis(res.data.latest);
          setAnalysis(updated);
          console.log('[Dashboard] Skill mastered successfully:', skillName);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to master skill:', err);
        alert("Failed to update progress: " + (err.response?.data?.message || err.message));
      } finally {
        setCompletingSkill(null);
      }
    } else {
      setCompletingSkill(title);
      try {
        console.log('[Dashboard] Calling unmasterSkill for:', skillName);
        const res = await unmasterSkill({ userId, skillName, role: analysis?.role });
        
        const newCompleted = completedCourses.filter(t => t !== title);
        saveCompletedCourses(newCompleted);
        setCompletedCourses(newCompleted);
        
        if (res.data?.latest) {
          const updated = saveLastAnalysis(res.data.latest);
          setAnalysis(updated);
          console.log('[Dashboard] Skill unmastered successfully:', skillName);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to unmaster skill:', err);
        alert("Failed to revert progress: " + (err.response?.data?.message || err.message));
      } finally {
        setCompletingSkill(null);
      }
    }
  };

  const filterSkills = (skills) => {
    if (!globalSearch) return skills || [];
    return (skills || []).filter(s => s.toLowerCase().includes(globalSearch));
  };

  const handleGenerateInterview = async () => {
    if (!analysis) return;
    setIsMockLoading(true);
    setShowMockModal(true);
    try {
      const res = await generateMockInterview({
        userId,
        role: analysis.role,
        missingSkills: analysis.missing || [],
        partialSkills: analysis.partialMatched || []
      });
      setMockQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      setMockQuestions([{ question: "Failed to generate questions. Please try again.", hint: "" }]);
    } finally {
      setIsMockLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('lastAnalysis');
    if (stored) setAnalysis(JSON.parse(stored));

    if (userId) {
      const activeRole = localStorage.getItem('activeTargetRole');
      
      getDashboard(userId)
        .then(async (r) => {
          setDashData(r.data);
          const latest = r.data.latestAnalysis;
          if (latest) {
            const synced = syncRoleAnalysis(latest);
            setAnalysis(synced);
          }
        })
        .catch(err => {
          console.error("Dashboard fetch error:", err);
          setError("Failed to sync your latest data.");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId]);

  // ── Compute matchValue with course boost (same formula as Progress page) ──
  const matchValue = getBoostedScore((analysis?.matchPercentage ?? analysis?.score) || 0);

  // ── SCORE COUNT-UP — easeInOutQuart, 1200ms ──
  useEffect(() => {
    if (matchValue === 0) { setAnimatedScore(0); return; }
    const duration = 1200;
    const startTime = performance.now();
    // easeInOutQuart: slow start → fast middle → graceful stop
    const easeInOutQuart = (t) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    let rafId;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setAnimatedScore(Math.round(easeInOutQuart(progress) * matchValue));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [matchValue]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
          <span className="material-symbols-outlined text-[var(--danger)] text-6xl mb-4">cloud_off</span>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Sync Error</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-md">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry Sync</button>
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="text-center py-20 px-4">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No analysis yet</h2>
          <p className="text-[var(--text-secondary)] mb-8">Start by adding your skills and selecting a job role.</p>
          <button onClick={() => navigate('/skill-input')} className="btn-primary">🚀 Analyze My Skills</button>
        </div>
      </Layout>
    );
  }

  // matchValue and count-up useEffect are now above the early returns
  const filteredMatched = filterSkills(analysis.matched);
  const filteredPartial = filterSkills(analysis.partialMatched);
  const filteredMissing = filterSkills(analysis.missing);

  const filteredRecommendations = (analysis.recommendations || []).filter(rec => {
    if (!globalSearch) return true;
    const skillMatch = (rec.skill || '').toLowerCase().includes(globalSearch);
    const titleMatch = (rec.courses?.[0] || '').toLowerCase().includes(globalSearch);
    return skillMatch || titleMatch;
  });

  const getProgressColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getColorClass = (score) => {
    if (score >= 80) return 'text-[var(--success)]';
    if (score >= 50) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
  };

  const getBadgeClass = (score) => {
    if (score >= 80) return 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]';
    if (score >= 50) return 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]';
    return 'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]';
  };

  const getLabel = (score) => {
    if (score >= 80) return 'OUTSTANDING';
    if (score >= 50) return 'GOOD PROGRESS';
    return 'GROWTH PHASE';
  };

  const totalSkillsCount = (analysis.matched?.length || 0) + (analysis.partialMatched?.length || 0) + (analysis.missing?.length || 0);

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6 items-start">
          
          {/* Hero Card - Readiness Score */}
          <div className="card w-full flex flex-col sm:flex-row items-center gap-8 card-hover">
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-40 h-40">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={getProgressColor(matchValue)} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(animatedScore / 100) * 314} 314`} transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getColorClass(matchValue)}`}>{animatedScore}%</span>
                </div>
              </div>
              <span className="mt-4 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">Readiness Score</span>
              <span className={`mt-2 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full ${getBadgeClass(matchValue)}`}>{getLabel(matchValue)}</span>
            </div>

            <div className="flex-1 flex flex-col w-full">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {matchValue >= 80 ? `Outstanding Work, ${userName?.split(' ')[0] || 'User'}!` : 
                 matchValue >= 50 ? `Good Progress, ${userName?.split(' ')[0] || 'User'}!` : 
                 `Let's Build Your Path, ${userName?.split(' ')[0] || 'User'}!`}
              </h2>
              <div className="bg-[var(--bg-page)] rounded-xl p-4 mt-3 flex-1 border border-[var(--border)]">
                <strong className="text-[var(--primary)] font-semibold block mb-1">AI Recommendation:</strong>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {analysis.aiInsight || `You have matched ${analysis.matched?.length || 0} skills. Master the remaining gaps to perfectly align with this role.`}
                </p>
              </div>
            </div>
          </div>
          
          {/* AI Career Recommendation — Premium Card */}
          {analysis.mlPrediction && (() => {
            const confidence = analysis.mlPrediction.confidence || 0;
            const circumference = 2 * Math.PI * 36;
            const dashOffset = circumference - (circumference * confidence) / 100;
            const topPreds = (analysis.mlPrediction.top_predictions || []).slice(1, 4);
            return (
              <div className="w-full rounded-[24px] overflow-hidden relative group">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B53F4] via-[#3B6EF7] to-[#8B5CF6]"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                
                <div className="relative z-10 p-7 flex flex-col sm:flex-row items-center gap-7">
                  {/* Confidence Ring */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                      <circle 
                        cx="40" cy="40" r="36" fill="none" 
                        stroke="white" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={circumference} 
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white text-xl font-black leading-none">{Math.round(confidence)}%</span>
                      <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest mt-0.5">Match</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className="material-symbols-outlined text-white/80 text-[18px]">auto_awesome</span>
                      <p className="text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">AI Career Recommendation</p>
                    </div>
                    <h4 className="text-[26px] font-black text-white leading-tight mb-3">
                      {analysis.mlPrediction.predicted_role}
                    </h4>
                    
                    {/* Alternative Paths */}
                    {topPreds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Also fits:</span>
                        {topPreds.map((pred, i) => (
                          <span key={i} className="bg-white/10 backdrop-blur-sm text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                            {Array.isArray(pred) ? pred[0] : (pred.role || pred)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button 
                    onClick={() => navigate('/skill-analysis')} 
                    className="bg-white text-[#1B53F4] font-bold text-[13px] px-6 py-3 rounded-2xl shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 flex-shrink-0"
                  >
                    Full Analysis
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Peer Benchmarking Insight */}
          <div className="w-full bg-white border border-[#E2E8F0] rounded-[var(--radius-card)] p-5 flex items-center gap-5 shadow-sm border-l-4 border-l-[#F59E0B]">
            <div className="w-12 h-12 rounded-full bg-[#FFF7ED] text-[#F59E0B] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <p className="text-[#F59E0B] text-[10px] font-black uppercase tracking-wider mb-1">Peer Benchmarking</p>
              <p className="text-[#475569] text-sm leading-snug">
                You have a <strong className="text-[#1A1D2E]">{matchValue}%</strong> match. 
                {analysis.missing?.length > 0 ? (
                  <> The top 10% of <strong className="text-[#1A1D2E]">{analysis.role || 'experts'}</strong> also know <strong className="text-[#1A1D2E]">{analysis.missing.slice(0, 2).join(' and ')}</strong>.</>
                ) : (
                  <> You are performing at a top-tier level compared to other <strong className="text-[#1A1D2E]">{analysis.role}</strong> candidates.</>
                )}
              </p>
            </div>
          </div>

          {/* Competency Analysis */}
          <div className="mt-2 w-full">
            <div className="flex justify-between items-center mb-6 px-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[22px] font-black text-[#1A1D2E]">Competency Analysis</h2>
                <button 
                  onClick={handleGenerateInterview}
                  className="bg-[var(--primary)] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm tracking-widest flex items-center gap-1 hover:bg-[#1541C4] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  TEST MY KNOWLEDGE
                </button>
              </div>
              <span className="bg-white text-[#9CA3AF] border border-[#E8ECF4] text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm tracking-widest">{totalSkillsCount} SKILLS TOTAL</span>
            </div>

            <div className="grid grid-cols-3 gap-4 items-stretch" style={{gridTemplateColumns: 'repeat(3, minmax(0, 260px))'}}>

              {/* MATCHED SKILLS */}
              <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#F0F0F0] flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#10B981]">Matched Skills</h4>
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center text-[11px] font-black">{filteredMatched.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {filteredMatched.map(s => (
                    <div key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-semibold w-fit" style={{fontSize: s.length > 16 ? '11px' : '12px'}}>
                      <span className="material-symbols-outlined shrink-0" style={{fontSize: '14px'}}>check_circle</span>
                      {s}
                    </div>
                  ))}
                  {filteredMatched.length === 0 && <p className="text-[11px] text-[#10B981]/40 italic">None matched yet</p>}
                </div>
              </div>

              {/* PARTIAL SKILLS */}
              <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#F0F0F0] flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#F97316]">Partial Skills</h4>
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-[11px] font-black">{filteredPartial.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {filteredPartial.map(s => (
                    <div key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEF9C3] text-[#CA8A04] font-semibold w-fit" style={{fontSize: s.length > 16 ? '11px' : '12px'}}>
                      <span className="material-symbols-outlined shrink-0" style={{fontSize: '14px'}}>pending</span>
                      {s}
                    </div>
                  ))}
                  {filteredPartial.length === 0 && <p className="text-[11px] text-[#F97316]/40 italic">No partial matches</p>}
                </div>
              </div>

              {/* MISSING SKILLS */}
              <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#F0F0F0] flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#EF4444]">Missing Skills</h4>
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-[11px] font-black">{filteredMissing.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {filteredMissing.map(s => (
                    <div key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEE2E2] text-[#DC2626] font-semibold w-fit max-w-full" style={{fontSize: s.length > 16 ? '11px' : '12px'}}>
                      <span className="material-symbols-outlined shrink-0" style={{fontSize: '14px'}}>error</span>
                      <span className="break-words">{s}</span>
                    </div>
                  ))}
                  {filteredMissing.length === 0 && <p className="text-[11px] text-[#EF4444]/40 italic">No gaps detected</p>}
                </div>
              </div>

            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-8 w-full">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-[22px] font-black text-[#1A1D2E]">Recommended Next Steps</h2>
              <button onClick={() => navigate('/recommendations')} className="text-[#1B53F4] text-[13px] font-bold hover:underline">View Full Path</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {filteredRecommendations.slice(0, 2).map((rec, i) => {
                const badgeBg = getBadgeColor(rec.skill || rec.title);
                const { duration, rating, difficulty } = getStableCourseMeta(rec.skill || rec.title);
                const displayTitle = rec.courses?.[0]?.split(' - ')?.[0] || `Mastering ${rec.skill || 'Skill'}`;
                const platform = rec.courses?.[0]?.split(' - ')?.[1] || 'Coursera';
                const searchBase = platform.toLowerCase().includes('udemy')
                  ? 'https://www.udemy.com/courses/search/?q='
                  : 'https://www.coursera.org/search?query=';
                const courseUrl = `${searchBase}${encodeURIComponent(displayTitle)}`;
                let safeDesc = rec.learningPath || rec.description || `Master ${rec.skill || 'this skill'} through systematic practice.`;
                if (safeDesc.includes('http')) safeDesc = `Master ${rec.skill || 'this skill'} through comprehensive lessons and hands-on practice.`;

                return (
                  <div
                    key={i}
                    className="group bg-white rounded-[32px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col h-full relative border border-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => navigate('/recommendations')}
                  >
                    {/* Top Row: Badges + Mark Done */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-[#EEF3FF] text-[#1B53F4] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                          {platform}
                        </span>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                          difficulty === 'Beginner' ? 'bg-[#EDFBF0] text-[#46CB5C]' :
                          difficulty === 'Intermediate' ? 'bg-[#EEF3FF] text-[#1B53F4]' :
                          'bg-[#F5F3FF] text-[#8B5CF6]'
                        }`}>
                          {difficulty}
                        </span>
                      </div>
                      <button
                        onClick={(e) => toggleComplete(displayTitle, e, rec.skill)}
                        disabled={completingSkill === displayTitle}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer z-10 ${
                          completedCourses.includes(displayTitle)
                          ? 'bg-[#EDFBF0] text-[#46CB5C] border border-[#46CB5C]/30'
                          : completingSkill === displayTitle
                          ? 'bg-[#F0F4FF] text-[#6B7280] border border-transparent animate-pulse'
                          : 'bg-[#F0F4FF] text-[#6B7280] border border-transparent hover:bg-[#E8EDFF]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {completingSkill === displayTitle ? 'sync' : completedCourses.includes(displayTitle) ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        {completingSkill === displayTitle ? 'Updating...' : completedCourses.includes(displayTitle) ? 'Completed' : 'Mark Done'}
                      </button>
                    </div>

                    {/* Main Content with Vertical Bar */}
                    <div className="flex gap-4 mb-6 flex-1 min-w-0">
                      <div className={`w-[4px] rounded-full flex-shrink-0 ${badgeBg}`} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="text-[19px] font-bold text-[#1A1D2E] leading-snug mb-2 truncate">{displayTitle}</h3>
                        <p className="text-[13px] text-[#9CA3AF] line-clamp-2 leading-relaxed">{safeDesc}</p>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between mt-auto pt-2 gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#FBBF24] text-[16px]">★</span>
                        <span className="text-[13px] font-bold text-[#1A1D2E]">{rating}</span>
                        <span className="text-[13px] text-[#9CA3AF] ml-1 whitespace-nowrap">• {duration}h</span>
                      </div>
                      <a
                        href={courseUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 bg-[#FBBF24] text-[#1A1D2E] text-[13px] font-bold px-4 py-2.5 rounded-full flex items-center gap-1 hover:opacity-90 transition-opacity shadow-[0_8px_16px_-4px_rgba(251,191,36,0.5)] whitespace-nowrap"
                      >
                        Get Course <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
          {/* ATS Optimization Score */}
          <div className="bg-white rounded-[var(--radius-card)] p-6 shadow-sm border border-[#E8ECF4] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">ATS Optimization</p>
                <h3 className="text-2xl font-black text-[#1A1D2E]">
                  {analysis.atsAnalysis ? `${analysis.atsAnalysis.score}%` : '—'}
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${analysis.atsAnalysis ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FFF7ED] text-[#F59E0B]'}`}>
                <span className="material-symbols-outlined text-[24px]">{analysis.atsAnalysis ? 'verified' : 'sync'}</span>
              </div>
            </div>
            
            {analysis.atsAnalysis ? (
              <>
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#16A34A] transition-all duration-1000" 
                      style={{ width: `${analysis.atsAnalysis.score}%` }}
                    ></div>
                  </div>
                  
                  {analysis.atsAnalysis.suggestions?.length > 0 && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                      <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#16A34A]">info</span>
                        Quick Fixes
                      </p>
                      <ul className="space-y-1.5">
                        {analysis.atsAnalysis.suggestions.map((s, i) => (
                          <li key={i} className="text-[11px] text-[#475569] font-medium leading-tight flex gap-1.5">
                            <span className="text-[#16A34A]">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {analysis.atsAnalysis.missingKeywords?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                    <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">Missing Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.atsAnalysis.missingKeywords.slice(0, 4).map((k, i) => (
                        <span key={i} className="bg-white border border-[#E2E8F0] text-[#64748B] text-[9px] font-bold px-2 py-0.5 rounded-full">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-[12px] text-[#64748B] mb-3">Re-run your analysis to unlock ATS scoring.</p>
                <button 
                  onClick={() => navigate('/skill-input')}
                  className="bg-[#16A34A] text-white text-[11px] font-bold px-4 py-2 rounded-full hover:bg-[#15803D] transition-colors"
                >
                  Re-Analyze Now
                </button>
              </div>
            )}
          </div>

          <div className="card flex items-center gap-5 border-l-4 border-l-[var(--primary)]">
            <div className="p-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">analytics</span></div>
            <div><p className="text-[var(--text-muted)] text-[10px] font-black uppercase mb-1">Analyses Done</p><h3 className="text-3xl font-extrabold">{dashData?.totalAnalyses || 1}</h3></div>
          </div>
          <div className="card flex items-center gap-5 border-l-4 border-l-[var(--danger)]">
            <div className="p-3 bg-[var(--danger-light)] text-[var(--danger)] rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">auto_stories</span></div>
            <div><p className="text-[var(--text-muted)] text-[10px] font-black uppercase mb-1">Missing Skills</p><h3 className="text-3xl font-extrabold">{analysis.missing?.length || 0}</h3></div>
          </div>
          <div className="card">
            <h3 className="section-title mb-5">Recent Activity</h3>
            <div className="flex flex-col gap-1">
              {dashData?.rolesSummary?.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-[var(--bg-page)] rounded-xl transition-all">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">history_edu</span></div>
                  <div><p className="text-sm font-bold">{r.role}</p><p className={`text-[10px] font-bold ${getColorClass(r.matchPercentage)}`}>{(r.matchPercentage || 0).toFixed(1)}% Score</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--primary)] rounded-2xl p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_repeat</span> NEXT STEP</span>
              <h4 className="text-xl font-bold text-white mb-6 leading-tight">Build your Learning Path</h4>
              <button onClick={() => navigate('/learning-path')} className="bg-white text-[var(--primary)] font-bold rounded-xl px-5 py-2.5 text-xs uppercase hover:-translate-y-1 transition-all">Go To Path</button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* MOCK INTERVIEW MODAL */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setShowMockModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F0F4FF] text-[#1B53F4] hover:bg-[#E0E7FF] transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#E0E7FF] text-[#1B53F4] flex items-center justify-center">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1D2E]">AI Mock Interview Prep</h3>
                <p className="text-xs text-[#6B7280]">Targeting your specific skill gaps</p>
              </div>
            </div>

            {isMockLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B53F4] mb-4"></div>
                <p className="text-sm font-semibold text-[#6B7280] animate-pulse">Generating custom interview questions...</p>
              </div>
            ) : mockQuestions && mockQuestions.length > 0 ? (
              <div className="flex flex-col gap-4">
                {mockQuestions.map((mq, idx) => (
                  <InterviewQuestionCard key={idx} mq={mq} idx={idx} />
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No questions could be generated.</p>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
};
const InterviewQuestionCard = ({ mq, idx }) => {
  const [showAnswer, setShowAnswer] = React.useState(false);
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-[#DBEAFE] text-[#1E3A8A] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
          {mq.skill || 'General'}
        </span>
      </div>
      <p className="text-[#1E293B] font-semibold text-sm mb-3">
        <span className="text-[#94A3B8] font-black mr-2">Q{idx + 1}.</span>
        {mq.question}
      </p>
      <div className="flex flex-col gap-2">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#475569] flex gap-2 items-start">
          <span className="material-symbols-outlined text-[#F59E0B] text-[16px]">lightbulb</span>
          <span><strong className="text-[#334155]">Hint:</strong> {mq.hint}</span>
        </div>
        
        {mq.suggestedAnswer && (
          <div className="mt-1">
            <button 
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-[10px] font-black uppercase tracking-wider text-[#1B53F4] hover:underline flex items-center gap-1"
            >
              {showAnswer ? 'Hide Answer' : 'Show Suggested Answer'}
              <span className="material-symbols-outlined text-[14px]">
                {showAnswer ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
            
            {showAnswer && (
              <div className="mt-2 bg-[#F0F4FF] border border-[#D0D7FF] rounded-lg p-3 text-xs text-[#1E3A8A] animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="leading-relaxed">
                  <strong className="block mb-1 opacity-70">EXPERT RESPONSE:</strong>
                  {mq.suggestedAnswer}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
