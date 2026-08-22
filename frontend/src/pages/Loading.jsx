import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeSkills } from '../services/api';
import { saveLastAnalysis } from '../utils/helpers';

const stepsData = [
  { label: 'Extracting semantic skills...',              icon: 'description' },
  { label: 'Analyzing neural profile data...',           icon: 'search' },
  { label: 'Benchmarking industry requirements...',      icon: 'bar_chart' },
  { label: 'Generating personalized recommendations...', icon: 'auto_awesome' },
];

const Loading = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const { userId, role, resume } = location.state || {};
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!userId || !role) { navigate('/skill-input'); return; }
    if (hasStarted.current) return;
    hasStarted.current = true;

    // ── PROGRESS TIMER LOGIC ──
    const targetSteps = [25, 50, 75, 95];
    let i = 0;
    const interval = setInterval(() => {
      if (i < targetSteps.length) {
        setProgress(targetSteps[i]);
        setCurrentStep(i);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    // ── API INTEGRATION LOGIC ──
    const isNewFile = resume instanceof File;
    let analysisPromise;

    if (isNewFile) {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('role', role);
      formData.append('resume', resume);
      analysisPromise = analyzeSkills(formData);
    } else {
      analysisPromise = analyzeSkills({ userId, role });
    }

    analysisPromise
      .then(({ data }) => {
        saveLastAnalysis(data);
        if (role) localStorage.setItem('activeTargetRole', role);
        clearInterval(interval);
        setProgress(100);
        setCurrentStep(stepsData.length);
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch((err) => {
        console.error("Analysis Error:", err);
        clearInterval(interval);
        setError("The AI model is taking longer than usual. Please try again.");
        setTimeout(() => navigate('/skill-input'), 4000);
      });

    return () => clearInterval(interval);
  }, [navigate, resume, role, userId]);

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0px rgba(27,83,244,0.25), 0 0 0 8px #EEF3FF, 0 4px 24px rgba(27,83,244,0.15); }
          100% { box-shadow: 0 0 0 12px rgba(27,83,244,0), 0 0 0 8px #EEF3FF, 0 4px 24px rgba(27,83,244,0.15); }
        }
        .loading-spin-slow { animation: spin-slow 4s linear infinite; }
        .loading-spin-fast { animation: spin 0.8s linear infinite; }
        .loading-pulse-ring { animation: pulse-ring 1.5s ease infinite; }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          background: '#F0F4FF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontFamily: "'Plus Jakarta Sans', Inter, system-ui",
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 560, gap: 28 }}>

          {/* ── BRAIN ICON ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer slow-spinning dashed ring */}
              <div
                className="loading-spin-slow"
                style={{
                  position: 'absolute',
                  width: 96, height: 96,
                  borderRadius: '50%',
                  border: '2px dashed rgba(27,83,244,0.25)',
                  pointerEvents: 'none',
                }}
              />
              {/* Main icon circle */}
              <div
                className="loading-pulse-ring"
                style={{
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '3px dashed #1B53F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 36, color: '#1B53F4', fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
            </div>

            {/* ── HEADING ── */}
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1A1D2E', marginBottom: 8, lineHeight: 1.2 }}>
                {error ? 'System Interrupted' : 'Assembling Intelligence'}
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                {error || 'Our neural models are mapping your professional trajectory across 50,000+ data points.'}
              </p>
            </div>
          </div>

          {/* ── PROGRESS BAR ── */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                background: '#1B53F4', color: '#fff',
                borderRadius: 999, padding: '4px 12px',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              }}>
                PROCESSING
              </span>
              <span style={{ fontSize: 13, color: '#1B53F4', fontWeight: 600 }}>
                {progress}% COMPLETED
              </span>
            </div>
            <div style={{ width: '100%', background: '#E8ECF4', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #1B53F4, #4AACEA)',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* ── STEPS CARD ── */}
          <div style={{
            width: '100%',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #E8ECF4',
            boxShadow: '0 2px 12px rgba(27,83,244,0.07)',
            padding: '8px 24px',
          }}>
            {stepsData.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive    = index === currentStep && !error;
              const isPending   = index > currentStep;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: isActive ? '14px 8px' : '10px 0',
                    margin: isActive ? '0 -8px' : '0',
                    background: isActive ? '#F8FAFF' : 'transparent',
                    borderRadius: isActive ? 10 : 0,
                    borderBottom: index < stepsData.length - 1 ? '1px solid #F0F4FF' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Status Icon */}
                  <div style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCompleted ? (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#EDFBF0', border: '2px solid #46CB5C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#46CB5C', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>
                      </div>
                    ) : isActive ? (
                      <div
                        className="loading-spin-fast"
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: '2px solid #EEF3FF',
                          borderTopColor: '#1B53F4',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#F0F4FF', border: '2px solid #E8ECF4',
                      }} />
                    )}
                  </div>

                  {/* Step Label */}
                  <span style={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#1B53F4' : isCompleted ? '#6B7280' : '#C4C9D4',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    transition: 'color 0.3s ease',
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── AI CONTEXT CARD ── */}
          {!error && (
            <div style={{ width: '100%', position: 'relative', marginTop: 4, paddingTop: 14 }}>
              {/* Floating badge */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <span style={{
                  background: '#1B53F4', color: '#fff',
                  borderRadius: 999, padding: '4px 16px',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  boxShadow: '0 4px 12px rgba(27,83,244,0.25)',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}>
                  AI CONTEXT
                </span>
              </div>

              <div style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E8ECF4',
                boxShadow: '0 2px 12px rgba(27,83,244,0.07)',
                padding: '28px 24px 20px',
                textAlign: 'center',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: 10, left: 20,
                  fontSize: 32, color: '#1B53F4', opacity: 0.3,
                  lineHeight: 1, fontFamily: 'Georgia, serif',
                }}>"</span>
                <p style={{
                  fontSize: 14, color: '#6B7280', fontStyle: 'italic',
                  lineHeight: 1.7, margin: 0, padding: '0 12px',
                }}>
                  Skill gaps are not weaknesses, but identified opportunities for strategic growth.
                  We are mapping your path to expert-level proficiency.
                </p>
              </div>
            </div>
          )}

          {/* ── FOOTER BADGE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#46CB5C' }} />
              <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                Neural Compute Active
              </span>
            </div>
            <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.1em' }}>
              SECURE LAYER V4.0 • AES-256
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default Loading;
