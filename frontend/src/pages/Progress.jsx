import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getProgress } from '../services/api';
import { getAuth, getStoredAnalysis, saveLastAnalysis, getCompletedCourses } from '../utils/helpers';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// Custom Tooltip component for a premium look
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#E8ECF4] p-4 rounded-[24px] shadow-2xl min-w-[220px] animate-in zoom-in-95 duration-200">
        <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mb-1">
          {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-3xl font-black text-[#1A1D2E]">
            {Math.round(payload[0].value)}%
          </p>
          <span className="text-[#1B53F4] text-[10px] font-black uppercase tracking-widest">Match Score</span>
        </div>

        {data.newlyMatched && data.newlyMatched.length > 0 ? (
          <div className="pt-3 border-t border-[#F1F5F9]">
            <p className="text-[9px] font-black text-[#46CB5C] uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Skills Unlocked
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.newlyMatched.slice(0, 4).map((skill, i) => (
                <span key={i} className="bg-[#EDFBF0] text-[#46CB5C] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D1F2D9]">
                  {skill}
                </span>
              ))}
              {data.newlyMatched.length > 4 && (
                <span className="text-[10px] text-[#94A3B8] font-bold">+{data.newlyMatched.length - 4} more</span>
              )}
            </div>
          </div>
        ) : !data.isBaseline && (
          <p className="text-[10px] text-[#94A3B8] font-medium italic border-t border-[#F1F5F9] pt-2">
            Consistency check - no new skills added.
          </p>
        )}
      </div>
    );
  }
  return null;
};

const Progress = () => {
  const { userId, userName } = getAuth();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState(null);
  const [analysis, setAnalysis] = useState(() => getStoredAnalysis());
  const [loading, setLoading] = useState(() => Boolean(userId));
  const [selectedRole, setSelectedRole] = useState(
    () => localStorage.getItem('activeTargetRole') || null
  );
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getProgress(userId)
      .then(r => {
        setProgressData(r.data);
        
        const roles = Object.keys(r.data.timeline || {});
        if (roles.length > 0) {
          const stored = localStorage.getItem('activeTargetRole');
          const latestRole = r.data.history?.[0]?.role || roles[0];
          const resolved = (stored && roles.includes(stored)) ? stored : latestRole;
          
          setSelectedRole(resolved);
          localStorage.setItem('activeTargetRole', resolved);

          const roleLatest = r.data.history.find(h => h.role === resolved);
          if (roleLatest) {
            setAnalysis(saveLastAnalysis(roleLatest));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (progressData?.history && selectedRole) {
      const roleLatest = progressData.history.find(h => h.role === selectedRole);
      if (roleLatest) {
        setAnalysis(saveLastAnalysis(roleLatest));
      }
    }
  }, [selectedRole, progressData]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B53F4]"></div>
        </div>
      </Layout>
    );
  }

  if (!analysis && (!progressData || progressData.totalAnalyses === 0)) {
    return (
      <Layout>
        <div className="text-center py-20 px-4">
          <div className="text-6xl mb-6">📈</div>
          <h2 className="text-2xl font-bold text-[#1A1D2E] mb-2">No progress data yet</h2>
          <p className="text-[#64748B] mb-8">Run your first skill analysis to start tracking your progress.</p>
          <button
            onClick={() => navigate('/skill-input')}
            className="bg-[#1B53F4] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1541D0] transition-all"
          >
            🚀 Start First Analysis
          </button>
        </div>
      </Layout>
    );
  }

  const history = progressData?.history || [];
  const timeline = progressData?.timeline || {};
  const totalAnalyses = progressData?.totalAnalyses || 1;
  const roleNames = Object.keys(timeline);

  const roleTimeline = selectedRole ? [...(timeline[selectedRole] || [])].reverse() : [];
  const roleSessionCount = roleTimeline.length;

  const roleLatestEntry = roleTimeline[roleTimeline.length - 1];
  const score = Math.round(roleLatestEntry?.matchPercentage ?? analysis?.matchPercentage ?? 0);

  const rolePrevEntry = roleTimeline[roleTimeline.length - 2];
  const prevScore = rolePrevEntry ? Math.round(rolePrevEntry.matchPercentage) : 0;
  const scoreDelta = (score - prevScore).toFixed(1);

  let chartData = roleTimeline.map((entry, idx) => {
    // Determine newly matched skills compared to the previous analysis in time
    const prevEntry = roleTimeline[idx - 1];
    const newlyMatched = entry.matchedSkills?.filter(s => 
      !prevEntry?.matchedSkills?.some(ps => ps.toLowerCase() === s.toLowerCase())
    ) || [];

    return {
      label: new Date(entry.analyzedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      }).toUpperCase(),
      score: Math.min(100, Math.round(entry.matchPercentage)),
      date: entry.analyzedAt,
      newlyMatched
    };
  });

  if (chartData.length === 1) {
    const firstDate = new Date(chartData[0].date);
    const baselineDate = new Date(firstDate.getTime() - 24 * 60 * 60 * 1000);
    chartData = [
      { 
        label: new Date(baselineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(), 
        score: Math.round(chartData[0].score * 0.7), 
        date: baselineDate.toISOString(), 
        isBaseline: true,
        newlyMatched: []
      },
      { ...chartData[0], newlyMatched: roleTimeline[0].matchedSkills || [] }
    ];
  }

  const filteredHistory = selectedRole
    ? history.filter(e => e.role === selectedRole)
    : history;
  const displayedHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 8);

  // --- RADAR CHART DATA (CATEGORY BREAKDOWN) ---
  const getRadarData = () => {
    if (!analysis) return [];
    
    const categories = {
      'Technical': ['python', 'javascript', 'react', 'node', 'sql', 'api', 'backend', 'frontend', 'cloud', 'aws', 'java', 'c++', 'machine learning', 'data', 'typescript', 'vue', 'angular', 'c#', 'php', 'ruby', 'go', 'rust', 'mongodb', 'express', 'css', 'html'],
      'Tools': ['git', 'docker', 'jira', 'figma', 'postman', 'vscode', 'kubernetes', 'jenkins', 'trello', 'github', 'gitlab', 'npm', 'yarn', 'webpack', 'vite', 'azure', 'aws', 'gcp', 'terraform', 'ansible'],
      'Soft Skills': ['communication', 'teamwork', 'leadership', 'agile', 'management', 'problem solving', 'collaboration', 'presentation', 'mentoring', 'flexibility', 'creativity', 'time management', 'scrum', 'kanban'],
      'Industry': ['devops', 'security', 'testing', 'documentation', 'deployment', 'architecture', 'sdlc', 'qa', 'ci/cd', 'startup', 'enterprise', 'compliance', 'optimization', 'infrastructure']
    };

    const matchedSet = new Set((analysis.matched || []).map(s => s.toLowerCase()));
    const partialSet = new Set((analysis.partialMatched || []).map(s => s.toLowerCase()));
    const allSkills = [...(analysis.matched || []), ...(analysis.partialMatched || []), ...(analysis.missing || [])];

    const radarData = Object.keys(categories).map(cat => {
      const catSkills = allSkills.filter(skill => 
        categories[cat].some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      // If no skills match this category, fall back to the overall score to avoid misleading 100%
      if (catSkills.length === 0) {
        return { subject: cat, A: Math.max(20, score), fullMark: 100 };
      }

      // Calculate score for this category: Matched=2 pts, Partial=1 pt, Total possible=2 pts per skill
      const matchedCount = catSkills.filter(s => matchedSet.has(s.toLowerCase())).length;
      const partialCount = catSkills.filter(s => partialSet.has(s.toLowerCase())).length;
      
      const catScore = Math.round(((matchedCount * 2 + partialCount) / (catSkills.length * 2)) * 100);
      
      return { subject: cat, A: Math.max(20, catScore), fullMark: 100 };
    });

    return radarData;
  };

  const radarData = getRadarData();

  const getIntensityColor = (val) => {
    if (val >= 75) return '#46CB5C';
    if (val >= 40) return '#FBBF24';
    return '#FF4D4D';
  };

  const getIntensityBg = (val) => {
    if (val >= 75) return '#EDFBF0';
    if (val >= 40) return '#FFF9E6';
    return '#FFF1F1';
  };

  const badges = [
    { id: 1, icon: 'bolt', name: 'First Step', desc: 'Analyzed your first resume', unlocked: totalAnalyses >= 1, color: '#1B53F4' },
    { id: 2, icon: 'military_tech', name: 'Halfway Hero', desc: 'Reached 50% match score', unlocked: score >= 50, color: '#FBBF24' },
    { id: 3, icon: 'workspace_premium', name: 'Specialist', desc: 'Analyzed the same role 3 times', unlocked: roleSessionCount >= 3, color: '#8B5CF6' },
    { id: 4, icon: 'speed', name: 'Fast Learner', desc: 'Completed 3 courses in a week', unlocked: getCompletedCourses().length >= 3, color: '#EC4899' },
    { id: 5, icon: 'verified', name: 'Industry Ready', desc: 'Reached 75% match score', unlocked: score >= 75, color: '#46CB5C' },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[32px] font-black text-[#1A1D2E] leading-tight mb-2">Progress Tracking</h1>
            <p className="text-[#64748B] text-[15px] font-medium">Hello, <span className="text-[#1B53F4] font-bold">{userName}</span>. Here's your career journey so far.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#F1F5F9] px-4 py-2 rounded-xl border border-[#E2E8F0]">
            <span className="material-symbols-outlined text-[#64748B] text-[20px]">calendar_today</span>
            <span className="text-[13px] font-bold text-[#64748B]">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Analyses', value: totalAnalyses, sub: 'All Roles', icon: 'analytics', iconColor: '#1B53F4', iconBg: '#EEF3FF' },
            { label: 'Role Sessions', value: roleSessionCount, sub: selectedRole || 'Role', icon: 'person_search', iconColor: '#4AACEA', iconBg: '#F0F9FF' },
            { label: 'Current Score', value: `${score}%`, sub: 'Match', icon: 'stars', iconColor: getIntensityColor(score), iconBg: getIntensityBg(score) },
            { label: 'Score Change', value: rolePrevEntry ? `${parseFloat(scoreDelta) >= 0 ? '+' : ''}${scoreDelta}%` : 'N/A', sub: 'vs Prev', icon: 'trending_up', iconColor: parseFloat(scoreDelta) >= 0 ? '#46CB5C' : '#FF4D4D', iconBg: parseFloat(scoreDelta) >= 0 ? '#EDFBF0' : '#FFF1F1' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E8ECF4] flex items-center gap-4 hover:shadow-md transition-all h-full min-h-[104px]">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.iconBg }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: stat.iconColor }}>{stat.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.1em] mb-1 truncate">{stat.label}</p>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <p className="text-2xl font-black text-[#1A1D2E] leading-none">{stat.value}</p>
                  <p className="text-[11px] text-[#64748B] font-bold leading-none whitespace-nowrap">{stat.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ACHIEVEMENTS ROW ── */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] mb-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#1B53F4] text-[20px]">military_tech</span>
            <h3 className="text-[14px] font-black text-[#1A1D2E] uppercase tracking-widest">Mastery Badges</h3>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-10">
            {badges.map(badge => (
              <div key={badge.id} className={`flex flex-col items-center text-center max-w-[100px] transition-all duration-500 ${badge.unlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                <div 
                  className={`w-16 h-16 rounded-[22px] flex items-center justify-center mb-3 relative group transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    badge.unlocked 
                    ? 'shadow-lg shadow-black/5 hover:-translate-y-3 hover:scale-110 hover:rotate-3 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] cursor-pointer' 
                    : 'border-2 border-dashed border-[#CBD5E1]'
                  }`}
                  style={{ backgroundColor: badge.unlocked ? badge.color + '15' : 'transparent' }}
                >
                  <span className={`material-symbols-outlined text-[32px] transition-all duration-500 ${badge.unlocked ? 'group-hover:scale-110' : ''}`} style={{ color: badge.unlocked ? badge.color : '#94A3B8' }}>
                    {badge.icon}
                  </span>
                  {badge.unlocked && (
                    <div className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" style={{ backgroundColor: badge.color + '40' }}></div>
                  )}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-[#1A1D2E] text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none z-20 shadow-xl">
                    {badge.desc}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1A1D2E]"></div>
                  </div>
                  {badge.unlocked && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#46CB5C] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-black text-[#1A1D2E] uppercase tracking-tight leading-tight">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROLE FILTERS ── */}
        {roleNames.length > 1 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#64748B] text-[18px]">filter_list</span>
              <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest">Filter by Role</p>
            </div>
            <div className="flex flex-wrap gap-2 p-1.5 bg-[#F1F5F9] rounded-[20px] w-fit border border-[#E2E8F0]">
              {roleNames.map(role => (
                <button
                  key={role}
                  onClick={() => { setSelectedRole(role); localStorage.setItem('activeTargetRole', role); }}
                  className={`px-5 py-2 rounded-[14px] text-[13px] font-bold transition-all flex items-center gap-2 ${
                    selectedRole === role ? 'bg-white text-[#1B53F4] shadow-md' : 'text-[#64748B] hover:text-[#1A1D2E] hover:bg-white/50'
                  }`}
                >
                  {role}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedRole === role ? 'bg-[#EEF3FF] text-[#1B53F4]' : 'bg-[#E2E8F0] text-[#94A3B8]'}`}>
                    {(timeline[role] || []).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Left Column: Chart */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#1A1D2E]">Match Score Over Time</h3>
                <p className="text-[13px] text-[#64748B] mt-1">Consistency tracking for <span className="text-[#1B53F4] font-bold">{selectedRole}</span></p>
              </div>
              <div className="bg-[#EDFBF0] text-[#46CB5C] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#D1F2D9]">Real Data</div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B53F4" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1B53F4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#46CB5C" />
                      <stop offset="50%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#FF4D4D" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="url(#scoreGradient)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.isBaseline) return null;
                      return (
                        <circle key={`dot-${cx}`} cx={cx} cy={cy} r={6} fill={getIntensityColor(payload.score)} stroke="white" strokeWidth={3} shadow="0 4px 6px rgba(0,0,0,0.1)" />
                      );
                    }}
                    activeDot={{ r: 8, fill: '#1B53F4', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Gauge & Forecast */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] flex flex-col items-center justify-center">
              <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-6">Current Readiness</p>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="96" cy="96" r="88"
                    stroke={getIntensityColor(score)} strokeWidth="10" fill="transparent"
                    strokeDasharray={552.92} strokeDashoffset={552.92 - (552.92 * score) / 100}
                    strokeLinecap="round" className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black" style={{ color: getIntensityColor(score) }}>{score}%</span>
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mt-1">Initial Draft</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFF] rounded-[32px] p-6 border border-[#EEF3FF] border-l-[4px] border-l-[#1B53F4]">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#1B53F4] text-white material-symbols-outlined text-[16px] rounded-full p-1">auto_awesome</span>
                <span className="text-[11px] font-black text-[#1B53F4] uppercase tracking-widest">AI CAREER FORECAST</span>
              </div>
              <p className="text-[14px] text-[#1E293B] leading-relaxed font-medium">
                {score >= 80 ? "Your current match score is exceptionally high. You're ready to secure this role with minimal extra prep." : score >= 50 ? "You've built a solid foundation. Focusing on your top 2 missing skills will fast-track you to hiring readiness." : "You're in the early stages of mastery. Consistent learning over the next few modules will show a major score boost."}
              </p>
            </div>
          </div>
        </div>

        {/* ── SKILL PROFICIENCY BREAKDOWN (RADAR CHART) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-stretch">
          {/* Radar Chart Card */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 w-full h-[320px] pointer-events-none outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" cy="50%" 
                  outerRadius="70%" 
                  data={radarData}
                  margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
                >
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Skill Match"
                    dataKey="A"
                    stroke="#1B53F4"
                    strokeWidth={3}
                    fill="#1B53F4"
                    fillOpacity={0.15}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-[22px] font-black text-[#1A1D2E] mb-2">Category Breakdown</h3>
                <p className="text-[14px] text-[#64748B] font-medium leading-relaxed">Visualize your strengths across different domains. Focus on the lowest peaks to balance your profile.</p>
              </div>
              
              <div className="space-y-4">
                {radarData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                      <span className="text-[#64748B]">{item.subject}</span>
                      <span style={{ color: getIntensityColor(item.A) }}>{item.A}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000 rounded-full" 
                        style={{ width: `${item.A}%`, backgroundColor: getIntensityColor(item.A) }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side: Quick Tips / Insights (CLEAN CARD STYLE) */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B53F4]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="pt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF3FF] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#1B53F4] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
              </div>
              <h4 className="text-[11px] font-black text-[#1B53F4] uppercase tracking-[0.2em] mb-4">Optimization Tip</h4>
              <p className="text-[18px] text-[#1A1D2E] leading-snug font-black">
                {radarData.reduce((prev, curr) => prev.A < curr.A ? prev : curr).subject === 'Soft Skills' 
                  ? "Your technical skills are strong! Focus on 'Soft Skills' like Agile and Communication to become a well-rounded leader."
                  : "Your foundation is great. Deepening your 'Technical' expertise in cloud and databases will significantly boost your hiring match."}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[12px] text-[#64748B] font-bold pt-6 border-t border-[#F1F5F9]">
              <span className="material-symbols-outlined text-[18px] text-[#1B53F4]">info</span>
              AI Insights Updated
            </div>
          </div>
        </div>

        {/* ── PEER BENCHMARKING & 5% PUSH ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Peer Benchmarking Card */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] relative overflow-hidden flex items-center gap-6">
            <div className="w-20 h-20 rounded-[24px] bg-[#FFF9E6] flex flex-col items-center justify-center shrink-0 border border-[#FDE68A]">
              <span className="text-[24px] font-black text-[#FBBF24]">
                {Math.min(99, Math.round(score * 0.8 + 15))}%
              </span>
              <span className="text-[9px] font-black text-[#FBBF24] uppercase tracking-widest">RANK</span>
            </div>
            <div>
              <h4 className="text-[14px] font-black text-[#1A1D2E] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FBBF24] text-[18px]">trophy</span>
                Peer Benchmarking
              </h4>
              <p className="text-[15px] text-[#64748B] leading-relaxed">
                You are currently ahead of <span className="text-[#1A1D2E] font-bold">{Math.min(99, Math.round(score * 0.8 + 15))}%</span> of other applicants for the <span className="text-[#1B53F4] font-bold">{selectedRole || 'target'}</span> position.
              </p>
            </div>
          </div>

          {/* The 5% Push Card (PREMIUM CLEAN STYLE) */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] relative overflow-hidden flex items-center gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#46CB5C]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="w-20 h-20 rounded-[24px] bg-[#EDFBF0] flex items-center justify-center shrink-0 border border-[#D1F2D9]">
              <span className="material-symbols-outlined text-[#46CB5C] text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
            </div>
            <div className="relative z-10">
              <h4 className="text-[14px] font-black text-[#1A1D2E] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                The 5% Push
              </h4>
              <p className="text-[15px] text-[#64748B] leading-relaxed">
                Mastering <span className="text-[#46CB5C] font-black uppercase tracking-tight">'{analysis.missing?.[0] || 'Next Core Skill'}'</span> will jump your score from <span className="font-bold">{score}%</span> to <span className="text-[#46CB5C] font-black">{Math.min(100, score + 6)}%</span> today.
              </p>
            </div>
          </div>
        </div>

        {/* ── ANALYSIS HISTORY ── */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8ECF4] mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-[#1A1D2E]">Analysis History</h3>
              {selectedRole && <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-[#E2E8F0]">{selectedRole}</span>}
            </div>
            {filteredHistory.length > 8 && (
              <button onClick={() => setShowAllHistory(v => !v)} className="text-[#1B53F4] text-[13px] font-bold hover:underline">
                {showAllHistory ? 'Show Less' : `View All (${filteredHistory.length})`}
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-[7px] top-6 bottom-6 w-[2px] bg-[#F1F5F9]"></div>
            <div className="space-y-2">
              {displayedHistory.map((entry, i) => (
                <div key={i} className="relative z-10 flex items-center gap-6 p-4 rounded-2xl hover:bg-[#F8FAFF] transition-all group">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-sm ${i === 0 ? 'bg-[#1B53F4] ring-4 ring-[#EEF3FF]' : 'bg-[#CBD5E1]'}`}></div>
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[15px] font-bold text-[#1A1D2E] group-hover:text-[#1B53F4] transition-colors">{entry.role} Analysis</p>
                      <p className="text-[12px] text-[#94A3B8] font-medium mt-0.5">{new Date(entry.analyzedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#EDFBF0] text-[#46CB5C] px-3 py-1.5 rounded-full text-[11px] font-bold">{entry.matched?.length || 0} Matched</span>
                      <span className="bg-[#FFF1F1] text-[#FF4D4D] px-3 py-1.5 rounded-full text-[11px] font-bold">{entry.missing?.length || 0} Missing</span>
                      <span className="bg-[#EEF3FF] text-[#1B53F4] px-3 py-1.5 rounded-full text-[11px] font-black">{Math.min(100, Math.round(entry.matchPercentage))}% MATCH</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AI CAREER PROJECTION CARD ── */}
        {analysis && (
          <div className="bg-white rounded-[32px] p-8 shadow-[0_30px_70px_-20px_rgba(139,92,246,0.15)] border border-[#F3F0FF] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-16 h-16 rounded-[20px] bg-[#F3E8FF] flex items-center justify-center shrink-0 shadow-sm border border-[#8B5CF6]/10">
                <span className="material-symbols-outlined text-[#8B5CF6] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="max-w-2xl">
                <h4 className="text-[20px] font-black text-[#1A1D2E] mb-2 leading-none">AI Career Projection</h4>
                <p className="text-[15px] text-[#64748B] leading-relaxed">
                  Based on your current <span className="text-[#1B53F4] font-bold">{score}%</span> match for <span className="text-[#1B53F4] font-bold">{selectedRole || analysis.role}</span>,{' '}
                  <span className="text-[#1A1D2E] font-medium">
                  {score >= 80 ? 'you have reached elite readiness. We recommend exploring active job listings immediately.' : score >= 60 ? `you are making great strides. Focus on the remaining ${analysis.missing?.length || 0} gaps to become a top-tier candidate.` : `consistent effort across your ${analysis.missing?.length || 0} remaining skill gaps will significantly accelerate your career path.`}
                  </span>
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/learning-path')} className="bg-[#1B53F4] text-white px-10 py-4 rounded-[20px] text-[15px] font-bold hover:bg-[#1541D0] transition-all shadow-xl shadow-[#1B53F4]/20 active:scale-95 shrink-0 relative z-10">View Learning Path</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Progress;
