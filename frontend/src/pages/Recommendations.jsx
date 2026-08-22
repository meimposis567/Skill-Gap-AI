import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getStoredAnalysis, saveLastAnalysis, getAuth, saveCompletedCourses, getCompletedCourses } from '../utils/helpers';
import { masterSkill, unmasterSkill } from '../services/api';

const getStableCourseMeta = (seedText) => {
  const seed = [...(seedText || '')].reduce((total, char) => total + char.charCodeAt(0), 0);
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  return {
    duration: 5 + (seed % 11),
    rating: (4.2 + ((seed % 8) * 0.1)).toFixed(1),
    difficulty: difficulties[seed % 3]
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

const Recommendations = () => {
  const [analysis, setAnalysis] = useState(() => getStoredAnalysis());
  const [sortBy, setSortBy] = useState('Most Impactful');
  const [filterFree, setFilterFree] = useState(false);
  const [filterPaid, setFilterPaid] = useState(true);
  const [completedCourses, setCompletedCourses] = useState(() => JSON.parse(localStorage.getItem('completedCourses') || '[]'));
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [completingSkill, setCompletingSkill] = useState(null);
  const { userId } = getAuth();

  useEffect(() => {
    // Sync completedCourses with actual matched skills in the analysis
    // If a skill is in recommendations (a gap), any course for it in localStorage should be removed
    // as it's clearly not 'mastered' in the current analysis context.
    if (analysis && completedCourses.length > 0) {
      const gapSkills = new Set((analysis.recommendations || []).map(r => (r.skill || '').toLowerCase()));
      const filtered = completedCourses.filter(title => {
        const course = courses.find(c => c.title === title);
        if (course && gapSkills.has(course.skill?.toLowerCase())) return false;
        return true;
      });
      
      if (filtered.length !== completedCourses.length) {
        setCompletedCourses(filtered);
        saveCompletedCourses(filtered);
      }
    }
  }, [analysis]);

  const toggleComplete = async (title, skillName) => {
    if (completingSkill || !userId || !skillName) return;
    
    const isCompleted = completedCourses.includes(title);
    setCompletingSkill(title);

    try {
      if (!isCompleted) {
        const res = await masterSkill({ userId, skillName, role: analysis?.role });
        const newCompleted = [...completedCourses, title];
        saveCompletedCourses(newCompleted);
        setCompletedCourses(newCompleted);
        if (res.data?.latest) {
          setAnalysis(saveLastAnalysis(res.data.latest));
        }
      } else {
        const res = await unmasterSkill({ userId, skillName, role: analysis?.role });
        const newCompleted = completedCourses.filter(t => t !== title);
        saveCompletedCourses(newCompleted);
        setCompletedCourses(newCompleted);
        if (res.data?.latest) {
          setAnalysis(saveLastAnalysis(res.data.latest));
        }
      }
    } catch (err) {
      console.error('Skill action failed:', err);
    } finally {
      setCompletingSkill(null);
    }
  };

  if (!analysis) {
    return (
      <Layout>
        <div className="text-center py-20 px-4">
          <div className="text-6xl mb-6">📚</div>
          <h2 className="text-[28px] font-bold text-[var(--text-primary)] mb-2">No recommendations yet</h2>
          <p className="text-[var(--text-secondary)] mb-8">Run an analysis to get custom AI course recommendations.</p>
        </div>
      </Layout>
    );
  }

  // Build course list
  let courses = analysis?.recommendations?.length > 0
    ? analysis.recommendations.flatMap(rec => (rec.courses || []).map(courseStr => {
        const [title, platform] = (courseStr || '').split(' - ');
        const cleanTitle = title || `Mastering ${rec.skill}`;
        const cleanPlatform = platform || 'Coursera';
        const isPaid = !cleanTitle.toLowerCase().includes('free') && !cleanPlatform.toLowerCase().includes('youtube');
        const { duration, rating, difficulty } = getStableCourseMeta(`${rec.skill}-${cleanTitle}-${cleanPlatform}`);

        const searchBase = cleanPlatform.toLowerCase().includes('udemy')
          ? 'https://www.udemy.com/courses/search/?q='
          : cleanPlatform.toLowerCase().includes('coursera')
          ? 'https://www.coursera.org/search?query='
          : 'https://www.google.com/search?q=';

        return {
          title: cleanTitle,
          platform: cleanPlatform,
          skill: rec.skill,
          description: rec.learningPath || `Mastering ${rec.skill} through systematic practice.`,
          duration,
          rating,
          difficulty,
          isPaid,
          url: `${searchBase}${encodeURIComponent(cleanTitle)}`
        };
      }))
    : [];

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const globalSearch = queryParams.get('q') || '';

  const filteredCourses = courses.filter(course => {
    const matchesFilters = (filterFree && !course.isPaid) || (filterPaid && course.isPaid);
    if (!matchesFilters) return false;
    
    if (globalSearch) {
      const searchStr = `${course.title} ${course.platform} ${course.skill}`.toLowerCase();
      return searchStr.includes(globalSearch.toLowerCase());
    }
    return true;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'Rating (Highest)') return b.rating - a.rating;
    if (sortBy === 'Duration (Shortest)') return a.duration - b.duration;
    return 0;
  });

  const fallbackTipSkill = analysis.missing?.[0] || 'Core Skills';

  // Group courses by skill
  const groupedCourses = sortedCourses.reduce((acc, course) => {
    const key = course.skill || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  const skillEntries = Object.entries(groupedCourses);

  return (
    <Layout>
      <div className="w-full pb-10">

        {/* ── PAGE HEADER ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[28px] font-bold text-[#1A1D2E]">Recommended Courses</h2>
              {completedCourses.length > 0 && (
                <span className="bg-[#EDFBF0] text-[#46CB5C] text-[12px] font-bold px-3 py-1 rounded-full border border-[#46CB5C]/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  Score Boost Active
                </span>
              )}
            </div>
            <p className="text-[var(--text-secondary)] text-[15px]">
              Curated based on your <span className="font-bold text-[#1B53F4]">{Math.min(100, Math.round(analysis.matchPercentage))}%</span> skill match for <span className="font-bold">{analysis.role}</span>
            </p>
          </div>
          <button 
            onClick={() => setShowCurriculum(true)}
            className="bg-[#1B53F4] text-white px-6 py-3 rounded-full text-[14px] font-bold flex items-center gap-2 hover:bg-[#1541D0] transition-all shadow-lg shadow-[#1B53F4]/20 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            Generate My Custom Curriculum
          </button>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between mb-8 shadow-sm gap-4">
          <div className="flex items-center gap-8 px-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={filterFree}
                  onChange={e => setFilterFree(e.target.checked)}
                  className="peer w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-[#1B53F4] checked:border-[#1B53F4] appearance-none cursor-pointer transition-all"
                />
                <span className="material-symbols-outlined absolute text-white text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
              </div>
              <span className="text-[14px] font-bold text-[#1A1D2E] group-hover:text-[#1B53F4] transition-colors">Free</span>
            </label>
            
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={filterPaid}
                  onChange={e => setFilterPaid(e.target.checked)}
                  className="peer w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-[#1B53F4] checked:border-[#1B53F4] appearance-none cursor-pointer transition-all"
                />
                <span className="material-symbols-outlined absolute text-white text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
              </div>
              <span className="text-[14px] font-bold text-[#1A1D2E] group-hover:text-[#1B53F4] transition-colors">Paid / Certification</span>
            </label>
          </div>
          
          <div className="flex items-center gap-3 px-2 bg-[#F9FAFB] md:bg-transparent p-2 md:p-0 rounded-xl">
            <span className="text-[13px] text-[#6B7280] font-bold uppercase tracking-wider">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white md:bg-[#F0F4FF] border border-[#E8ECF4] text-[#1A1D2E] rounded-full px-4 py-2 text-[13px] font-bold outline-none cursor-pointer appearance-none pr-10 hover:border-[#1B53F4] transition-all shadow-sm"
              >
                <option>Most Impactful</option>
                <option>Rating (Highest)</option>
                <option>Duration (Shortest)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#1B53F4] pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="w-full lg:w-[240px] flex-shrink-0">
            <div className="bg-[#EEF3FF] border-l-[4px] border-l-[#1B53F4] rounded-r-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#1B53F4] text-[20px]">lightbulb</span>
                <span className="text-[#1B53F4] font-bold text-[14px]">AI Tip</span>
              </div>
              <p className="text-[#1A1D2E] text-[13px] leading-relaxed">
                Focusing on <span className="font-bold text-[#1B53F4]">{fallbackTipSkill}</span> will efficiently boost your overall match score.
              </p>
            </div>
          </aside>

          {/* ── COURSE GRID ── */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {sortedCourses.map((course, idx) => {
                const badgeBg = getBadgeColor(course.skill || course.title);
                let safeDesc = course.description || `Master this skill through systematic practice.`;
                if (safeDesc.includes('http')) {
                  safeDesc = `Master ${course.skill || 'this skill'} through comprehensive lessons and hands-on practice.`;
                }

                return (
                  <div
                    key={idx}
                    className="group bg-white rounded-[32px] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col h-full relative border border-gray-100 overflow-hidden"
                  >
                    {/* Top Row: Tag & Complete Button */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-[#EEF3FF] text-[#1B53F4] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                          {course.platform}
                        </span>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                          course.difficulty === 'Beginner' ? 'bg-[#EDFBF0] text-[#46CB5C]' :
                          course.difficulty === 'Intermediate' ? 'bg-[#EEF3FF] text-[#1B53F4]' :
                          'bg-[#F5F3FF] text-[#8B5CF6]'
                        }`}>
                          {course.difficulty}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleComplete(course.title, course.skill); }}
                        disabled={completingSkill === course.title}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer z-10 ${
                          completedCourses.includes(course.title) 
                          ? 'bg-[#EDFBF0] text-[#46CB5C] border border-[#46CB5C]/30 hover:bg-[#dcfce3]' 
                          : completingSkill === course.title
                          ? 'bg-[#F0F4FF] text-[#6B7280] border border-transparent animate-pulse'
                          : 'bg-[#F0F4FF] text-[#6B7280] hover:bg-[#E8ECF4] border border-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {completingSkill === course.title ? 'sync' : (completedCourses.includes(course.title) ? 'check_circle' : 'radio_button_unchecked')}
                        </span>
                        {completingSkill === course.title ? 'Updating...' : (completedCourses.includes(course.title) ? 'Completed' : 'Mark Done')}
                      </button>
                    </div>

                    {/* Main Content with Vertical Bar */}
                    <div className="flex gap-4 mb-6 flex-1 min-w-0">
                      {/* Vertical Bar */}
                      <div className={`w-[4px] rounded-full flex-shrink-0 ${badgeBg}`} />
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="text-[19px] font-bold text-[#1A1D2E] leading-snug mb-2 truncate">
                          {course.title}
                        </h3>
                        <p className="text-[13px] text-[#9CA3AF] line-clamp-2 leading-relaxed break-all">
                          {safeDesc}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between mt-auto pt-2 gap-3">
                      <div className="min-w-0 flex-shrink">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#FBBF24] text-[16px]">★</span>
                          <span className="text-[13px] font-bold text-[#1A1D2E]">{course.rating}</span>
                          <span className="text-[13px] text-[#9CA3AF] ml-1 whitespace-nowrap">• {course.duration}h</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <a 
                        href={course.url} target="_blank" rel="noreferrer"
                        className="flex-shrink-0 bg-[#FBBF24] text-[#1A1D2E] text-[13px] font-bold px-4 py-2.5 rounded-full flex items-center gap-1 hover:opacity-90 transition-opacity shadow-[0_8px_16px_-4px_rgba(251,191,36,0.5)] whitespace-nowrap"
                      >
                        Get Course <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </a>
                    </div>
                  </div>
                );
              })}

              {sortedCourses.length === 0 && (
                <div className="col-span-full py-20 text-center bg-[#F0F4FF] rounded-2xl border border-dashed border-[#1B53F4] opacity-80">
                  <span className="material-symbols-outlined text-[#1B53F4] text-5xl block mb-3">school</span>
                  <p className="text-[#1B53F4] font-medium">No courses match your active filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CURRICULUM MODAL ── */}
      {showCurriculum && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          <div 
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md transition-opacity"
            onClick={() => setShowCurriculum(false)}
          ></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
            {/* Header Area */}
            <div className="relative p-8 md:p-10 border-b border-gray-100 bg-gradient-to-r from-[#F8FAFC] to-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#1B53F4]/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative flex items-start justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-1 bg-[#1B53F4] rounded-full"></div>
                    <span className="text-[#1B53F4] font-black uppercase tracking-[0.2em] text-[11px]">Personalized Roadmap</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-[#1A1D2E] mb-3 leading-tight">Your Path to Mastery as a <span className="text-[#1B53F4]">{analysis.role}</span></h3>
                  <p className="text-[15px] text-[#64748B] leading-relaxed">
                    We've analyzed your skill gaps and curated a systematic learning journey. Complete these 4 milestones to achieve industry-standard readiness.
                  </p>
                </div>
                <button 
                  onClick={() => setShowCurriculum(false)}
                  className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1B53F4] hover:shadow-lg transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
              <div className="relative max-w-3xl mx-auto">
                {/* Visual Timeline Path */}
                <div className="absolute left-[39px] top-6 bottom-6 w-[3px] bg-[#F1F5F9]">
                   <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-[#1B53F4] to-[#4AACEA] rounded-full"></div>
                </div>
                
                <div className="space-y-12">
                  {sortedCourses.slice(0, 4).map((course, i) => (
                    <div key={i} className="relative group">
                      {/* Milestone Marker */}
                      <div className="absolute left-0 top-0 flex items-center justify-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 ${
                          i === 0 ? 'bg-[#1B53F4] text-white shadow-[#1B53F4]/20' : 
                          i === 1 ? 'bg-white border-2 border-[#1B53F4] text-[#1B53F4]' :
                          'bg-white border-2 border-[#F1F5F9] text-[#94A3B8]'
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 mb-0.5">Module</span>
                            <span className="text-2xl font-black leading-none">0{i + 1}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-28">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                            course.difficulty === 'Beginner' ? 'bg-[#DCFCE7] text-[#166534]' :
                            course.difficulty === 'Intermediate' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                            'bg-[#F3E8FF] text-[#6B21A8]'
                          }`}>
                            {course.difficulty}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wide">{course.platform}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wide">{course.duration}h</span>
                        </div>
                        
                        <div className="bg-white border border-[#F1F5F9] rounded-[32px] p-6 hover:border-[#1B53F4]/30 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
                          <h4 className="text-[20px] font-bold text-[#1A1D2E] mb-3 group-hover:text-[#1B53F4] transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-[14px] text-[#64748B] leading-relaxed mb-6 break-words line-clamp-2">
                             Systematically master <span className="text-[#1B53F4] font-bold">{course.skill}</span> and related core concepts to boost your profile readiness by approximately 2.5%.
                          </p>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#F59E0B] material-symbols-outlined text-[18px]">star</span>
                              <span className="text-[14px] font-bold text-[#1A1D2E]">{course.rating}</span>
                            </div>
                            <a 
                              href={course.url} target="_blank" rel="noreferrer"
                              className="bg-[#F8FAFC] hover:bg-[#1B53F4] text-[#1B53F4] hover:text-white px-5 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 transition-all group/btn"
                            >
                              Explore Module 
                              <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer Area */}
            <div className="p-8 md:px-12 bg-[#F8FAFC] border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1B53F4]">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1A1D2E]">Verified Curriculum</p>
                  <p className="text-[12px] text-[#64748B]">Aligned with current industry requirements</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCurriculum(false)}
                className="w-full sm:w-auto bg-[#1B53F4] text-white px-10 py-4 rounded-[20px] text-[15px] font-bold hover:bg-[#1541D0] transition-all shadow-xl shadow-[#1B53F4]/20 active:scale-95"
              >
                Launch My Learning Path
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Recommendations;
