import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import SkillInputPage from './pages/SkillInputPage';
import Loading from './pages/Loading';
import Dashboard from './pages/Dashboard';
import LearningPath from './pages/LearningPath';
import Progress from './pages/Progress';
import SkillAnalysis from './pages/SkillAnalysis';
import Reports from './pages/Reports';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import { isLoggedIn } from './utils/helpers';

// Protected route wrapper
const Protected = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"            element={<Navigate to={isLoggedIn() ? '/dashboard' : '/login'} replace />} />
    <Route path="/login"       element={<Login />} />
    <Route path="/register"    element={<Register />} />
    <Route path="/loading"     element={<Protected><Loading /></Protected>} />
    <Route path="/skill-input" element={<Protected><SkillInputPage /></Protected>} />
    <Route path="/dashboard"   element={<Protected><Dashboard /></Protected>} />
    <Route path="/learning-path" element={<Protected><LearningPath /></Protected>} />
    <Route path="/progress"    element={<Protected><Progress /></Protected>} />
    <Route path="/skill-analysis" element={<Protected><SkillAnalysis /></Protected>} />
    <Route path="/reports"     element={<Protected><Reports /></Protected>} />
    <Route path="/recommendations" element={<Protected><Recommendations /></Protected>} />
    <Route path="/profile"        element={<Protected><Profile /></Protected>} />
    <Route path="*"            element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
