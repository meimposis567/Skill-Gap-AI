import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getDashboard } from '../services/api';
import { getAuth, getStoredAnalysis, saveLastAnalysis, getBoostedScore, getCompletedCourses, syncRoleAnalysis } from '../utils/helpers';

const SkillAnalysis = () => {
  const navigate = useNavigate();
  const { userId } = getAuth();
  const [analysis, setAnalysis] = useState(() => getStoredAnalysis());
  const [loading, setLoading] = useState(() => Boolean(userId));
  const [activeTab, setActiveTab] = useState('Technical');

  useEffect(() => {
    if (!userId) return;

    getDashboard(userId)
      .then(({ data }) => {
        if (data.latestAnalysis) {
          setAnalysis(syncRoleAnalysis(data.latestAnalysis));
        }
      })
      .catch(err => console.error("Sync error:", err))
      .finally(() => setLoading(false));
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
          <div className="text-6xl mb-6">🧠</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No analysis yet</h2>
          <p className="text-[var(--text-secondary)] mb-8">Run an analysis to see your skill breakdown.</p>
          <button
            onClick={() => navigate('/skill-input')}
            className="btn-primary"
          >
            Start Analysis
          </button>
        </div>
      </Layout>
    );
  }

  const categories = {
    'Technical': ['python', 'javascript', 'react', 'node', 'sql', 'api', 'backend', 'frontend', 'cloud', 'aws', 'java', 'c++', 'machine learning', 'data', 'typescript', 'vue', 'angular', 'c#', 'php', 'ruby', 'go', 'rust', 'fullstack', 'full stack', 'mern', 'mean'],
    'Tools': ['git', 'docker', 'jira', 'figma', 'postman', 'vscode', 'kubernetes', 'jenkins', 'trello', 'github', 'gitlab', 'npm', 'yarn', 'webpack', 'vite', 'azure', 'aws', 'gcp', 'terraform', 'ansible', 'monitoring'],
    'Soft Skills': ['communication', 'teamwork', 'leadership', 'agile', 'management', 'problem solving', 'collaboration', 'presentation', 'mentoring', 'flexibility', 'creativity', 'time management', 'critical thinking', 'emotional intelligence'],
  };

  const getCategorized = (tab) => {
    const keywords = categories[tab] || [];
    const filterFn = (s) => keywords.some(k => s.toLowerCase().includes(k.toLowerCase()));
    
    // If it's the Technical tab, also include skills that don't fit anywhere else
    const isOther = (s) => !Object.values(categories).flat().some(k => s.toLowerCase().includes(k.toLowerCase()));

    return {
      matched: (analysis.matched || []).filter(s => filterFn(s) || (tab === 'Technical' && isOther(s))),
      partial: (analysis.partialMatched || []).filter(s => filterFn(s) || (tab === 'Technical' && isOther(s))),
      missing: (analysis.missing || []).filter(s => filterFn(s) || (tab === 'Technical' && isOther(s)))
    };
  };

  const currentData = getCategorized(activeTab);
  const tabs = ['Technical', 'Soft Skills', 'Tools'];
  const completedCourses = getCompletedCourses();
  const boostedScore = Math.round(analysis.matchPercentage ?? analysis.score ?? 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-10">

        {/* ── PAGE HEADER ── */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-bold text-[var(--text-primary)] mb-2">The Gap Analysis</h2>
            <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed">
              Comparing your skills against the industry standard for{' '}
              <span className="text-[#1B53F4] font-bold">{analysis.role}</span>. You currently have a{' '}
              <span className="text-[#1B53F4] font-bold">{boostedScore}% total match</span>.
            </p>
          </div>

          <div className="flex bg-white border border-[#E8ECF4] rounded-full p-1 shadow-sm shrink-0">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-[13px] rounded-full transition-all duration-200 font-bold tracking-wide ${
                  activeTab === tab
                    ? 'bg-[#1B53F4] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        {/* ── AI PREDICTION CARD ── */}
        {analysis.mlPrediction && (
          <div className="card border-l-[4px] border-l-[#4AACEA] mb-8 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 relative shadow-sm">
            <div className="w-[64px] h-[64px] bg-[#EBF6FD] rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#4AACEA] text-[32px]">psychology</span>
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-[#4AACEA] text-[11px] font-black uppercase tracking-widest mb-1.5">ML Career Path Prediction</h3>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">{analysis.mlPrediction.predicted_role}</h3>
                <div className="bg-[#EBF6FD] text-[#4AACEA] px-4 py-1 rounded-full text-[13px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  {Math.round(boostedScore)}% Confidence
                </div>
              </div>
              
              <div className="mt-4 w-full max-w-sm">
                <div className="h-[6px] w-full bg-[#EBF6FD] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4AACEA] rounded-full transition-all duration-1000"
                    style={{ width: `${boostedScore}%` }}
                  />
                </div>
              </div>

              {analysis.mlPrediction.top_predictions?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-[var(--text-secondary)] text-[11px] font-black uppercase tracking-widest mr-1">Alternative Paths:</span>
                  {analysis.mlPrediction.top_predictions.slice(1, 4).map((pred, i) => (
                    <span key={i} className="bg-[var(--bg-page)] text-[var(--text-secondary)] text-[11px] font-bold px-3 py-1 rounded-full border border-[var(--border)]">
                      {Array.isArray(pred) ? pred[0] : (pred.role || pred)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="card p-0 overflow-hidden mb-8 shadow-sm">
            <div className="p-6 border-b border-[var(--border)] bg-white flex items-center justify-between">
              <h3 className={`border-l-[4px] pl-3 text-[var(--text-primary)] font-bold text-[16px] uppercase tracking-wide ${
                activeTab === 'Technical' ? 'border-l-[#1B53F4]' : 
                activeTab === 'Soft Skills' ? 'border-l-[#F59E0B]' : 
                'border-l-[#9333EA]'
              }`}>
                {activeTab} Analysis
              </h3>
              <div className="flex gap-4">
                <span className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  {currentData.matched.length} Matched
                </span>
                <span className="text-[11px] font-black text-[#F59E0B] uppercase tracking-widest">
                  {currentData.partial.length} Partial
                </span>
                <span className="text-[11px] font-black text-[#EF4444] uppercase tracking-widest">
                  {currentData.missing.length} Gaps
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 bg-[var(--bg-page)] border-b border-[var(--border)]">
              <div className="flex-1 text-[11px] tracking-widest text-[var(--text-secondary)] uppercase font-bold">Skill Name</div>
              <div className="w-32 text-center text-[11px] tracking-widest text-[var(--text-secondary)] uppercase font-bold">Target Req</div>
              <div className="w-32 text-center text-[11px] tracking-widest text-[var(--text-secondary)] uppercase font-bold">Status</div>
              <div className="w-24 text-right text-[11px] tracking-widest text-[var(--text-secondary)] uppercase font-bold">Score</div>
            </div>
            
            <div className="flex flex-col bg-white min-h-[200px]">
              {currentData.matched.map((skill, idx) => (
                <div key={`m-${idx}`} className="flex items-center gap-4 py-5 px-6 border-b border-[var(--border)] last:border-0 hover:bg-[#F8FAFF] transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] font-bold text-[15px]">{skill}</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-0.5">Core requirement identified</p>
                  </div>
                  <div className="w-32 flex justify-center"><span className="text-[var(--text-secondary)] text-sm font-semibold">Expert</span></div>
                  <div className="w-32 flex justify-center">
                    <span className="bg-[#EDFBF0] text-[#1A9E35] border border-[#46CB5C] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">✓ Matched</span>
                  </div>
                  <div className="w-24 text-right"><span className="text-[#1A9E35] font-bold text-[15px]">100%</span></div>
                </div>
              ))}

              {currentData.partial.map((skill, idx) => (
                <div key={`p-${idx}`} className="flex items-center gap-4 py-5 px-6 border-b border-[var(--border)] last:border-0 hover:bg-[#F8FAFF] transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] font-bold text-[15px]">{skill}</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-0.5">Identified growth area</p>
                  </div>
                  <div className="w-32 flex justify-center"><span className="text-[var(--text-secondary)] text-sm font-semibold">Required</span></div>
                  <div className="w-32 flex justify-center">
                    <span className="bg-[#EBF6FD] text-[#1A7CB8] border border-[#4AACEA] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">~ Partial</span>
                  </div>
                  <div className="w-24 flex flex-col items-end">
                    <span className="text-[#1A7CB8] font-bold text-[15px]">50%</span>
                    <button onClick={() => navigate('/recommendations')} className="text-[#1B53F4] text-[10px] font-bold hover:underline">Learn →</button>
                  </div>
                </div>
              ))}

              {currentData.missing.map((skill, idx) => (
                <div key={`ms-${idx}`} className="flex items-center gap-4 py-5 px-6 border-b border-[var(--border)] last:border-0 hover:bg-[#F8FAFF] transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] font-bold text-[15px]">{skill}</p>
                    <p className="text-[var(--text-secondary)] text-xs mt-0.5">Critical gap detected</p>
                  </div>
                  <div className="w-32 flex justify-center"><span className="text-[var(--text-secondary)] text-sm font-semibold">Required</span></div>
                  <div className="w-32 flex justify-center">
                    <span className="bg-[#FEE2E2] text-[#B91C1C] border border-[#EF4444] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">✗ Missing</span>
                  </div>
                  <div className="w-24 flex flex-col items-end">
                    <span className="text-[#B91C1C] font-bold text-[15px]">0%</span>
                    <button onClick={() => navigate('/recommendations')} className="text-[#1B53F4] text-[10px] font-bold hover:underline">Fix Gap →</button>
                  </div>
                </div>
              ))}

              {currentData.matched.length === 0 && currentData.partial.length === 0 && currentData.missing.length === 0 && (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-[var(--text-muted)] text-4xl mb-2">assignment_turned_in</span>
                  <p className="text-[var(--text-secondary)] text-sm">No skills found in this category.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card text-center p-8 shadow-sm flex flex-col items-center bg-white border border-[var(--border)]">
            <h3 className="text-[22px] font-bold text-[var(--text-primary)] mb-2">Bridge the Gap</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-md mx-auto">
              Our AI has curated a custom learning path with courses to address your missing skills.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button onClick={() => navigate('/recommendations')} className="btn-primary w-full sm:w-auto px-6 h-[44px] flex items-center justify-center text-[13px]">
                View Course Recommendations
              </button>
              <button onClick={() => navigate('/learning-path')} className="btn-secondary w-full sm:w-auto px-6 h-[44px] flex items-center justify-center text-[13px]">
                View Learning Path
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SkillAnalysis;
