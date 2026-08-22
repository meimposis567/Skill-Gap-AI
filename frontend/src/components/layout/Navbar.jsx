import React, { useEffect, useState, useRef } from 'react';
import { getAuth, getBoostedScore } from '../../utils/helpers';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, getProgress } from '../../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, userId } = getAuth();
  
  const [role, setRole] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [roleHistory, setRoleHistory] = useState([]);
  
  const dropdownRef = useRef(null);
  const roleRef = useRef(null);
  const searchRef = useRef(null);

  const fetchNotifications = () => {
    if (userId) {
      getNotifications(userId)
        .then(({ data }) => setNotifications(data))
        .catch(err => console.error("Notification fetch error:", err));
    }
  };

  const fetchRoleHistory = () => {
    if (userId) {
      getProgress(userId)
        .then(({ data }) => {
          const history = data.history || [];
          const seenRoles = new Set();
          const unique = history.filter(item => {
            if (seenRoles.has(item.role)) return false;
            seenRoles.add(item.role);
            return true;
          });
          setRoleHistory(unique);
          
          const active = localStorage.getItem('activeTargetRole');
          const currentAnalysis = history.find(h => h.role === active) || history[0];
          if (currentAnalysis) {
            setAnalysisData(currentAnalysis);
          }
        })
        .catch(err => console.error("History fetch error:", err));
    }
  };

  useEffect(() => {
    const active = localStorage.getItem('activeTargetRole');
    const analysis = localStorage.getItem('lastAnalysis');
    
    if (active) {
      setRole(active);
    } else if (analysis) {
      try {
        setRole(JSON.parse(analysis).role);
      } catch (e) {
        console.error("Parse error", e);
      }
    }
    
    fetchNotifications();
    fetchRoleHistory();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowNotifications(false);
      if (roleRef.current && !roleRef.current.contains(e.target)) setShowRoleSwitcher(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [location.pathname, userId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.search]);

  const switchRole = (analysisEntry) => {
    localStorage.setItem('activeTargetRole', analysisEntry.role);
    localStorage.setItem('lastAnalysis', JSON.stringify(analysisEntry));
    window.location.reload();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // ── SEARCH DROPDOWN LOGIC ──
  const getSearchResults = () => {
    if (!searchQuery || !analysisData) return null;
    const q = searchQuery.toLowerCase();
    
    const matched = (analysisData.matched || []).filter(s => s.toLowerCase().includes(q));
    const missing = (analysisData.missing || []).filter(s => s.toLowerCase().includes(q));
    const partial = (analysisData.partialMatched || []).filter(s => s.toLowerCase().includes(q));
    const courses = (analysisData.recommendations || []).filter(r => 
      (r.skill || '').toLowerCase().includes(q) || 
      (r.courses?.[0] || '').toLowerCase().includes(q)
    );

    return { matched, missing, partial, courses };
  };

  const results = getSearchResults();

  return (
    <header className="fixed top-0 right-0 left-[220px] h-16 flex justify-between items-center px-8 z-40 bg-white border-b border-[var(--border)]">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative flex items-center group w-full max-w-[360px]" ref={searchRef}>
          <span className="material-symbols-outlined absolute left-4 text-[#9CA3AF] text-[20px]">search</span>
          <input 
            className="w-full h-11 pl-12 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-sm font-medium focus:border-[#1B53F4]/40 focus:ring-4 focus:ring-[#1B53F4]/5 transition-all outline-none" 
            placeholder="Search everything..." 
            type="text"
            value={searchQuery}
            onFocus={() => setShowSearchResults(true)}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setShowSearchResults(true);
              const params = new URLSearchParams(location.search);
              if (val) params.set('q', val); else params.delete('q');
              navigate({ search: params.toString() }, { replace: true });
            }}
          />

          {/* SEARCH RESULTS DROPDOWN */}
          {showSearchResults && results && (
            <div className="absolute top-full left-0 mt-3 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                
                {/* MATCHED SKILLS */}
                {results.matched.length > 0 && (
                  <div className="p-4 border-b border-gray-50 bg-[#F0FDF4]/30">
                    <p className="text-[10px] font-black uppercase text-[#15803d] tracking-widest mb-3 flex justify-between">
                      Matched Skills <span>{results.matched.length} FOUND</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.matched.slice(0, 6).map(s => (
                        <span key={s} className="px-2.5 py-1 bg-white border border-[#46CB5C]/30 text-[#46CB5C] rounded-lg text-[11px] font-bold shadow-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* MISSING SKILLS */}
                {results.missing.length > 0 && (
                  <div className="p-4 border-b border-gray-50 bg-[#FEF2F2]/30">
                    <p className="text-[10px] font-black uppercase text-[#b91c1c] tracking-widest mb-3 flex justify-between">
                      Missing Skills <span>{results.missing.length} FOUND</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.missing.slice(0, 6).map(s => (
                        <span key={s} className="px-2.5 py-1 bg-white border border-[#EF4444]/30 text-[#EF4444] rounded-lg text-[11px] font-bold shadow-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECOMMENDED COURSES */}
                {results.courses.length > 0 && (
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase text-[#1B53F4] tracking-widest mb-3 flex justify-between">
                      Learning Paths <span>{results.courses.length} FOUND</span>
                    </p>
                    <div className="flex flex-col gap-2">
                      {results.courses.slice(0, 3).map((c, i) => (
                        <div 
                          key={i} 
                          onClick={() => { navigate('/recommendations'); setShowSearchResults(false); }}
                          className="group/item flex items-center gap-3 p-2 hover:bg-[#EEF3FF] rounded-xl transition-all cursor-pointer border border-transparent hover:border-[#1B53F4]/20"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#EEF3FF] text-[#1B53F4] flex items-center justify-center shrink-0 group-hover/item:bg-[#1B53F4] group-hover/item:text-white transition-colors">
                            <span className="material-symbols-outlined text-[18px]">school</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{c.courses?.[0]?.split(' - ')?.[0] || `Master ${c.skill}`}</p>
                            <p className="text-[10px] text-gray-400">Targeting {c.skill}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NO RESULTS */}
                {results.matched.length === 0 && results.missing.length === 0 && results.courses.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                    <p className="text-xs">No specific matches for "{searchQuery}"</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <button 
                  onClick={() => { navigate(`/recommendations?q=${searchQuery}`); setShowSearchResults(false); }}
                  className="text-[11px] font-black uppercase text-[#1B53F4] hover:underline"
                >
                  View All Search Results &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
        
        {role && (
          <div className="relative flex items-center gap-3 shrink-0" ref={roleRef}>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] whitespace-nowrap">Current Target:</span>
            <button 
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className={`flex items-center justify-between min-w-[200px] gap-4 bg-[#EEF3FF] text-[#1B53F4] rounded-full px-8 py-2.5 font-bold text-[14px] hover:bg-[#E0E9FF] transition-all shadow-sm ${showRoleSwitcher ? 'ring-2 ring-[#1B53F4]/20' : ''}`}
            >
              <span className="truncate">{role}</span>
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${showRoleSwitcher ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {showRoleSwitcher && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-4 py-2 border-b border-gray-50"><p className="text-[10px] font-black uppercase text-gray-400">Switch Focus</p></div>
                <div className="max-h-60 overflow-y-auto">
                  {roleHistory.map((item, idx) => (
                    <button key={idx} onClick={() => switchRole(item)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col ${item.role === role ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                      <span className="text-sm font-bold text-gray-900">{item.role}</span>
                      <div className="flex justify-between mt-1"><span className="text-[10px] text-gray-400">{new Date(item.analyzedAt).toLocaleDateString()}</span><span className="text-[10px] font-bold text-green-500">{Math.floor(item.matchPercentage)}%</span></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="text-[#64748B] hover:text-blue-600 transition-all relative p-2 rounded-full hover:bg-gray-50">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-[340px] bg-white rounded-[20px] shadow-2xl border border-[#E8ECF4] z-50 overflow-hidden">
              
              {/* Header */}
              <div className="px-5 py-4 flex justify-between items-center border-b border-[#F0F4FF]">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-black text-[#1A1D2E]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-[#1B53F4] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-[#1B53F4] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
                    <div className="w-12 h-12 bg-[#F0F4FF] rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#9CA3AF] text-[24px]">notifications_off</span>
                    </div>
                    <p className="text-[13px] font-bold text-[#6B7280]">All caught up!</p>
                    <p className="text-[11px] text-[#9CA3AF]">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      className={`group relative flex items-start gap-3 px-4 py-3 border-b border-[#F8FAFF] transition-all ${!n.isRead ? 'bg-[#EEF3FF]/40' : 'hover:bg-[#F8FAFF]'}`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? 'bg-[#1B53F4] text-white' : 'bg-[#F0F4FF] text-[#9CA3AF]'}`}>
                        <span className="material-symbols-outlined text-[18px]">{n.icon || 'notifications'}</span>
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-[12px] leading-snug ${!n.isRead ? 'font-bold text-[#1A1D2E]' : 'font-medium text-[#6B7280]'}`}>
                          {n.text}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] mt-1 font-medium">{formatTime(n.createdAt)}</p>

                        {/* Mark as read — show on hover */}
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n._id)}
                            className="flex items-center gap-1 mt-2 text-[10px] font-bold text-[#1B53F4] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-[12px]">mark_email_read</span>
                            Mark as read
                          </button>
                        )}
                      </div>

                      {/* × Delete button — top-right corner */}
                      <button
                        onClick={(e) => handleDeleteNotification(e, n._id)}
                        className="absolute top-2.5 right-3 w-5 h-5 flex items-center justify-center rounded-full text-[#C4C9D4] hover:bg-[#FEE2E2] hover:text-[#EF4444] transition-all opacity-0 group-hover:opacity-100"
                        title="Delete notification"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>

                      {/* Unread dot */}
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-[#1B53F4] rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-5 py-3 bg-[#F8FAFF] border-t border-[#F0F4FF] flex justify-between items-center">
                  <span className="text-[10px] text-[#9CA3AF] font-medium">{notifications.length} total notifications</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-bold text-[#6B7280] hover:text-[#1B53F4] transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-gray-100"></div>
        <button onClick={() => navigate('/profile')} className="flex items-center gap-3 group">
          <div className="text-right hidden sm:block"><p className="text-sm font-bold text-gray-900 leading-none">{userName || 'User'}</p><p className="text-[10px] text-gray-400 mt-1">Profile</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm group-hover:scale-105 transition-transform">{userName?.charAt(0).toUpperCase() || 'U'}</div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;