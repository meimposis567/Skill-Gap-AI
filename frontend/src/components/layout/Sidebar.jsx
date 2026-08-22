import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '../../utils/helpers';

const navItems = [
  { to: '/dashboard',       icon: 'dashboard',   label: 'Dashboard' },
  { to: '/skill-analysis',  icon: 'analytics',   label: 'Skill Analysis' },
  { to: '/learning-path',   icon: 'route',       label: 'Learning Path' },
  { to: '/recommendations', icon: 'menu_book',   label: 'Courses' },
  { to: '/progress',        icon: 'trending_up', label: 'Progress' },
  { to: '/reports',         icon: 'bar_chart',   label: 'Reports' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { userName } = getAuth();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col fixed left-0 top-0 h-screen overflow-y-auto w-[220px] bg-white border-r border-[#E8ECF4] z-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="p-5 flex-1 flex flex-col">
        {/* TOP SECTION: Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1B53F4] flex items-center justify-center rounded-lg flex-shrink-0">
            <span className="text-white text-lg leading-none">⚡</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold text-[#1A1D2E] tracking-tight leading-none mb-1">Skill Gap AI</h1>
            <p className="text-[11px] text-[#9CA3AF] leading-none">Career Intelligence</p>
          </div>
        </div>
        
        {/* NAV ITEMS */}
        <nav className="flex flex-col gap-2">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 h-[44px] transition-colors duration-200 ${
                  isActive 
                    ? 'bg-[#EEF3FF] text-[#1B53F4] font-bold border-l-[3px] border-[#1B53F4] rounded-r-[10px]' 
                    : 'text-[#6B7280] hover:bg-[#F0F4FF] hover:text-[#1A1D2E] font-medium rounded-[10px] border-l-[3px] border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* MIDDLE SECTION: New Analysis */}
        <button 
          onClick={() => navigate('/skill-input')}
          className="w-full h-[48px] bg-[#1B53F4] hover:bg-[#1442D0] text-white rounded-[12px] flex items-center justify-center gap-2 font-medium transition-colors my-6 shrink-0 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Analysis
        </button>

        {/* BOTTOM SECTION */}
        <div className="mt-auto border-t border-[#E8ECF4] pt-4 flex flex-col gap-2 shrink-0">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-2 py-2 hover:bg-[#F0F4FF] rounded-[10px] transition-colors cursor-pointer group"
          >
            <div className="w-[36px] h-[36px] rounded-full bg-[#EEF3FF] flex items-center justify-center text-[#1B53F4] font-bold text-sm shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[#1A1D2E] font-bold text-sm truncate">{userName || 'My Profile'}</span>
              <span className="text-[#9CA3AF] text-[10px] truncate">User Account</span>
            </div>
          </NavLink>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 h-[44px] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] transition-colors rounded-[10px] cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
