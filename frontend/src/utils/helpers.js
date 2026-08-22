// Format match percentage
export const formatPercent = (val) => parseFloat(val || 0).toFixed(1);

// Get readiness level color
export const getReadinessColor = (level) => {
  if (level === 'High')     return '#00d4aa';
  if (level === 'Moderate') return '#f59e0b';
  return '#ef4444';
};

// Get readiness level based on score
export const getReadinessLevel = (score) => {
  const s = parseFloat(score || 0);
  if (s >= 80) return 'High';
  if (s >= 50) return 'Moderate';
  return 'Low';
};

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const normalizeAnalysis = (analysis) => {
  if (!analysis) return null;

  const partialMatched = Array.isArray(analysis.partialMatched)
    ? analysis.partialMatched
    : Array.isArray(analysis.partial)
      ? analysis.partial
      : [];

  const matchPercentage = Number.isFinite(Number(analysis.matchPercentage))
    ? Number(analysis.matchPercentage)
    : Number(analysis.score ?? 0);

  return {
    ...analysis,
    matched: Array.isArray(analysis.matched) ? analysis.matched : [],
    partial: partialMatched,
    partialMatched,
    missing: Array.isArray(analysis.missing) ? analysis.missing : [],
    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    matchPercentage,
    readinessLevel: analysis.readinessLevel || getReadinessLevel(matchPercentage),
  };
};

export const getStoredAnalysis = () => {
  if (!canUseStorage()) return null;

  const raw = localStorage.getItem('lastAnalysis');
  if (!raw) return null;

  try {
    return normalizeAnalysis(JSON.parse(raw));
  } catch {
    localStorage.removeItem('lastAnalysis');
    return null;
  }
};

export const saveLastAnalysis = (analysis) => {
  const normalized = normalizeAnalysis(analysis);
  if (!normalized || !canUseStorage()) return normalized;

  localStorage.setItem('lastAnalysis', JSON.stringify(normalized));
  if (normalized.role) localStorage.setItem('activeTargetRole', normalized.role);
  return normalized;
};

// Only sync with server data if the roles match, preventing historical role views from being overwritten by 'latest'
export const syncRoleAnalysis = (serverAnalysis) => {
  if (!serverAnalysis || !canUseStorage()) return getStoredAnalysis();
  
  const activeRole = localStorage.getItem('activeTargetRole');
  const stored = getStoredAnalysis();

  // If roles match, or we have nothing stored, it's safe to sync
  if (!stored || serverAnalysis.role === activeRole) {
    return saveLastAnalysis(serverAnalysis);
  }
  
  // If we are looking at a historical role, don't let 'latest' overwrite it
  return stored;
};

export const getActiveRole = () => {
  if (!canUseStorage()) return null;
  return localStorage.getItem('activeTargetRole');
};

export const setActiveRole = (role) => {
  if (!canUseStorage()) return;
  localStorage.setItem('activeTargetRole', role);
};

// Store auth in localStorage
export const saveAuth = (token, userId, name) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
  localStorage.setItem('userName', name);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('lastAnalysis');
};

export const getAuth = () => ({
  token: localStorage.getItem('token'),
  userId: localStorage.getItem('userId'),
  userName: localStorage.getItem('userName'),
});

export const isLoggedIn = () => !!localStorage.getItem('token');

// Format date nicely
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// Capitalize first letter
export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// Course Completion Tracking
export const getCompletedCourses = () => {
  if (!canUseStorage()) return [];
  try {
    return JSON.parse(localStorage.getItem('completedCourses') || '[]');
  } catch {
    return [];
  }
};

export const saveCompletedCourses = (courses) => {
  if (!canUseStorage()) return;
  localStorage.setItem('completedCourses', JSON.stringify(courses));
};

export const getBoostedScore = (baseScore) => {
  // We've removed the fake boost logic. 
  // The score now reflects the real backend match percentage, 
  // which is updated when skills are mastered via course completions.
  return Math.round(parseFloat(baseScore || 0));
};
