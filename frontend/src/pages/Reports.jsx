import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { getReports, fetchLiveNews, fetchRealSalary } from '../services/api';
import { getAuth } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { userId } = getAuth();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(userId));
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [marketSalary, setMarketSalary] = useState(null);
  const [jobCount, setJobCount] = useState(0);
  
  const [recommendedReviewDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  const [selectedRole, setSelectedRole] = useState(
    () => localStorage.getItem('activeTargetRole') || null
  );

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getReports(userId, selectedRole)
      .then(({ data }) => setReportData(data))
      .catch(err => console.error('Report load error:', err))
      .finally(() => setLoading(false));
  }, [userId, selectedRole]);

  useEffect(() => {
    const roleToFetch = selectedRole || reportData?.currentRole || 'Technology';
    
    setNewsLoading(true);
    fetchLiveNews(roleToFetch)
      .then(res => setNews(res.data.articles?.slice(0, 3) || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));

    fetchRealSalary(roleToFetch)
      .then(res => {
        if (res.data) {
          setMarketSalary(res.data.results?.[0]?.salary_min || null);
          setJobCount(res.data.count || 0);
        }
      })
      .catch(() => {
        setMarketSalary(null);
        setJobCount(0);
      });
  }, [selectedRole, reportData]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    localStorage.setItem('activeTargetRole', role);
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

  if (!reportData || reportData.totalAnalyses === 0) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F0F4FF] px-4 text-center">
          <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm border border-[#E8ECF4] flex items-center justify-center mb-8">
            <span className="material-symbols-outlined text-[48px] text-[#1B53F4]">analytics</span>
          </div>
          <h2 className="text-[28px] font-black text-[#1A1D2E] mb-3">No Reports Generated</h2>
          <p className="text-[#6B7280] text-[17px] mb-10 max-w-md">Run your first analysis to unlock professional growth tracking, salary projections, and AI career forecasting.</p>
          <button onClick={() => navigate('/skill-input')} className="bg-[#1B53F4] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#1541D0] transition-all shadow-xl shadow-[#1B53F4]/20 active:scale-95">Start Analysis</button>
        </div>
      </Layout>
    );
  }

  const { currentScore, currentRole, avgScore, improvement, topMissingSkills, matchedCount, missingCount, currentSalary, potentialLift } = reportData;
  const displaySalary = marketSalary || currentSalary || (95000 + (currentScore * 500));
  const displayLift = potentialLift || ((100 - currentScore) * 350);

  const getRankStyle = (index) => {
    if (index === 0) return { bg: 'bg-[#EEF3FF]', text: 'text-[#1B53F4]' };
    if (index === 1) return { bg: 'bg-[#F3EEFF]', text: 'text-[#7C3AED]' };
    if (index === 2) return { bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' };
    return { bg: 'bg-[#F9FAFB]', text: 'text-[#6B7280]' };
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F0F4FF] pt-10 pb-20 px-4 md:px-8 font-['Plus_Jakarta_Sans',Inter,system-ui]">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-10">
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.08em] font-bold mb-3">FILTER REPORT BY TARGET</p>
            <div className="bg-white p-1.5 rounded-[12px] border border-[#E8ECF4] flex flex-wrap items-center gap-2 shadow-[0_10px_30px_rgba(27,83,244,0.05)]">
              <button 
                onClick={() => handleRoleChange(null)} 
                className={`px-5 py-2 rounded-[8px] text-[13px] transition-all font-bold whitespace-nowrap shrink-0 ${!selectedRole ? 'bg-[#1B53F4] text-white' : 'text-[#4B5563] hover:bg-[#F0F4FF]'}`}
              >
                Global Summary
              </button>
              {reportData.availableRoles?.map(role => (
                <button 
                  key={role} 
                  onClick={() => handleRoleChange(role)} 
                  className={`px-5 py-2 rounded-[8px] text-[13px] transition-all font-bold whitespace-nowrap shrink-0 ${selectedRole === role ? 'bg-[#1B53F4] text-white' : 'text-[#4B5563] hover:bg-[#F0F4FF]'}`}
                >
                  {role || 'Unknown'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-row justify-between items-end gap-6 mb-12">
            <div>
              <span className="text-[11px] text-[#1B53F4] tracking-[0.1em] uppercase font-bold">ANALYTICS WORKSPACE</span>
              <h1 className="text-[30px] font-extrabold text-[#1A1D2E] leading-tight">{selectedRole || currentRole || 'Select Role'} Report</h1>
            </div>
            <div className="flex gap-3 items-stretch shrink-0">
              <div className="bg-white border border-[#E8ECF4] rounded-[12px] px-5 py-3 shadow-sm min-w-[110px] flex flex-col justify-center">
                <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">{selectedRole ? 'Role Avg' : 'Global Avg'}</p>
                <p className="text-[22px] font-bold text-[#1A1D2E]">{avgScore}%</p>
              </div>
              <div className="bg-[#EDFBF0] border border-[#46CB5C] rounded-[12px] px-5 py-3 shadow-sm min-w-[110px] flex flex-col justify-center">
                <p className="text-[10px] text-[#46CB5C] uppercase font-bold tracking-wider">Growth</p>
                <p className="text-[22px] font-bold text-[#1A9E35]">{improvement > 0 ? '+' : ''}{improvement}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-[20px] items-start">
            {/* LEFT COLUMN (60%) */}
            <div className="flex flex-col gap-[16px]">
              {/* TOP ROW: READINESS */}
              <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] flex flex-col min-h-[300px]">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Current {selectedRole || currentRole || 'Global'} Readiness</p>
                      <p className="text-[14px] text-[#6B7280] font-medium">Comparison vs target standard</p>
                    </div>
                    <span className="text-[32px] font-black text-[#1A1D2E] leading-none">{currentScore}%</span>
                  </div>
                  <div className="w-full bg-[#F0F4FF] rounded-full h-[10px] overflow-hidden my-6">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${currentScore}%`, background: 'linear-gradient(90deg, #1B53F4, #4AACEA)' }} />
                  </div>
                </div>
                <div className="flex flex-row gap-[12px] mt-auto">
                  <div className="flex-1 min-w-0 bg-[#EDFBF0] border border-[#46CB5C] rounded-[12px] p-5 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2 text-[#1A9E35]">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span className="text-[10px] uppercase font-bold">Matched Core</span>
                    </div>
                    <p className="text-[32px] font-bold text-[#1A9E35] leading-none">{matchedCount}</p>
                  </div>
                  <div className="flex-1 min-w-0 bg-[#FEE2E2] border border-[#EF4444] rounded-[12px] p-5 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2 text-[#B91C1C]">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span className="text-[10px] uppercase font-bold">Critical Gaps</span>
                    </div>
                    <p className="text-[32px] font-bold text-[#EF4444] leading-none">{missingCount}</p>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: RECURRING GAPS */}
              <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] flex flex-col min-h-[300px]">
                <h3 className="text-[18px] font-bold text-[#1A1D2E] mb-6 flex-shrink-0">Recurring Skill Gaps</h3>
                <div className="space-y-3 flex-1 overflow-auto">
                  {topMissingSkills?.map((item, i) => (
                    <div key={i} className="flex items-center gap-[12px] p-4 bg-[#F8FAFF] rounded-xl border border-transparent hover:border-[#1B53F4] transition-all group">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full ${getRankStyle(i).bg} ${getRankStyle(i).text} flex items-center justify-center text-[12px] font-bold`}>#{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#1A1D2E] group-hover:text-[#1B53F4] truncate">{item.skill}</p>
                        <p className="text-[10px] text-[#9CA3AF] uppercase font-bold">Frequency: {item.count}x</p>
                      </div>
                      <span className="flex-shrink-0 material-symbols-outlined text-[#9CA3AF] group-hover:text-[#1B53F4] ml-auto">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (40%) */}
            <div className="flex flex-col gap-[16px]">
              {/* SALARY CARD */}
              <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] flex flex-col min-h-[300px]">
                <div className="flex-1">
                  <h3 className="text-[18px] font-bold text-[#1A1D2E]">Salary Projection</h3>
                  <p className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-widest mt-0.5">{marketSalary ? 'LIVE MARKET DATA' : 'ESTIMATED PROFICIENCY'}</p>
                  <div className="mt-8">
                    <p className="text-[40px] font-black text-[#1A1D2E] leading-none transition-colors">${displaySalary.toLocaleString()}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 bg-[#EDFBF0] text-[#1A9E35] px-3 py-1 rounded-full text-[12px] font-bold border border-[#46CB5C]/10">
                      <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      +${displayLift.toLocaleString()} Lift
                    </div>
                  </div>
                </div>
                <div className="mt-8 border-t border-[#E8ECF4] pt-6 flex-shrink-0">
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    {marketSalary ? `Current market average for ${selectedRole || currentRole}.` : `Estimated valuation based on match.`} 1% growth adds ~$350/yr.
                  </p>
                </div>
              </div>

              {/* AI FORECAST CARD */}
              <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] flex flex-col min-h-[300px]">
                <div className="flex-shrink-0 mb-8">
                  <h3 className="text-[18px] font-bold text-[#1A1D2E] flex items-center gap-2">
                    <span className="text-[#1B53F4]">✦</span> AI Forecast
                  </h3>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex items-start gap-[14px]">
                    <div className="flex-shrink-0 w-[44px] h-[44px] bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-[#E8ECF4]">
                      <span className="material-symbols-outlined text-[#1B53F4] text-[20px]">trending_up</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1A1D2E] mb-1">Acquisition Velocity</p>
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">Reach <span className="text-[#1A9E35] font-black">85% match</span> in <span className="text-[#1B53F4] font-black">4 weeks</span>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-[14px]">
                    <div className="flex-shrink-0 w-[44px] h-[44px] bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-[#E8ECF4]">
                      <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">emoji_events</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1A1D2E] mb-1">Market Position</p>
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">Current: <span className="text-[#B45309] font-black">Top 40%</span>. Move to <span className="text-[#1A9E35] font-black">Top 15%</span> soon.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {/* ROW 4: INDUSTRY NEWS */}
            <div className="bg-white rounded-[24px] p-8 border border-[#E8ECF4] shadow-[0_20px_50px_rgba(27,83,244,0.08)] min-h-[300px]">
              <div className="flex items-center justify-between mb-8">
                <div><h3 className="text-[18px] font-bold text-[#1A1D2E]">📡 Industry News & Trends</h3><p className="text-[13px] text-[#6B7280]">Latest market updates for {selectedRole || currentRole || 'Select Role'}</p></div>
                {newsLoading && <div className="w-5 h-5 border-2 border-[#1B53F4]/20 border-t-[#1B53F4] rounded-full animate-spin"></div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {newsLoading ? [1,2,3].map(i => <div key={i} className="h-40 bg-[#F8FAFF] rounded-2xl animate-pulse" />) : 
                 news.map((a, idx) => (
                  <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer" className="flex flex-col justify-between p-6 bg-white rounded-[20px] border border-[#E8ECF4] shadow-sm hover:shadow-xl hover:border-[#1B53F4] transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] text-[#1B53F4] font-black uppercase tracking-widest opacity-70">{a.source?.name}</p>
                        <span className="material-symbols-outlined text-[16px] text-[#9CA3AF] group-hover:text-[#1B53F4] transition-colors">open_in_new</span>
                      </div>
                      <h4 className="text-[15px] font-bold text-[#1A1D2E] leading-snug line-clamp-3 group-hover:text-[#1B53F4] transition-colors">{a.title}</h4>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[11px] font-black text-[#9CA3AF] group-hover:text-[#1B53F4] transition-colors uppercase tracking-tight">
                      Read Article <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
